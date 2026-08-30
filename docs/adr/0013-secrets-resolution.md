# ADR-0013: 密钥优先级 —— 用户配置高于 env

- 状态：Accepted
- 日期：2026-08-30
- 决策人：Sofia

## 背景

开发期依赖 `.env.local` 才能跑；桌面用户会在 exe 里填自己的 Key。两者冲突时必须有唯一规则，且密钥不能进业务数据库。

## 面临的选项

A. 只认 env；B. 只认设置页；C. **用户覆盖 > env > 空**。

## 决定

**C**。规格：[secrets-resolution.md](../specs/secrets-resolution.md)。入口 `src/lib/providers/secrets/`。

## 理由

env 是开发默认和未配设置时的降级；用户明确保存在桌面端的密钥必须赢，否则「设置页」是假的。

## 放弃了什么

把 key 写入 `cs_setting` 明文；打包时把 `NEXT_PUBLIC_` 当成发行版密钥通道。

## 何时重审

生态接入期出现「官方额度 vs 用户 BYOK」双通道时（再加一层 source=`ecosystem`，仍不得压过用户显式 BYOK，除非产品改口）。
