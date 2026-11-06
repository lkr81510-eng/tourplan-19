import { useEffect, useState } from 'react'
import { getFestivals, formatYmd, toYmd } from '../api/tour'
import EventCard from '../components/EventCard'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import './Home.css'

const EVENT_COUNT = 10

function Home() {
  // 검색 조건 상태값 — 지금은 기본값만 사용, 나중에 검색창(2번)·테마 버튼(3번)과 연결
  const [region] = useState('') // 법정동 시도코드(lDongRegnCd), '' = 전국
  const [date] = useState(() => toYmd()) // 'YYYYMMDD', 기본값 오늘
  const [theme] = useState('') // 테마 카테고리, '' = 전체 (아직 API 에 반영하지 않음)

  const [retryCount, setRetryCount] = useState(0)
  // 결과는 어떤 조건(key)으로 받아온 것인지 함께 저장 → key 가 다르면 로딩 중
  const [result, setResult] = useState({ key: null, items: [], error: null })

  const requestKey = `${region}|${date}|${theme}|${retryCount}`
  const isLoading = result.key !== requestKey

  useEffect(() => {
    const controller = new AbortController()

    getFestivals({ date, region, numOfRows: EVENT_COUNT, signal: controller.signal })
      .then(({ items }) => setResult({ key: requestKey, items, error: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({ key: requestKey, items: [], error: err.message })
      })

    return () => controller.abort()
  }, [requestKey, date, region])

  let content
  if (isLoading) {
    content = <Loading />
  } else if (result.error) {
    content = <ErrorMessage message={result.error} onRetry={() => setRetryCount((c) => c + 1)} />
  } else if (result.items.length === 0) {
    content = (
      <div className="status-message">
        <span className="status-message__icon" aria-hidden="true">🗓️</span>
        <p>선택한 날짜에 진행 중인 축제·행사가 없어요.</p>
      </div>
    )
  } else {
    content = (
      <div className="event-grid">
        {result.items.map((event) => (
          <EventCard key={event.contentid} event={event} />
        ))}
      </div>
    )
  }

  return (
    <div className="home">
      <section className="home__section">
        <div className="home__heading">
          <h2>지금 진행 중인 축제·행사</h2>
          <p>{formatYmd(date)} 기준 · {region ? '선택 지역' : '전국'}</p>
        </div>
        {content}
      </section>
    </div>
  )
}

export default Home
