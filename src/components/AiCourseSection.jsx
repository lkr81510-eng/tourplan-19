import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNearbyCandidates } from '../api/tour'
import { DURATIONS, STYLES, requestPlan } from '../api/plan'
import ErrorMessage from './ErrorMessage'
import './StatusMessage.css'
import './AiCourseSection.css'

const MIN_CANDIDATES = 3
const STYLE_ICONS = { 가족: '👨‍👩‍👧', 연인: '💑', 혼자: '🚶', 친구: '🧑‍🤝‍🧑' }

const normalizeName = (s) => String(s ?? '').replace(/\s+/g, '').toLowerCase()

/** 거리(m) → "350m" / "2.4km" */
function formatDistance(m) {
  if (m === null || m === undefined) return ''
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`
}

/**
 * AI 여행 코스 추천
 * @param {object} place Detail 에서 정리한 상세 정보
 *   (contentid, title, regionName, address, mapx, mapy …)
 */
function AiCourseSection({ place }) {
  const [duration, setDuration] = useState(DURATIONS[0])
  const [style, setStyle] = useState(STYLES[0])
  // status: idle | candidates(주변 조회 중) | planning(AI 생성 중) | done | error | insufficient
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [plan, setPlan] = useState(null)
  const [candidates, setCandidates] = useState([])

  const inFlight = useRef(false) // 연타 방지 (같은 틱의 중복 클릭까지 차단)
  const controllerRef = useRef(null)

  // 화면을 떠나면 진행 중인 요청 취소
  useEffect(() => () => controllerRef.current?.abort(), [])

  const hasCoords = place.mapx !== null && place.mapy !== null
  const busy = status === 'candidates' || status === 'planning'

  const run = async () => {
    if (inFlight.current || !hasCoords) return
    inFlight.current = true
    const controller = new AbortController()
    controllerRef.current = controller
    setError('')
    setPlan(null)

    try {
      setStatus('candidates')
      const nearby = await getNearbyCandidates({
        mapx: place.mapx,
        mapy: place.mapy,
        excludeId: place.contentid,
        signal: controller.signal,
      })
      setCandidates(nearby)
      if (nearby.length < MIN_CANDIDATES) {
        setStatus('insufficient')
        return
      }

      setStatus('planning')
      const result = await requestPlan(
        {
          center: {
            contentid: place.contentid,
            title: place.title.slice(0, 200),
            address: place.address.slice(0, 200),
            region: place.regionName.slice(0, 200),
            mapx: place.mapx,
            mapy: place.mapy,
          },
          candidates: nearby.map(({ contentid, title, address, type, distance }) => ({
            contentid,
            title,
            address,
            type,
            ...(distance !== null ? { distance } : {}),
          })),
          duration,
          style,
        },
        { signal: controller.signal },
      )
      setPlan(result)
      setStatus('done')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message || 'AI 코스를 만들지 못했습니다.')
      setStatus('error')
    } finally {
      inFlight.current = false
    }
  }

  // 결과 장소 이름 → 후보 목록(또는 중심 장소)과 일치하는지 확인
  const findPlace = (name) => {
    const key = normalizeName(name)
    if (key === normalizeName(place.title)) return { ...place, isCenter: true }
    return candidates.find((c) => normalizeName(c.title) === key) ?? null
  }

  return (
    <section className="ai-course" aria-labelledby="ai-course-title" aria-busy={busy}>
      <div className="ai-course__header">
        <span className="ai-course__icon" aria-hidden="true">✨</span>
        <h2 id="ai-course-title">AI 여행 코스 추천</h2>
      </div>
      <p className="ai-course__desc">
        <strong>{place.title}</strong> 주변 10km 안의 관광지·음식점·문화시설로 코스를 짜 드려요.
      </p>

      {!hasCoords ? (
        <p className="ai-course__notice">이 장소는 좌표 정보가 없어 주변 코스를 추천할 수 없어요.</p>
      ) : (
        <div className="ai-course__form">
          <fieldset className="ai-course__group" disabled={busy}>
            <legend>여행 형태</legend>
            <div className="ai-course__chips">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={d === duration ? 'ai-chip ai-chip--active' : 'ai-chip'}
                  aria-pressed={d === duration}
                  onClick={() => setDuration(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="ai-course__group" disabled={busy}>
            <legend>여행 스타일</legend>
            <div className="ai-course__chips">
              {STYLES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={s === style ? 'ai-chip ai-chip--active' : 'ai-chip'}
                  aria-pressed={s === style}
                  onClick={() => setStyle(s)}
                >
                  <span aria-hidden="true">{STYLE_ICONS[s]}</span> {s}
                </button>
              ))}
            </div>
          </fieldset>

          <button type="button" className="ai-course__submit" onClick={run} disabled={busy}>
            {busy ? '추천 중…' : plan ? '다른 코스 추천받기' : 'AI 코스 추천받기'}
          </button>
        </div>
      )}

      {busy && (
        <div className="status-message ai-course__status" role="status" aria-live="polite">
          <div className="status-message__spinner" aria-hidden="true" />
          <p>{status === 'candidates' ? '주변 장소를 찾는 중이에요…' : 'AI가 코스를 짜는 중이에요… (10~20초)'}</p>
        </div>
      )}

      {status === 'insufficient' && (
        <p className="ai-course__notice">
          주변 10km 안에 추천할 장소가 {candidates.length}곳뿐이라 코스를 만들기 어려워요.
        </p>
      )}

      {status === 'error' && <ErrorMessage message={error} onRetry={run} />}

      {status === 'done' && plan && (
        <div className="ai-plan">
          {plan.title && <h3 className="ai-plan__title">{plan.title}</h3>}
          {plan.summary && <p className="ai-plan__summary">{plan.summary}</p>}

          <ol className="ai-plan__steps">
            {plan.steps.map((step, i) => {
              const match = findPlace(step.place)
              return (
                <li key={`${step.time}-${i}`} className="ai-step">
                  <div className="ai-step__time">{step.time}</div>
                  <div className="ai-step__card">
                    <div className="ai-step__head">
                      {match && !match.isCenter ? (
                        <Link to={`/detail/${match.contentid}`} className="ai-step__place ai-step__place--link">
                          {step.place}
                        </Link>
                      ) : (
                        <span className="ai-step__place">{step.place}</span>
                      )}
                      {match?.isCenter && <span className="ai-step__tag ai-step__tag--center">현재 장소</span>}
                      {match?.type && <span className="ai-step__tag">{match.type}</span>}
                      {match?.distance !== null && match?.distance !== undefined && (
                        <span className="ai-step__dist">{formatDistance(match.distance)}</span>
                      )}
                    </div>
                    {step.reason && <p className="ai-step__reason">{step.reason}</p>}
                    {step.tip && (
                      <p className="ai-step__tip">
                        <span aria-hidden="true">🚶 </span>
                        {step.tip}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <p className="ai-plan__disclaimer">
            ⓘ AI가 생성한 추천이며 운영 시간·요금은 현장에서 확인하세요.
          </p>
        </div>
      )}
    </section>
  )
}

export default AiCourseSection
