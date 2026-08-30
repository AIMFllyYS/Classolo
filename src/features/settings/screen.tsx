'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { AiSettingsForm } from './ai-form'
import { AsrSettingsForm } from './asr-form'

export function SettingsScreen() {
  return (
    <Tabs defaultValue="ai" className="mt-8">
      <TabsList>
        <TabsTrigger value="ai">AI</TabsTrigger>
        <TabsTrigger value="asr">ASR</TabsTrigger>
        <TabsTrigger value="hotwords">热词</TabsTrigger>
        <TabsTrigger value="theme">主题</TabsTrigger>
      </TabsList>
      <TabsContent value="ai" className="mt-4">
        <AiSettingsForm />
      </TabsContent>
      <TabsContent value="asr" className="mt-4">
        <AsrSettingsForm />
      </TabsContent>
      <TabsContent
        value="hotwords"
        className="mt-4 text-sm text-muted-foreground"
      >
        热词自定义将在后续设置卡落地。
      </TabsContent>
      <TabsContent value="theme" className="mt-4 text-sm text-muted-foreground">
        主题默认跟随系统；强制切换将在后续设置卡落地。
      </TabsContent>
    </Tabs>
  )
}
