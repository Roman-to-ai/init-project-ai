---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*)
description: 按项目规范创建一次提交（Conventional Commits + 中文描述）
---

## 当前状态

- 分支：!`git branch --show-current`
- 状态：!`git status --short`
- 改动概览：!`git diff HEAD --stat`
- 最近提交：!`git log --oneline -10`

## 提交信息规范

**Conventional Commits + 中文描述**：

```
<type>(<scope>): <中文描述>

<正文：为什么这么改>（可选）
```

| type | 用在哪 |
|---|---|
| `feat` | 新功能 |
| `fix` | 修 bug |
| `docs` | 只改文档 |
| `refactor` | 重构（不改行为） |
| `perf` | 性能 |
| `test` | 测试 |
| `build` | 构建 / 依赖 / 配置 |
| `chore` | 其它杂项 |

**scope** 取改动涉及的区域 —— `biz` / `generator` / `theme` / `scripts` / `skill` / `docs` 之类。
确实跨区域的可以省略，写成 `chore: ...`。

**描述写「为什么」，不写「改了什么」** —— 代码本身就说明了改了什么。

## 铁律

- **不要 `git add -A` / `git add .`** —— 按文件名逐个加。
  这不是洁癖：`.claude/settings.local.json`（个人权限，优先级高于团队设置）、
  `.template-init.json`、上传产物这类东西一旦误提交就很难擦干净
- **提交前先看 `git status`**。看到不该提交的文件，停下来问人，别自己决定
- **一次提交只做一件事**。上面那几行 `git log` 有参考价值 —— 跟项目已有的写法保持一致

## 你的任务

1. 看状态与改动概览，判断这次改动**是不是一件事**。不是就先拆成多次提交
2. 逐个确认要提交的文件；`.gitignore` 之外的可疑文件要问人
3. 需要看细节时跑 `git diff HEAD -- <文件>`（概览只有统计，写信息前该看一眼具体改动）
4. 按规范写提交信息，`git add <具体文件>` 与 `git commit -m "..."` 在**同一条消息里**一起发出

> 想记录「这轮改动的来龙去脉、哪些**没验证**」——那是 `/ai-changelog` 的事，不是提交信息的事。
> 提交信息是原子的；变更日志是按轮次的。两者粒度不同，别混。
