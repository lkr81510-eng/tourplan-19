// 브라우저 → /api/plan (Vercel 서버리스 함수) 호출
// Gemini 키는 서버에만 있으며, 브라우저 코드는 키를 알지 못합니다.

const TIMEOUT_MS = 40_000

export const DURATIONS = ['반나절', '하루']
export const STYLES = ['가족', '연인', '혼자', '친구']

export class PlanApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'PlanApiError'
    this.status = status
  }
}

/**
 * AI 여행 코스 요청 (api/plan.js 요청 형식)
 * @param {object} payload
 * @param {{ contentid: string, title: string, address?: string, region?: string, mapx?: number, mapy?: number }} payload.center
 * @param {{ contentid?: string, title: string, address?: string, type?: string, distance?: number }[]} payload.candidates 최대 15개
 * @param {'반나절'|'하루'} payload.duration
 * @param {'가족'|'연인'|'혼자'|'친구'} payload.style
 * @returns {Promise<{ title: string, summary: string, steps: { time: string, place: string, contentid: string|null, reason: string, tip: string }[] }>}
 */
export async function requestPlan(payload, { signal } = {}) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS)
  const combined =
    signal && typeof AbortSignal.any === 'function' ? AbortSignal.any([signal, timeout]) : signal || timeout

  let res
  try {
    res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: combined,
    })
  } catch (err) {
    if (signal?.aborted) throw err // 화면 이탈 등으로 취소
    if (timeout.aborted) throw new PlanApiError('AI 응답 시간이 초과되었습니다. 다시 시도해 주세요.')
    throw new PlanApiError('AI 서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.')
  }

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new PlanApiError(data?.error || `AI 추천 요청에 실패했습니다. (HTTP ${res.status})`, res.status)
  }
  // 로컬 `npm run dev`(Vite)에서는 /api 함수가 실행되지 않아 JSON 이 아닌 응답이 옴
  if (!data || !Array.isArray(data.steps)) {
    throw new PlanApiError('AI 추천 결과를 받지 못했습니다. (로컬에서는 `vercel dev`로 실행해야 합니다)')
  }
  return data
}
