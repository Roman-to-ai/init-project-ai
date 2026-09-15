package @@JAVA_PACKAGE_ROOT@@.common.storage;

import java.io.File;
import @@JAVA_PACKAGE_ROOT@@.common.config.@@CONFIG_CLASS@@;
import @@JAVA_PACKAGE_ROOT@@.common.constant.Constants;
import @@JAVA_PACKAGE_ROOT@@.common.utils.StringUtils;

/**
 * 「对外相对路径」与「存储键」之间的唯一映射点。**两种存储实现都必须走这里。**
 *
 * ── 三个概念 ────────────────────────────────────────────────────
 *   磁盘绝对路径   D:/app/uploadPath/upload/2026/09/14/x.png
 *   存储键（MinIO  upload/2026/09/14/x.png
 *   对外相对路径   /profile/upload/2026/09/14/x.png      ← 入库、返回前端、给 delete/openStream
 *
 * 三者可互相推导，所以**数据库不需要为切换存储而改一个字节**，
 * 前端也不需要知道用的是哪种存储。
 *
 * ── 为什么必须收口 ──────────────────────────────────────────────
 * 原实现（FileUploadUtils.getPathFileName）是：
 *
 *     int dirLastIndex = @@CONFIG_CLASS@@.getProfile().length() + 1;
 *     substring(uploadDir, dirLastIndex)
 *
 * 那个 {@code + 1} 硬编码了「profile 与子目录之间恰好一个分隔符」。当
 * RUOYI_PROFILE 带尾斜杠（{@code D:/app/uploadPath/}，很常见）时，
 * getUploadPath() 是 {@code D:/app/uploadPath//upload}，截出来是 {@code /upload}，
 * 于是产出 {@code /profile//upload/...} —— 双斜杠。
 *
 * 本地模式下 Spring 会把 {@code //} 规范化掉，所以这个 bug 一直没暴露；
 * **但对象存储不会**：{@code /upload} 与 {@code upload} 是两个不同的 key，
 * 上传写进去的和代理读出来的对不上，症状是「接口返回 200、URL 看着正常，但图裂」。
 * 所以这个类不是「优雅一点」，是对象存储能跑通的必要条件。
 */
public final class FileStoragePath
{
    private FileStoragePath() {}

    /**
     * baseDir → 存储键前缀（{@code upload} / {@code avatar} / {@code import}）。
     *
     * @throws IllegalArgumentException baseDir 不在 profile 之下 —— 宁可报错也不要静默算出错的 key
     */
    public static String keyPrefix(String baseDir)
    {
        String profile = normalize(@@CONFIG_CLASS@@.getProfile());
        String dir = normalize(baseDir);
        if (StringUtils.isEmpty(profile) || StringUtils.isEmpty(dir) || !dir.startsWith(profile))
        {
            throw new IllegalArgumentException(
                    "baseDir 必须落在 " + @@CONFIG_CLASS@@.getProfile() + " 之下，收到：" + baseDir);
        }
        String rel = dir.substring(profile.length());
        while (rel.startsWith("/"))
        {
            rel = rel.substring(1);
        }
        return rel;
    }

    /** baseDir + 文件名 → 对外相对路径 */
    public static String toRelative(String baseDir, String fileName)
    {
        return Constants.RESOURCE_PREFIX + "/" + keyPrefix(baseDir) + "/" + fileName;
    }

    /**
     * 对外相对路径 → 存储键。对象存储的 objectName 就是它。
     * 注意剥前缀后**要去掉前导斜杠** —— {@code /profile/upload/x} → {@code upload/x}。
     */
    public static String toKey(String relativePath)
    {
        if (!managed(relativePath))
        {
            throw new IllegalArgumentException("不是受管的相对路径：" + relativePath);
        }
        String key = relativePath.substring(Constants.RESOURCE_PREFIX.length());
        while (key.startsWith("/"))
        {
            key = key.substring(1);
        }
        return key;
    }

    /** 对外相对路径 → 本地磁盘绝对路径。本地实现与对象存储的「存量回退」共用。 */
    public static String toLocalPath(String relativePath)
    {
        if (!managed(relativePath))
        {
            throw new IllegalArgumentException("不是受管的相对路径：" + relativePath);
        }
        return normalize(@@CONFIG_CLASS@@.getProfile()) + File.separator
                + toKey(relativePath).replace('/', File.separatorChar);
    }

    /**
     * 这个路径是不是「本存储该管的」。
     *
     * 用来挡住历史数据里的 http:// 外链（RuoYi 允许图片/头像字段直接存外链），
     * 以及 Excel 导出那种绝对本地路径 —— 不然 {@code delete("http://...")} 会去删一个
     * 名字叫 {@code http://...} 的对象。
     */
    public static boolean managed(String relativePath)
    {
        return !StringUtils.isEmpty(relativePath) && relativePath.startsWith(Constants.RESOURCE_PREFIX);
    }

    /** 统一反斜杠、去掉首尾斜杠、把连续斜杠压成一个 */
    private static String normalize(String p)
    {
        if (p == null)
        {
            return null;
        }
        String s = p.replace('\\', '/');
        while (s.contains("//"))
        {
            s = s.replace("//", "/");
        }
        while (s.endsWith("/"))
        {
            s = s.substring(0, s.length() - 1);
        }
        return s;
    }
}
