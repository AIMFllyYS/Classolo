'use client'

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

import { AiSettingsForm } from './ai-form'
import { AsrSettingsForm } from './asr-form'
import { HotwordsSettingsForm } from './hotwords-form'
import { ThemeSettingsForm } from './theme-form'

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
      <TabsContent value="hotwords" className="mt-4">
        <HotwordsSettingsForm />
      </TabsContent>
      <TabsContent value="theme" className="mt-4">
        <ThemeSettingsForm />
      </TabsContent>
    </Tabs>
  )
}
