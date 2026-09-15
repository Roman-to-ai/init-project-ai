/**
 * AI 工程层的定义 —— **单一事实来源**。
 *
 * 被 `scripts/init.mjs`（实例化时记一份基线哈希）和
 * `scripts/ai-layer-check.mjs`（事后比对差异）共用。
 * 两处各写一份的话，迟早会对不上，而"对不上"的表现是**静默漏检**。
 *
 * 与 `init.config.mjs` 的分工：那个管**占位符**，这个管**AI 工程层的范围**。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

/** AI 工程层的范围 —— 这几处是"模板能力"，不是"项目内容" */
export const LAYER_ROOTS = ['CLAUDE.md', 'README.md', '.gitlab-ci.yml', 'docs', '.claude', 'scripts']

/**
 * 本来就该两边不同的 —— **项目状态**，不是模板资产。
 * 不做排除的话，报告会被正常差异淹没。
 */
export const EXCLUDE = [
  'scripts/typecheck-baseline.json', // 棘轮基线：存量错误每个项目不一样
  'scripts/lint-baseline.json',
  'docs/业务',                       // 业务模块文档：生成物
  '.claude/settings.local.json',     // 个人设置：优先级高于团队设置
  '.claude/.state',
  '.ai-log',                         // 变更日志：项目自己的历史
  '.ai-layer-manifest.json',         // 基线记录本身
]

export const isExcluded = (rel) => EXCLUDE.some((e) => rel === e || rel.startsWith(`${e}/`))

/** 12 位够用了 —— 这不是防碰撞，是判断"变了没" */
const hash = (content) => createHash('sha256').update(content).digest('hex').slice(0, 12)

/**
 * 收集 AI 工程层的文件 → `{ 相对路径: 短哈希 }`。
 *
 * @param base      根目录
 * @param transform 可选的内容变换（`ai-layer-check` 用它把模板侧的占位符还原成实例取值）
 */
export function snapshotLayer(base, transform) {
  const out = new Map()

  const walk = (rel) => {
    if (isExcluded(rel)) return
    const abs = path.join(base, rel)
    if (!existsSync(abs)) return
    if (statSync(abs).isDirectory()) {
      for (const name of readdirSync(abs)) walk(rel ? `${rel}/${name}` : name)
      return
    }
    // 只比文本 —— 二进制的差异没有可操作性
    const buf = readFileSync(abs)
    if (buf.includes(0)) return
    const content = transform ? transform(buf.toString('utf8')) : buf
    out.set(rel, hash(content))
  }

  for (const r of LAYER_ROOTS) walk(r)
  return out
}

/** 基线文件的路径（相对仓库根） */
export const MANIFEST = '.ai-layer-manifest.json'
