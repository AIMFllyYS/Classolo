import { resolveSecret } from '@/lib/providers/secrets'

export type ImageSearchState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; alt: string }

export async function searchClassroomImage(
  query: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ImageSearchState> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { status: 'empty' }
  }
  const secret = resolveSecret('image-search')
  if (secret.value === null) {
    return {
      status: 'error',
      message: '缺密钥：未配置图片检索 API key',
    }
  }
  try {
    const url = new URL('https://api.unsplash.com/search/photos')
    url.searchParams.set('query', trimmed)
    url.searchParams.set('per_page', '1')
    const response = await fetchImpl(url.toString(), {
      headers: { Authorization: `Client-ID ${secret.value}` },
    })
    if (!response.ok) {
      return { status: 'error', message: `图片检索失败（${response.status}）` }
    }
    const payload: unknown = await response.json()
    const results = readResults(payload)
    const first = results[0]
    if (!first) {
      return { status: 'empty' }
    }
    return { status: 'ready', url: first.url, alt: first.alt || trimmed }
  } catch {
    return { status: 'error', message: '图片检索失败' }
  }
}

function readResults(
  payload: unknown,
): readonly { url: string; alt: string }[] {
  if (typeof payload !== 'object' || payload === null) return []
  const results = (payload as { results?: unknown }).results
  if (!Array.isArray(results)) return []
  const out: { url: string; alt: string }[] = []
  for (const item of results) {
    if (typeof item !== 'object' || item === null) continue
    const urls = (item as { urls?: { small?: unknown } }).urls
    const url = urls?.small
    if (typeof url !== 'string' || url.length === 0) continue
    const alt = (item as { alt_description?: unknown }).alt_description
    out.push({
      url,
      alt: typeof alt === 'string' ? alt : '',
    })
  }
  return out
}
