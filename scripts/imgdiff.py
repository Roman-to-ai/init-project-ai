#!/usr/bin/env python3
"""逐像素比对两张截图，用于样式/主题改造的回归验证。

项目没有测试，样式改动靠这个脚本兜底。约定：**默认主题下必须 0 像素差异**；
暗色模式除已知缺陷区（顶栏图标）外也应一致——已知区用 --mask 显式排除，
而不是靠嘴说"除某区域外"。

只依赖 Pillow，不依赖 numpy。

用法：
    python imgdiff.py before.png after.png
    python imgdiff.py before.png after.png --save-diff diff.png
    python imgdiff.py before.png after.png --mask 1080,0,240,60     # 排除顶栏图标区
    python imgdiff.py before.png after.png --tolerance 2 --max-diff-pixels 100
    python imgdiff.py a.png b.png --grid 8 --json

退出码：0 = 在阈值内；1 = 超出阈值；2 = 用法/IO 错误。
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError:  # pragma: no cover
    sys.stderr.write("需要 Pillow：pip install Pillow\n")
    sys.exit(2)

# Windows 控制台默认 GBK，中文输出会炸。强制 UTF-8。
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass


@dataclass
class Rect:
    x: int
    y: int
    w: int
    h: int

    @classmethod
    def parse(cls, spec: str) -> "Rect":
        """解析 'X,Y,W,H'。"""
        parts = spec.replace(" ", "").split(",")
        if len(parts) != 4:
            raise argparse.ArgumentTypeError(f"矩形格式应为 X,Y,W,H，收到 {spec!r}")
        try:
            x, y, w, h = (int(p) for p in parts)
        except ValueError:
            raise argparse.ArgumentTypeError(f"矩形坐标必须是整数，收到 {spec!r}")
        if w <= 0 or h <= 0:
            raise argparse.ArgumentTypeError(f"矩形宽高必须为正，收到 {spec!r}")
        return cls(x, y, w, h)

    @property
    def box(self) -> tuple[int, int, int, int]:
        return (self.x, self.y, self.x + self.w, self.y + self.h)

    def __str__(self) -> str:
        return f"{self.x},{self.y},{self.w},{self.h}"


@dataclass
class Result:
    path_a: str
    path_b: str
    size: tuple[int, int]
    total_pixels: int
    masked_pixels: int
    diff_pixels: int
    max_delta: int
    bbox: tuple[int, int, int, int] | None
    tolerance: int
    threshold: int
    masks: list[Rect] = field(default_factory=list)
    regions: list[dict] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return self.diff_pixels <= self.threshold

    @property
    def diff_ratio(self) -> float:
        effective = self.total_pixels - self.masked_pixels
        return self.diff_pixels / effective if effective else 0.0

    def to_json(self) -> dict:
        return {
            "pathA": self.path_a,
            "pathB": self.path_b,
            "size": list(self.size),
            "totalPixels": self.total_pixels,
            "maskedPixels": self.masked_pixels,
            "diffPixels": self.diff_pixels,
            "diffRatio": round(self.diff_ratio, 8),
            "maxDelta": self.max_delta,
            "bbox": list(self.bbox) if self.bbox else None,
            "tolerance": self.tolerance,
            "threshold": self.threshold,
            "masks": [str(m) for m in self.masks],
            "regions": self.regions,
            "passed": self.passed,
        }


def differing_mask(a: Image.Image, b: Image.Image, tolerance: int) -> Image.Image:
    """返回 L 模式掩码：差异 > tolerance 的像素为 255。

    用**逐通道最大绝对差**而不是亮度差——纯色相变化（如主色从蓝改绿）在亮度上
    可能几乎相等，用亮度判会漏掉，而那恰恰是主题改造最常见的改动。
    """
    diff = ImageChops.difference(a, b)
    r, g, bl = diff.split()[:3]
    peak = ImageChops.lighter(ImageChops.lighter(r, g), bl)
    if tolerance <= 0:
        return peak.point(lambda v: 255 if v > 0 else 0)
    return peak.point(lambda v: 255 if v > tolerance else 0)


def apply_masks(mask: Image.Image, masks: list[Rect]) -> None:
    """把已知例外区域在掩码上清零（原地）。"""
    for rect in masks:
        clipped = (
            max(0, rect.x),
            max(0, rect.y),
            min(mask.width, rect.x + rect.w),
            min(mask.height, rect.y + rect.h),
        )
        if clipped[2] > clipped[0] and clipped[3] > clipped[1]:
            mask.paste(0, clipped)


def region_breakdown(mask: Image.Image, grid: int) -> list[dict]:
    """把图切成 grid×grid，报告有差异的格子。用于定位差异落在页面的哪一块。"""
    if grid < 1:
        return []
    cw = mask.width / grid
    ch = mask.height / grid
    out = []
    for row in range(grid):
        for col in range(grid):
            box = (
                int(col * cw),
                int(row * ch),
                int((col + 1) * cw),
                int((row + 1) * ch),
            )
            if box[2] <= box[0] or box[3] <= box[1]:
                continue
            count = mask.crop(box).histogram()[255]
            if count:
                out.append(
                    {
                        "row": row,
                        "col": col,
                        "box": list(box),
                        "diffPixels": count,
                    }
                )
    out.sort(key=lambda r: r["diffPixels"], reverse=True)
    return out


def save_diff_image(
    base: Image.Image,
    mask: Image.Image,
    path: str,
    masks: list[Rect],
) -> None:
    """生成可视化：底图转灰度，差异处涂红，掩码区画黄框。"""
    canvas = base.convert("L").convert("RGB")
    red = Image.new("RGB", canvas.size, (255, 0, 0))
    canvas.paste(red, (0, 0), mask)

    draw = ImageDraw.Draw(canvas)
    for rect in masks:
        draw.rectangle(rect.box, outline=(255, 200, 0), width=2)
    canvas.save(path)


def compare(a_path: str, b_path: str, tolerance: int, masks: list[Rect], grid: int) -> tuple[Result, Image.Image, Image.Image]:
    img_a = Image.open(a_path).convert("RGB")
    img_b = Image.open(b_path).convert("RGB")

    if img_a.size != img_b.size:
        sys.stderr.write(
            f"尺寸不一致，无法逐像素比对：\n"
            f"  {a_path}  {img_a.size[0]}x{img_a.size[1]}\n"
            f"  {b_path}  {img_b.size[0]}x{img_b.size[1]}\n"
            f"截图前请确认视口大小、缩放比例、以及浏览器窗口是否一致。\n"
        )
        sys.exit(2)

    mask = differing_mask(img_a, img_b, tolerance)
    masked_pixels = 0
    if masks:
        apply_masks(mask, masks)
        for rect in masks:
            clipped = (
                max(0, rect.x),
                max(0, rect.y),
                min(mask.width, rect.x + rect.w),
                min(mask.height, rect.y + rect.h),
            )
            if clipped[2] > clipped[0] and clipped[3] > clipped[1]:
                masked_pixels += (clipped[2] - clipped[0]) * (clipped[3] - clipped[1])

    hist = mask.histogram()
    diff_pixels = hist[255]
    bbox = mask.getbbox()

    # 最大通道差（全图，不受掩码影响，便于判断"差得多不多"）
    peak = ImageChops.difference(img_a, img_b)
    max_delta = 0
    for ch in peak.split()[:3]:
        hist_ch = ch.histogram()
        for value in range(255, -1, -1):
            if hist_ch[value]:
                max_delta = max(max_delta, value)
                break

    result = Result(
        path_a=a_path,
        path_b=b_path,
        size=img_a.size,
        total_pixels=img_a.size[0] * img_a.size[1],
        masked_pixels=masked_pixels,
        diff_pixels=diff_pixels,
        max_delta=max_delta,
        bbox=bbox,
        tolerance=tolerance,
        threshold=0,
        masks=masks,
        regions=region_breakdown(mask, grid) if diff_pixels else [],
    )
    return result, img_a, mask


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="逐像素比对两张截图（样式/主题回归验证）",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "示例：\n"
            "  python imgdiff.py before/home.png after/home.png\n"
            "  python imgdiff.py before/home.png after/home.png --save-diff diff.png\n"
            "  python imgdiff.py before/x.png after/x.png --mask 1080,0,240,60\n"
        ),
    )
    parser.add_argument("before", help="改造前截图")
    parser.add_argument("after", help="改造后截图")
    parser.add_argument(
        "--tolerance",
        type=int,
        default=0,
        help="允许的单通道色差（0-255），默认 0（严格逐像素相同）",
    )
    parser.add_argument(
        "--max-diff-pixels",
        type=int,
        default=0,
        help="允许的差异像素数上限，超出则 exit 1。默认 0",
    )
    parser.add_argument("--save-diff", metavar="PATH", help="输出差异可视化图（差异涂红）")
    parser.add_argument(
        "--mask",
        type=Rect.parse,
        action="append",
        default=[],
        metavar="X,Y,W,H",
        help="排除已知例外矩形，可重复。如暗色顶栏图标区",
    )
    parser.add_argument(
        "--grid",
        type=int,
        default=0,
        help="按 N×N 网格报告差异分布（0 = 关闭），用于定位差异在页面哪一块",
    )
    parser.add_argument("--json", action="store_true", help="以 JSON 输出结果")
    args = parser.parse_args(argv)

    if not 0 <= args.tolerance <= 255:
        parser.error("--tolerance 必须在 0-255 之间")

    result, img_a, mask = compare(
        args.before, args.after, args.tolerance, args.mask, args.grid
    )
    result.threshold = args.max_diff_pixels

    if args.save_diff:
        save_diff_image(img_a, mask, args.save_diff, args.mask)

    if args.json:
        print(json.dumps(result.to_json(), ensure_ascii=False, indent=2))
        return 0 if result.passed else 1

    w, h = result.size
    print(f"比对  {args.before}")
    print(f"      {args.after}")
    print(f"尺寸  {w}x{h}  （{result.total_pixels:,} 像素）")
    if result.masks:
        print(f"掩码  {len(result.masks)} 个矩形，排除 {result.masked_pixels:,} 像素")
        for m in result.masks:
            print(f"        - {m}")
    print(f"容差  单通道 ≤ {args.tolerance}")
    print()

    if result.diff_pixels == 0:
        print("✅ 0 像素差异")
        return 0

    print(f"❌ 差异像素 {result.diff_pixels:,}  （{result.diff_ratio:.4%}）")
    print(f"   最大单通道色差 {result.max_delta}")
    if result.bbox:
        x0, y0, x1, y1 = result.bbox
        print(f"   差异包围盒   ({x0},{y0}) - ({x1},{y1})   即 {x1 - x0}x{y1 - y0}")

    if result.regions:
        print()
        print("   差异分布（按 N×N 网格，只列有差异的格子）：")
        for r in result.regions[:12]:
            box = r["box"]
            print(
                f"     行{r['row']} 列{r['col']}  "
                f"({box[0]},{box[1]})-({box[2]},{box[3]})  "
                f"{r['diffPixels']:,} 像素"
            )
        if len(result.regions) > 12:
            print(f"     …另有 {len(result.regions) - 12} 个格子")

    print()
    print(f"   阈值 {args.max_diff_pixels:,} 像素 → 超出")
    if args.save_diff:
        print(f"   差异图已写入 {args.save_diff}")
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except FileNotFoundError as e:
        sys.stderr.write(f"文件不存在：{e.filename}\n")
        sys.exit(2)
