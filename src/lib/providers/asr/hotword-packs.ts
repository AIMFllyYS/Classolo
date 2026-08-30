export interface HotwordPack {
  id: string
  label: string
  terms: readonly string[]
}

export const HOTWORD_PACKS: readonly HotwordPack[] = [
  {
    id: 'physics',
    label: '物理',
    terms: [
      '牛顿第一定律',
      '牛顿第二定律',
      '牛顿第三定律',
      '加速度',
      '动能定理',
      '动量守恒',
      '万有引力',
    ],
  },
  {
    id: 'medicine',
    label: '医学',
    terms: [
      '心肌梗死',
      '肾功能不全',
      '解剖学',
      '动脉粥样硬化',
      '降钙素',
      '淋巴细胞',
    ],
  },
]

const DEFAULT_PACK_ID = 'physics'

let selectedPackId: string = DEFAULT_PACK_ID

export function listHotwordPacks(): readonly HotwordPack[] {
  return HOTWORD_PACKS
}

export function selectHotwordPack(id: string): void {
  const pack = HOTWORD_PACKS.find((item) => item.id === id)
  if (!pack) {
    throw new Error(`未知热词包：${id}`)
  }
  selectedPackId = pack.id
}

export function getSelectedHotwordPackId(): string {
  return selectedPackId
}

export function resolveHotwordPack(id: string = selectedPackId): readonly string[] {
  const pack = HOTWORD_PACKS.find((item) => item.id === id)
  if (!pack) return HOTWORD_PACKS[0]?.terms ?? []
  return pack.terms
}

export function resetHotwordPackSelection(): void {
  selectedPackId = DEFAULT_PACK_ID
}
