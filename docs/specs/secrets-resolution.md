# 密钥解析规格（容灾降级）

> Created: 2026-08-30
> Status: approved
> 决策：[ADR-0013](../adr/0013-secrets-resolution.md)
> 代码入口：`src/lib/providers/secrets/`

## 优先级（高 → 低）

1. **用户覆盖（最高）**  
   用户在 Electron 桌面应用（或日后设置页）里填写的 API 密钥。只要该字段非空，**一律覆盖 env**。
2. **运行时 env（默认 / 降级）**  
   开发机 `.env.local`，或 Electron 主进程在运行时读到的环境变量 / 应用旁 `.env`。有 env、用户还没填设置时，走这里——方便本地开发，也是「没配设置时的容灾」。
3. **未配置**  
   对应能力不可用，设置页提示去填。禁止静默用写死在源码里的 key。

伪代码：`userOverride?.trim() || env || null`，与 `resolveSecret()` 一致。

## 存储红线

- 密钥 **不进 PGlite**（见 [local-schema.md](./local-schema.md)）。
- 桌面端用户覆盖进 Electron `safeStorage`（打包阶段接入）；开发期可先放内存 + 本机不进 git 的文件，但接口仍走本模块。
- 禁止 `console.log` 密钥；禁止放进 zustand 可序列化快照 / CRP props。
- 静态导出后，**打包进 asar 的 `NEXT_PUBLIC_*` 不能当生产密钥源**。开发期若必须让浏览器读到 key，可用 `NEXT_PUBLIC_*` 仅作 env 降级，文档与设置页须标明「仅本地开发」。

## 调用方

`src/lib/ai/createModel`、ASR adapter 工厂只接收 `resolveSecret()` 的结果，不自己读 `process.env`。
