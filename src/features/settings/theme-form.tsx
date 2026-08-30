'use client'

import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  getThemePreference,
  setThemePreference,
  subscribeThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme/preference'

const OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: '跟随系统' },
  { value: 'light', label: '浅色' },
  { value: 'dark', label: '深色' },
]

export function ThemeSettingsForm() {
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    getThemePreference,
    () => 'system',
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>主题</CardTitle>
        <CardDescription>
          写入约定键 {THEME_STORAGE_KEY}（ADR-0014）。缺省跟随系统；强制浅色/深色后刷新由启动脚本读取同一键，避免闪白/闪黑。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2" role="group" aria-label="主题">
          {OPTIONS.map((option) => {
            const selected = preference === option.value
            return (
              <Button
                key={option.value}
                type="button"
                variant={selected ? 'default' : 'outline'}
                aria-pressed={selected}
                data-slot="theme-preference"
                data-theme={option.value}
                onClick={() => {
                  setThemePreference(option.value)
                }}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
