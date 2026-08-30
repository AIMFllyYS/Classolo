# ADR-0008: 可拖拽分屏 —— react-resizable-panels（经 shadcn Resizable）

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/split-layout.html`

## 背景

工作台 = 左侧导航栏（可收起、比例可拖）+ 右侧双栏 + 各自下方渲染区：嵌套水平+垂直分割，比例持久化，平板触摸友好。

## 面临的选项

react-resizable-panels 4.12.3（gzip 11.1KB/0 依赖，shadcn Resizable 官方底层，嵌套/collapsible/useDefaultLayout/ARIA/触摸全覆盖）；allotment 1.20.5（~8 个月未发版，浏览器-only）；dockview/flexlayout（IDE dock 层，固定四区用不上）。

## 决定

**react-resizable-panels ^4.12.3，经 shadcn Resizable 组件使用**，封装层 `src/components/layout/`。布局比例持久化用 `useDefaultLayout` 默认 **localStorage**（布局是设备级偏好，不进 PGlite）。

## 理由

固定四区不需要 dock 层；同栈（shadcn 官方封装）、体积依赖最低档、维护活跃。

## 放弃了什么

dock 层的拖拽重排/标签页能力（产品形态用不到）。

## 何时重审

产品出现"用户自定义面板排布"需求时。
