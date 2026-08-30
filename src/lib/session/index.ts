/**
 * Feature 跨域通信唯一入口（ADR-0017）。
 * 公开只读切片 / CRP 投影 / 命令总线在工作台落地时补齐。
 * 禁止用 features 互相 import 来「暂时凑合」；禁止在此存放 API key 或分屏比例。
 */
export {}
