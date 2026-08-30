# ADR-0004: ASR 通用接入层 —— 6 协议族自研适配器

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia（AI 提供分析）
- 决策现场：`docs/designs/library-showcase/asr.html`（三轮调研）

## 背景

课堂 45-90 分钟中文实时转写是生死线。三轮调研关键事实：① Web Speech API 在 Electron 不可用（Chromium 识别服务缺失，2026-08 官方仍 unavailable）；② 真流式已降到 ~1 元/小时量级；③ 用户成本敏感、手持多家低价 key（含长期订阅的阶跃星辰），要求支持任意自定义端点；④ 文件式 `/v1/audio/transcriptions` 是事实标准，实时 WS 只有方言无标准。

## 面临的选项

按协议族分层后：realtime-ws（阶跃 1.2 元/h、百炼 Qwen 1.19、OpenAI）、私有 WS（腾讯 1.0-3.2、讯飞 ~4.9-9.9）、OpenAI 兼容 REST（Groq/硅基/小米，0-0.5 元/h 但非真流式）、本地（sherpa-onnx 免费）；统一封装库（AI SDK transcribe / speechrouter 等）均不覆盖国内厂商。

## 决定

自研薄适配器层：统一 `ASRProvider` 接口（`start/sendAudio/stop` + `onPartial/onFinal/onError` + capabilities 声明）。**P0 三个适配器**：① `realtime-ws` 族（阶跃 `stepaudio-2.5-asr-stream` + 百炼 `qwen3-asr-flash-realtime` 双 dialect，上课默认）；② `transcriptions-rest` 族（覆盖一切 OpenAI 兼容端点 + 切片伪流式降级，UI 标注"准实时"）；③ `local-engine`（sherpa-onnx 离线兜底）。用户自定义接入必填：协议族 + dialect + baseURL + key + 模型 + 采样率（禁止从 URL 自动猜）。医学热词：产品预置学科热词表随请求注入 + 设置页可自定义。

## 理由

真流式成本已可接受，伪流式（8-12 秒延迟 + 切词）不配当上课主路径；协议族适配器让"接入任意新厂商"变成配置问题而非重构问题。

## 放弃了什么

腾讯医学引擎/讯飞 → 挪 P1（腾讯 HMAC 适配器 4-6 人日，工作量最大）；Google gRPC 不做；不为单一厂商引入停更的官方 npm SDK。

## 何时重审

P1 做医学模式时；某家推出 OpenAI Realtime 完全兼容端点时（可合并 dialect）。
