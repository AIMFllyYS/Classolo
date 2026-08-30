# ADR-0009: Electron 集成 —— 静态导出 + app:// 协议 + electron-builder

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/electron-nextjs.html`

## 背景

P0 后期打包 Windows exe 分发（不上商店，需自动更新）。功能约束：麦克风、本地数据库、系统通知、后台任务。

## 面临的选项

运行模式：(a) `output: 'export'` 静态导出 + 自定义协议；(b) 内嵌 `next start`/standalone（保留全部 App Router 但体积更大、无官方 Electron 指南）；(c) Nextron（单人维护、找维护者中、与 src/app 结构打架）。打包器：electron-builder（NSIS + electron-updater）vs Electron Forge（Windows 一等公民是 Squirrel/WiX，非 NSIS）。

## 决定

**静态导出 + `app://` 特权自定义协议（`registerSchemesAsPrivileged`，禁止 file://——Electron 安全清单明令）+ electron-builder（钉 26.15.7 / dist-tag v26，勿盲信 npm latest）+ electron-updater，更新托管 GitHub Releases**（仓库开源）。代码签名 P0 不做。系统能力（麦克风、通知、PGlite 落盘、powerSaveBlocker）全部在 main process，IPC 供 renderer。

## 理由

与 `output: 'export'` 配置一致；NSIS + electron-updater 是 Windows 最成熟组合；GitHub Releases 免运维。

## 放弃了什么

Server Actions / 动态 Route Handlers（桌面包内不可用，已从代码库移除 api/）；"请勿关机"只能通知文案提醒（powerSaveBlocker 拦不了关机）。已知坑：Windows 通知需 `app.setAppUserModelId`；Node 要求 ≥22.12。

## 何时重审

需要 macOS/Linux 分发或上商店时（签名与打包矩阵重评）。
