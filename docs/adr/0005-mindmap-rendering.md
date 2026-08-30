# ADR-0005: 思维导图渲染 —— @xyflow/react + @dagrejs/dagre

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/mindmap.html`

## 背景

笔记区在录音中恒为思维导图形态（参考飞书妙记），AI 每隔几秒输出更新后的大纲——硬约束是**增量更新不闪烁**（已有节点身份稳定、禁止整图卸载重建）。

## 面临的选项

层 A markdown→导图（markmap 0.18.12：单人维护、key 按遍历序号+内容哈希，中途插入会换节点、无 onNodeClick）；层 B 专用脑图（mind-elixir 5.15.1：0 依赖 29KB 但 refresh 整图重绘且 npm latest 是 6.0-next；simple-mind-map：unpacked 25MB 不可当核心依赖）；层 C 通用节点图 + 自动布局（@xyflow/react 12.11.5：gzip 58.5KB/3 依赖、只重绘变化节点、生态 StudySolo 同款）。

## 决定

**层 C：@xyflow/react ^12.11.5 + @dagrejs/dagre ^3.1.1**（MIT）。增量思路：markdown 大纲解析为稳定 id 树 → 与上一帧 diff → 旧 id 保留 position，新 id 计算坐标 + 进入动画。P0 先树状布局，用自定义节点做脑图外观（用户已接受）。

## 理由

只有层 C 能完全掌控节点身份与坐标稳定性；与生态同款库，经验/lessons 可复用；onNodeClick 支持"点节点回跳文稿"。

## 放弃了什么

markmap 的 markdown 直出便利；mind-elixir 的开箱中心放射外观。**禁令：elkjs（EPL/GPL copyleft）、d3-flextree（2021 停更 + prepare 脚本）不得引入。**

## 何时重审

若自研脑图外观成本远超预期，回退 mind-elixir@5.15.1（钉版、用 addChild 保 id、禁 refresh）。
