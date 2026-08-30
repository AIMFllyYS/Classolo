import { createModel, streamText } from '@/lib/ai'
import { resolveSecret } from '@/lib/providers/secrets'
import { getNotesPublic, getTranscriptPublic } from '@/lib/session'

import { patchChatPrivate } from './chat-store'
import {
  searchTranscriptSnapshot,
  searchTranscriptTool,
} from './search-transcript'

export type ChatDeltaStream = (
  prompt: string,
) => AsyncIterable<{ text?: string; reasoning?: string }>

function readAiRuntime(): { baseUrl: string; model: string } {
  const env =
    typeof process === 'undefined' || !process.env ? undefined : process.env
  return {
    baseUrl:
      env?.NEXT_PUBLIC_AI_BASE_URL?.trim() ||
      env?.AI_BASE_URL?.trim() ||
      'https://api.openai.com/v1',
    model:
      env?.NEXT_PUBLIC_AI_MODEL?.trim() ||
      env?.AI_MODEL?.trim() ||
      'z-ai/glm-5.3-flash',
  }
}

async function* defaultModelStream(
  prompt: string,
): AsyncIterable<{ text?: string; reasoning?: string }> {
  const secret = resolveSecret('ai')
  if (secret.value === null) {
    throw new Error('缺密钥：未配置 AI API key')
  }
  const runtime = readAiRuntime()
  const result = streamText({
    model: createModel(runtime),
    prompt,
    tools: { search_transcript: searchTranscriptTool },
  })
  for await (const part of result.textStream) {
    yield { text: part }
  }
}

export async function runChatTurn(
  prompt: string,
  stream: ChatDeltaStream = defaultModelStream,
): Promise<void> {
  const outline = getNotesPublic()
    .outlineDigest.map((node) => node.title)
    .join('、')
  const recent = getTranscriptPublic()
    .committed.slice(-6)
    .map((segment) => segment.text)
    .join('\n')
  const hits = searchTranscriptSnapshot(prompt)
  const evidence =
    hits.length > 0
      ? hits
          .map((hit) => `[${hit.segmentId}] ${hit.text}`)
          .join('\n')
      : '（无命中，请调用 search_transcript 工具）'
  const packed = `课堂提纲：${outline || '（尚无）'}\n最近文稿：\n${recent}\n检索命中：\n${evidence}\n\n学生提问：${prompt}`
  patchChatPrivate({
    streaming: true,
    answer: '',
    reasoning: '正在思考…',
  })
  try {
    let answer = ''
    for await (const delta of stream(packed)) {
      if (delta.reasoning) {
        patchChatPrivate({ reasoning: delta.reasoning })
      }
      if (delta.text) {
        answer += delta.text
        patchChatPrivate({ answer })
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '对话失败'
    patchChatPrivate({ answer: message, reasoning: '' })
  } finally {
    patchChatPrivate({ streaming: false })
  }
}
