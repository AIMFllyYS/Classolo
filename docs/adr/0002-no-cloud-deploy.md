# ADR-0002: 无云部署 —— 移除 EdgeOne，生态期走宝塔

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）

## 背景

初版脚手架（旧版 demo-init）默认捆绑腾讯云 EdgeOne Pages。用户明确：1037Solo 生态全部使用宝塔（BaoTa）自部署（见生态仓库 `1037Solo-Ecosystem/linux-bt/`，每子域一份 nginx conf + deploy.sh），且前期开发与部署完全无关。

## 面临的选项

A. 保留 EdgeOne 配置备用；B. 全部删除，Web 版部署留到生态接入期按宝塔模式做。

## 决定

**B**。删除 `edgeone.json`、`docs/ops/deploy-edgeone.md` 及一切 EdgeOne 引用。P0-P2 交付物 = 本地 dev + Electron exe。生态期 Web 版 = 宝塔 nginx 反代本地 4070 服务 + `classolo.1037solo.com.conf`。

## 理由

EdgeOne 配置会误导后续 AI/协作者；`output: 'export'` 保留（Electron 需要），与部署无关。

## 放弃了什么

EdgeOne 的 CDN/云函数能力（本项目用不到）。

## 何时重审

生态接入期做 Web 版时。
