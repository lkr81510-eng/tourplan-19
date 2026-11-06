import { useEffect, useState } from 'react'
import { FESTIVAL_TYPE_ID, THEMES, formatYmd, getPlaces, getRegionCodes, toYmd } from '../api/tour'
import SearchBar from '../components/SearchBar'
import ThemeButtons from '../components/ThemeButtons'
import EventCard from '../components/EventCard'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import './Home.css'

const PAGE_SIZE = 12

function Home() {
  // 검색 조건 — SearchBar(region, date)와 ThemeButtons(theme)가 변경
  const [region, setRegion] = useState('') // 법정동 시도코드(lDongRegnCd), '' = 전국
  const [date, setDate] = useState(() => toYmd()) // 'YYYYMMDD', 기본값 오늘
  const [theme, setTheme] = useState(FESTIVAL_TYPE_ID) // contentTypeId, 기본값 축제·행사

  const [regions, setRegions] = useState([])
  const [retryCount, setRetryCount] = useState(0)

  // 결과는 어떤 조건(key)으로 받아온 것인지 함께 저장 → key 가 다르면 로딩 중
  const [result, setResult] = useState({
    key: null,
    items: [],
    totalCount: 0,
    page: 1,
    error: null,
  })
  const [moreState, setMoreState] = useState({ loading: false, error: null })

  const isFestival = theme === FESTIVAL_TYPE_ID
  // 축제·행사가 아니면 날짜는 조회 조건이 아니므로 key 에서 제외 (불필요한 재호출 방지)
  const requestKey = `${region}|${isFestival ? date : '-'}|${theme}|${retryCount}`
  const isLoading = result.key !== requestKey

  // 지역 목록 (법정동 시도) — 한 번만 조회, 실패해도 "전국"으로 사용 가능
  useEffect(() => {
    const controller = new AbortController()
    getRegionCodes({ signal: controller.signal })
      .then(setRegions)
      .catch((err) => {
        if (err.name !== 'AbortError') setRegions([])
      })
    return () => controller.abort()
  }, [])

  // 조건이 바뀌면 첫 페이지부터 다시 조회
  useEffect(() => {
    const controller = new AbortController()

    getPlaces({ theme, date, region, numOfRows: PAGE_SIZE, pageNo: 1, signal: controller.signal })
      .then(({ items, totalCount }) => {
        setResult({ key: requestKey, items, totalCount, page: 1, error: null })
        setMoreState({ loading: false, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({ key: requestKey, items: [], totalCount: 0, page: 1, error: err.message })
      })

    return () => controller.abort()
  }, [requestKey, theme, date, region])

  const handleSearch = ({ region: nextRegion, date: nextDate }) => {
    setRegion(nextRegion)
    setDate(nextDate)
  }

  const handleLoadMore = async () => {
    const key = result.key
    const nextPage = result.page + 1
    setMoreState({ loading: true, error: null })
    try {
      const { items } = await getPlaces({ theme, date, region, numOfRows: PAGE_SIZE, pageNo: nextPage })
      setResult((prev) => {
        if (prev.key !== key) return prev // 그 사이 조건이 바뀌었으면 무시
        const seen = new Set(prev.items.map((it) => it.contentid))
        const merged = [...prev.items, ...items.filter((it) => !seen.has(it.contentid))]
        return { ...prev, items: merged, page: nextPage }
      })
      setMoreState({ loading: false, error: null })
    } catch (err) {
      setMoreState({ loading: false, error: err.message })
    }
  }

  // 제목 문구
  const themeLabel = THEMES.find((t) => t.id === theme)?.label ?? ''
  const regionName = regions.find((r) => r.code === region)?.name ?? '전국'
  const title = isFestival ? '진행 중인 축제·행사' : `${themeLabel} 둘러보기`
  const subtitle = [isFestival && `${formatYmd(date)} 기준`, regionName, themeLabel]
    .filter(Boolean)
    .join(' · ')

  let content
  if (isLoading) {
    content = <Loading />
  } else if (result.error) {
    content = <ErrorMessage message={result.error} onRetry={() => setRetryCount((c) => c + 1)} />
  } else if (result.items.length === 0) {
    content = (
      <div className="status-message">
        <span className="status-message__icon" aria-hidden="true">🗓️</span>
        <p>
          {isFestival
            ? '선택한 날짜·지역에 진행 중인 축제·행사가 없어요.'
            : `선택한 지역에 등록된 ${themeLabel} 정보가 없어요.`}
        </p>
      </div>
    )
  } else {
    const hasMore = result.items.length < result.totalCount
    content = (
      <>
        <div className="event-grid">
          {result.items.map((event) => (
            <EventCard key={event.contentid} event={event} />
          ))}
        </div>
        {moreState.error && <ErrorMessage message={moreState.error} onRetry={handleLoadMore} />}
        {hasMore && !moreState.error && (
          <div className="home__more">
            <button
              type="button"
              className="home__more-button"
              onClick={handleLoadMore}
              disabled={moreState.loading}
            >
              {moreState.loading ? '불러오는 중…' : `더보기 (${result.items.length} / ${result.totalCount})`}
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="home">
      <section className="home__filters" aria-label="검색 조건">
        <SearchBar
          regions={regions}
          region={region}
          date={date}
          dateDisabled={!isFestival}
          onSearch={handleSearch}
        />
        <ThemeButtons value={theme} onChange={setTheme} />
      </section>

      <section className="home__section">
        <div className="home__heading">
          <h2>{title}</h2>
          <p>
            {subtitle}
            {!isLoading && !result.error && result.totalCount > 0 && ` · 총 ${result.totalCount}건`}
          </p>
        </div>
        {content}
      </section>
    </div>
  )
}

export default Home
