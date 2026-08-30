import type { RenderModuleRegistry } from './manifest'

/**
 * P0 模块在后续 issue 注册（image / rich-text / ai-ask / gen-ui / agent-status）。
 * Host 对未注册模块与非法 props 一律走错误卡片，不白屏。
 */
export const renderModuleRegistry: RenderModuleRegistry = {}
