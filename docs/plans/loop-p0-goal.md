# P0 Loop 目标提示词（无人值守）

把下面整段粘进新的 Cursor 会话，或用作 Cursor Goal。仓库：[`AIMFllyYS/Classolo`](https://github.com/AIMFllyYS/Classolo)。开发基线 **`dev`**。

**Skill**：实现与 PR 走 `/agents:issue-to-pr`（查表 [`docs/skills-registry.md`](../skills-registry.md)）。该 skill 里「对人提问 / 对齐后再动手」**一律跳过**——本 Goal 没有人值守。

**模型**：实现可用当前会话模型。审查子智能体只用 **Cursor Grok 4.6 xhigh**。不要用 Opus 写代码或审查。

**成功标准**：把本批次所有「可做的」P0 sub-issue 都变成「已开向 `dev` 的 PR」或「已跳过并写明原因」。不要等 Sofia。不要自己 merge。不要宣布 Demo 完成。

---

## 批次范围

- 做：标签同时有 `P0` + `loop-ready`、无 `blocked`、无 `area:electron` 的 **sub-issue**（不是 parent epic）。
- 不做：Electron、P1/P2/生态、新建 Issue。
- Demo 闸门（PRD D1–D5）仍以 Loop 20 为人工冻结点，但 **Loop 不要在 Loop 20 停机**——继续做 Loop 21–35，直到本批次没有可做的卡。
- 编号总表：[`prd-engineering.md` 附录](./prd-engineering.md)。队首无依赖卡：[#10](https://github.com/AIMFllyYS/Classolo/issues/10) 先于 [#33](https://github.com/AIMFllyYS/Classolo/issues/33)。

---

## 核心原则：卡住先自愈，不能解就换卡，批次不停

无人值守的默认动作是 **继续**。一张卡失败 ≠ 整批停机。

遇到任何问题，按这个顺序，**先分析再动手**（分析写进该 issue 评论，给以后的人看）：

### 1. 能自己解决 → 解决，然后继续当前卡

包括但不限于：

| 现象 | 自己做 |
|---|---|
| `pnpm lint` / `tsc` / 审查未过 | 修到过，再走验收 |
| 从 `dev` rebase 冲突 | 解决冲突；禁止 force push |
| Issue 正文过时、路径写错、实现暗示和代码不一致 | 以 **当前代码 + ADR/spec** 为准实现；在评论里写「过时引导」 |
| PRD / roadmap / 本提示词与 ADR 或代码事实冲突（笔误、编号、排期口误、过时现状） | **允许改** `docs/plans/*`（及本文件），改完写进当前 PR；以 ADR 为准去纠正规划，而不是反过来推翻 ADR |
| 实现中纠正了对某库的错误认知 | 向 `docs/lessons/<lib>.md` 申请追加（当前 PR 带上） |
| 建表前发现 spec 与验收无法同时成立 | 先改 `docs/specs/local-schema.md` 再改表（软约束） |
| UI 验收失败 | 修行为，再在浏览器走一遍 |
| CI 红且原因清楚（lint、类型、漏文件） | 推修；同一张卡同一原因最多修 **3** 轮 |

规划文档可以改「事实与排期口误」，**不可以**改产品范围（例如把 Electron 塞进 Demo、开放动态路由、换掉本地优先）。那种是跳过，不是改文档。

### 2. 不能解决 → 跳过这张，做下一张

跳过前必须已经：**诊断过** + **至少认真修过一轮**（或能说明为何一轮都无法开始，例如硬缺人类批准的生产依赖）。

然后：

1. 在该 issue 评论写清：试了什么、为什么判不可解、建议人类下一步。
2. 打上 `blocked`（这样选卡规则会自动排除它）。
3. **不要**提交半残代码、**不要**开半残 PR、**不要** force push。本地分支可丢弃。
4. 立刻按选卡规则取下一张，继续批次。

典型「跳过、不要停整批」：

- 必须新增生产依赖（AI 无权自装；评论里列候选，等人类）
- 必须改根级配置且会破坏 `output: 'export'` 三件套 / 引入云平台配置
- 必须推翻已有 ADR，或验收与 ADR 互斥且规划改不了
- 缺用户密钥 / 麦克风 / 外网才能测的路径，而本卡验收**离开真环境无法机械判定**
- 同一张卡 CI 同因红满 3 轮仍不懂
- 依赖的 `#N` 其实没关，或实现时才发现被另一张未做卡挡住

### 3. 只有这些才允许停止整个 Goal

- 选卡规则下 **一张可做的卡都没有了**（批次完成，含「剩下的全是 blocked / electron / 依赖未关」）。
- 继续会做出 **破坏性操作**（见下方禁止清单）。
- 仓库无法工作：不能 fetch `dev`、不能装依赖、工作树被弄脏且无法安全丢弃——写清状态后停。

**不要**因为「连续跳过 2 张」就停。跳过是预期路径。整批做完或真的没有下一张可做，才向 Sofia 汇报。

---

## 每张卡：了解 → 写代码 → 审查 → 推进

覆盖 issue-to-pr 的实现与开 PR；**跳过它对齐人类的步骤**。

1. **了解**  
   选卡 → `gh issue view` → 读点名的 ADR/spec/PRD → 意图审计（目标、现状、过时引导、风险）。有歧义先按 ADR + 验收清单推断；推断不了再走「跳过」。

2. **写代码**  
   - 最新 `dev` 拉 `feat/<issue-number>-<slug>`。  
   - **只做该 Issue 验收**。不顺手做下一张。  
   - 禁止动态 Route Handler / Server Action / `middleware.ts`；禁止硬编码品牌色；跨 feature 只经 `src/lib/session`；密钥只走 `resolveSecret`。  
   - 不新增生产依赖。不碰 Electron。

3. **审查**  
   派 **一条** Grok 4.6 xhigh，对照验收 + [`docs/conventions/code-review.md`](../conventions/code-review.md)。不通过就修；修到过再 PR。审查器本身挂了 → 自己按同一清单过一遍，评论注明「子智能体未跑成」，不要因此停批。

4. **推进**  
   - UI：浏览器走验收路径（不是一张截图）。无浏览器工具时用最接近的替代（dev server / 测试），在 PR 写清未验证项。  
   - `pnpm lint` 与 `pnpm tsc --noEmit` 退出码 0；验收写了 `build` 则也要绿。  
   - PR **base = `dev`**。正文 skill `/agents:issue-to-pr`。**全文仅一条** `Closes #<n>`（只关当前 sub，不关 parent）。  
   - **不要 merge**。然后选下一张。

---

## 选卡规则（机械执行）

```text
gh issue list --repo AIMFllyYS/Classolo --state open --limit 200 \
  --label "P0,loop-ready" --json number,title,labels,body
```

队首须同时满足：

1. `P0` + `loop-ready`  
2. 无 `blocked`  
3. 无 `area:electron`  
4. 是 sub-issue，不是 parent epic  
5. 正文 `Depends on: #N` 里每个 `#N` 已 **closed**。「#29 或 #30」任一 closed 即可。无 Depends on 行 = 无依赖  
6. 多张可做时：PRD Loop 序号更小优先，其次 issue 编号升序  

不要给 Electron 子卡加 `loop-ready`。不要在 Loop 里 `gh issue create`。

---

## 禁止（破坏性 / 越权 — 碰到就停或改走跳过）

这些不是「修一下就能做」的：

- Force push、hard reset、跳过 hook、改 git config、删除 lockfile 后重装碰运气  
- 提交 `.env*` / 密钥  
- PR 打向 `main`；自己 merge 任何 PR  
- 一个 PR `Closes` 多张卡  
- 新增生产依赖、为桌面引入 Electron 包  
- 实现 NSIS / `app://` / sherpa-onnx  
- 把规划改成违反 ADR 的产品决策  

Windows + PowerShell：不要用 bash `&&` / heredoc。多行 commit 用 `git commit -F <file>`。

---

## 建议命令

```powershell
gh issue list --repo AIMFllyYS/Classolo --state open --limit 200 --label "P0,loop-ready" --json number,title,labels,body
gh issue view 10 --repo AIMFllyYS/Classolo
gh issue view 10 --repo AIMFllyYS/Classolo --json state
```

```powershell
pnpm lint
pnpm tsc --noEmit
git push -u origin HEAD
gh pr create --base dev --title "..." --body "..."
```

跳过时：

```powershell
gh issue comment <n> --repo AIMFllyYS/Classolo --body "..."
gh issue edit <n> --repo AIMFllyYS/Classolo --add-label blocked
```
