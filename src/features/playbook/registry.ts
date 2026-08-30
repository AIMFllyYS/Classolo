/**
 * Playbook 是动效与预设前端组件的唯一登记处（ADR-0012）。
 * 共享动画、可复用 UI 块、CRP 模块演示必须先在此登记，再在业务里引用 id。
 * 禁止在某个 feature 里私自发明一套不进 Playbook 的「临时动效」。
 */

export const playbookNav = [
  { href: '/playbook/', label: '概览' },
  { href: '/playbook/ui/', label: 'UI 预设' },
  { href: '/playbook/motion/', label: '动效' },
  { href: '/playbook/modules/', label: '渲染模块' },
] as const

export type PlaybookPresetStatus = 'ready' | 'planned'

export interface PlaybookPreset {
  id: string
  title: string
  status: PlaybookPresetStatus
  summary: string
}

export const uiPresets: PlaybookPreset[] = [
  {
    id: 'classroom-ui-kit',
    title: '课堂基础组件',
    status: 'ready',
    summary:
      '按钮、输入、选择、开关、标签页、卡片、对话框、toast；封装层 src/components/ui',
  },
  {
    id: 'workbench-shell',
    title: '工作台壳层',
    status: 'planned',
    summary: '左侧导航 + 文稿/笔记分屏 + 双渲染区，经 src/components/layout',
  },
  {
    id: 'classroom-mindmap',
    title: '课堂思维导图',
    status: 'ready',
    summary: 'xyflow + dagre 树布局与课堂节点外观；封装层 src/components/mindmap',
  },
]

export const motionPresets: PlaybookPreset[] = [
  {
    id: 'mindmap-node-enter',
    title: '导图节点进入',
    status: 'planned',
    summary: '新节点进入动画；已有节点禁止闪烁重挂（ADR-0005）',
  },
]

export const modulePresets: PlaybookPreset[] = [
  { id: 'image', title: 'image', status: 'planned', summary: '图片检索渲染' },
  { id: 'rich-text', title: 'rich-text', status: 'planned', summary: '富文本补充' },
  { id: 'ai-ask', title: 'ai-ask', status: 'planned', summary: '随堂提问卡片' },
  { id: 'gen-ui', title: 'gen-ui', status: 'planned', summary: '受控 DSL 生成式 UI' },
  { id: 'agent-status', title: 'agent-status', status: 'planned', summary: '静默 Agent 思考态' },
]
