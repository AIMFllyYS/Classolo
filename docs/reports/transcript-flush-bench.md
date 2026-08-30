# 转写批量落盘压测（P0-INF-05 / #14）

- 日期：2026-08-31
- 环境：Windows，Node 24，PGlite 0.5.8 memory（无 IndexedDB）
- 命令：`pnpm dlx tsx src/features/transcript/flush.probe.ts`

## 口径（local-schema §4.6）

模拟 90 分钟、1800 个 final 段，按 20 段一批 flush。

## 结果

| 指标 | 验收线 | 实测 |
|---|---|---|
| 行数 | 1800 | 1800 |
| p95 单次 flush | < 50ms | **2ms** |
| 单次 max | ≤ 300ms | **4ms** |
| 落库总耗时 | < 5s | **152ms** |
| 重复 seq | 不产生重复行 | `ON CONFLICT DO NOTHING` 写入 0 行 |

输出摘要：`flush:batch=20;rows=1800;p95=2ms;max=4ms;total=152ms`

## 未在本机实测的项

- 浏览器 IndexedDB + `relaxedDurability` 的库文件增量（memory 后端无文件）
- 真实 UI 掉帧；flush 在 `onFinal` 上 `void` 发出，不 await，不阻塞 PCM 回调
- 强制 kill 进程后丢失窗口：设计上未 flush 的 ring 最多约 10 秒 / 20 段；三次失败进 `classolo.transcript.overflow.<sessionId>`

## 结论

当前量级下 PGlite 批量 INSERT 远低于 ADR-0007 重审线，**不触发**回退 better-sqlite3。
