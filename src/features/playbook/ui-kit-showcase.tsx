'use client'

import { useState } from 'react'

import { classroomMarkdownKit } from '@/components/markdown'
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  classroomUiKit,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'

export function UiKitShowcase() {
  const { Button, Input, Select, Switch, Tabs, Card, Dialog, toast } =
    classroomUiKit
  const { MarkdownStream } = classroomMarkdownKit
  const [hotwordsOn, setHotwordsOn] = useState(false)
  const [dialect, setDialect] = useState('stepfun')

  return (
    <section className="mt-10 space-y-8" data-slot="classroom-ui-kit">
      <Card>
        <CardHeader>
          <CardTitle>课堂基础组件</CardTitle>
          <CardDescription>
            按钮、输入、选择、开关、标签页、卡片、对话框、toast。颜色走 StudySolo
            语义令牌。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button">主按钮</Button>
            <Button type="button" variant="outline">
              次按钮
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => toast('课堂 toast 可用')}
            >
              弹出 toast
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button type="button" variant="ghost">
                  打开对话框
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认开始上课</DialogTitle>
                  <DialogDescription>
                    对话框由 UI 封装层提供，不硬编码品牌色。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button">知道了</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-foreground">
              模型
              <Input placeholder="gpt-4.1-mini" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-foreground">
              ASR dialect
              <Select value={dialect} onValueChange={setDialect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择 dialect" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stepfun">stepfun</SelectItem>
                  <SelectItem value="qwen">qwen</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-foreground">
            <Switch
              checked={hotwordsOn}
              onCheckedChange={setHotwordsOn}
              aria-label="热词"
            />
            热词包 {hotwordsOn ? '开' : '关'}
          </label>

          <Tabs defaultValue="form">
            <TabsList>
              <TabsTrigger value="form">表单</TabsTrigger>
              <TabsTrigger value="note">笔记</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="pt-3 text-sm text-muted-foreground">
              设置页将复用同一套输入与选择。
            </TabsContent>
            <TabsContent value="note" className="pt-3 text-sm text-muted-foreground">
              <MarkdownStream markdown={'**补充讲解** 走 Markdown 封装层，可流式追加。'} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  )
}
