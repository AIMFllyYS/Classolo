# docs/ops/

运维与操作指南。

## 用途

存放部署和运行相关的操作教程，包括：
- 本地运行教程（环境搭建、开发服务器启动、调试配置）
- Electron 打包与发布教程（NSIS 构建、GitHub Releases 自动更新）
- 环境配置指南（Node ≥22.12、pnpm 配置、IDE 设置）
- 故障排查指南（常见问题与解决方案）

> 本项目**无云部署**（ADR-0002）：P0-P2 交付物 = 本地 dev + Electron exe。
> 生态接入期的 Web 版走 1037Solo 统一宝塔自部署（届时新增 `deploy-baota.md`）。

## 文件命名

- `local-setup.md` — 本地环境搭建
- `electron-packaging.md` — Electron 打包发布指南
- `env-config.md` — 环境变量配置
- `troubleshooting.md` — 故障排查
