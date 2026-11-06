// TourAPI 응답에 섞인 HTML 을 안전하게 다루기 위한 유틸
// - HTML 은 절대 렌더링하지 않고(dangerouslySetInnerHTML 미사용) 순수 텍스트로만 변환합니다.
// - 링크는 http/https 주소만 허용합니다.

const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  middot: '·',
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })
}

/** HTML 섞인 문자열 → 줄바꿈이 살아 있는 일반 텍스트 */
export function htmlToText(value) {
  if (value === undefined || value === null) return ''
  const text = String(value)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '') // 내용까지 제거
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
    .replace(/<[^>]*>/g, '') // 태그 제거
  return decodeEntities(text)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** http/https 주소만 통과, 그 외(javascript:, data: 등)는 null */
export function safeUrl(raw) {
  if (!raw) return null
  let value = decodeEntities(String(raw).trim())
  if (/^www\./i.test(value)) value = `http://${value}`
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

/**
 * HTML/텍스트에서 안전한 링크 목록 추출 (href 속성 + 본문에 적힌 주소)
 * @returns {string[]} 중복 제거된 http/https 주소
 */
export function extractLinks(value) {
  if (!value) return []
  const source = String(value)
  const candidates = []
  for (const m of source.matchAll(/href\s*=\s*["']?([^"'\s>]+)/gi)) candidates.push(m[1])
  const plain = htmlToText(source)
  for (const m of plain.matchAll(/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi)) candidates.push(m[1])

  const result = []
  for (const candidate of candidates) {
    const url = safeUrl(candidate.replace(/[),.]+$/, ''))
    if (url && !result.includes(url)) result.push(url)
  }
  return result
}

/** 링크 표시용 짧은 문자열 (도메인 + 경로) */
export function displayUrl(href) {
  try {
    const url = new URL(href)
    const path = url.pathname === '/' ? '' : url.pathname
    return `${url.hostname}${path}`
  } catch {
    return href
  }
}
