import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { FESTIVAL_TYPE_ID, THEMES, formatYmd, getPlaceDetail } from '../api/tour'
import { displayUrl, extractLinks, htmlToText } from '../utils/text'
import Loading from '../components/Loading'
import ErrorMessage from '../components/ErrorMessage'
import HeartButton from '../components/HeartButton'
import AiCourseSection from '../components/AiCourseSection'
import './Page.css'
import './Detail.css'

/** 좌표 문자열 → 숫자 (없거나 0 이면 null) */
function toCoord(value) {
  const n = Number(value)
  return Number.isFinite(n) && n !== 0 ? n : null
}

/** 카카오맵 길찾기 링크 (도착지 = 이 장소) */
function directionsUrl(title, lat, lng) {
  const name = encodeURIComponent((title || '도착지').replace(/,/g, ' '))
  return `https://map.kakao.com/link/to/${name},${lat},${lng}`
}

/** 상세 데이터 → 화면/AI 에서 함께 쓰는 정리된 값 */
function buildPlace(common, intro) {
  const address = [htmlToText(common.addr1), htmlToText(common.addr2)].filter(Boolean).join(' ')
  const isFestival = common.contenttypeid === FESTIVAL_TYPE_ID
  return {
    contentid: String(common.contentid),
    contenttypeid: common.contenttypeid,
    title: htmlToText(common.title),
    image: common.firstimage || common.firstimage2 || '',
    address,
    regionCode: common.lDongRegnCd || '',
    regionName: address.split(' ')[0] || '',
    mapx: toCoord(common.mapx),
    mapy: toCoord(common.mapy),
    tel: htmlToText(common.tel),
    telname: htmlToText(common.telname),
    homepageLinks: extractLinks(common.homepage),
    overview: htmlToText(common.overview),
    eventstartdate: (isFestival && (intro?.eventstartdate || common.eventstartdate)) || '',
    eventenddate: (isFestival && (intro?.eventenddate || common.eventenddate)) || '',
  }
}

/** 행사 소개정보 → [라벨, 값] 목록 (값 없는 항목 제외) */
function buildEventRows(intro) {
  if (!intro) return []
  const sponsor = (name, tel) => [htmlToText(name), htmlToText(tel)].filter(Boolean).join(' · ')
  return [
    ['행사 장소', htmlToText(intro.eventplace)],
    ['공연 시간', htmlToText(intro.playtime)],
    ['이용 요금', htmlToText(intro.usetimefestival)],
    ['할인 정보', htmlToText(intro.discountinfofestival)],
    ['관람 연령', htmlToText(intro.agelimit)],
    ['소요 시간', htmlToText(intro.spendtimefestival)],
    ['예매처', htmlToText(intro.bookingplace)],
    ['주최', sponsor(intro.sponsor1, intro.sponsor1tel)],
    ['주관', sponsor(intro.sponsor2, intro.sponsor2tel)],
  ].filter(([, value]) => value)
}

function Detail() {
  const { id } = useParams() // TourAPI contentid — 카드 데이터에 의존하지 않고 직접 조회
  const navigate = useNavigate()
  const location = useLocation()

  const [retryCount, setRetryCount] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const [imageFailed, setImageFailed] = useState(false)

  const requestKey = `${id}|${retryCount}`
  const isLoading = result.key !== requestKey

  useEffect(() => {
    const controller = new AbortController()
    getPlaceDetail(id, { signal: controller.signal })
      .then((data) => {
        setImageFailed(false)
        setResult({ key: requestKey, data, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({ key: requestKey, data: null, error: err.message })
      })
    return () => controller.abort()
  }, [id, requestKey])

  const place = useMemo(
    () => (result.data ? buildPlace(result.data.common, result.data.intro) : null),
    [result.data],
  )
  const eventRows = useMemo(() => buildEventRows(result.data?.intro), [result.data])
  const eventLinks = useMemo(() => extractLinks(result.data?.intro?.eventhomepage), [result.data])
  const program = htmlToText(result.data?.intro?.program)
  const subevent = htmlToText(result.data?.intro?.subevent)

  // 앱 안에서 이동해 왔으면 뒤로, 주소로 바로 들어왔으면 홈으로
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'))

  const backButton = (
    <button type="button" className="detail__back" onClick={goBack}>
      ← 목록으로 돌아가기
    </button>
  )

  if (isLoading) {
    return (
      <div className="page detail">
        {backButton}
        <Loading message="상세 정보를 불러오는 중이에요…" />
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="page detail">
        {backButton}
        <ErrorMessage message={result.error} onRetry={() => setRetryCount((c) => c + 1)} />
      </div>
    )
  }

  if (!place) {
    return (
      <div className="page detail">
        {backButton}
        <div className="status-message">
          <span className="status-message__icon" aria-hidden="true">🔍</span>
          <p>해당 여행지 정보를 찾을 수 없어요.</p>
        </div>
      </div>
    )
  }

  const themeLabel = THEMES.find((t) => t.id === place.contenttypeid)?.label
  const hasCoords = place.mapx !== null && place.mapy !== null
  const links = [...new Set([...place.homepageLinks, ...eventLinks])]
  const period =
    place.eventstartdate &&
    `${formatYmd(place.eventstartdate)} ~ ${formatYmd(place.eventenddate)}`

  const infoRows = [
    ['행사 기간', period],
    ['주소', place.address],
    ['문의', [place.telname, place.tel].filter(Boolean).join(' · ')],
  ].filter(([, value]) => value)

  return (
    <div className="page detail">
      {backButton}

      <article>
        <header className="detail__header">
          <div className="detail__title-wrap">
            {themeLabel && <span className="detail__badge">{themeLabel}</span>}
            <h1 className="detail__title">{place.title}</h1>
          </div>
          <HeartButton item={place} size="lg" />
        </header>

        <div className="detail__top">
          <div className="detail__image">
            {place.image && !imageFailed ? (
              <img src={place.image} alt={place.title} onError={() => setImageFailed(true)} />
            ) : (
              <div className="detail__no-image" aria-label="이미지 없음">
                <span aria-hidden="true">🏞️</span>
                <p>이미지 준비 중</p>
              </div>
            )}
          </div>

          <div className="detail__summary">
            {infoRows.length > 0 && (
              <dl className="detail__info">
                {infoRows.map(([label, value]) => (
                  <div key={label} className="detail__row">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {links.length > 0 && (
              <dl className="detail__info">
                <div className="detail__row detail__row--links">
                  <dt>홈페이지</dt>
                  <dd>
                    {links.map((href) => (
                      <a key={href} href={href} target="_blank" rel="noopener noreferrer">
                        {displayUrl(href)}
                      </a>
                    ))}
                  </dd>
                </div>
              </dl>
            )}

            {hasCoords && (
              <div className="detail__actions">
                <a
                  className="detail__action"
                  href={directionsUrl(place.title, place.mapy, place.mapx)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🧭 길찾기
                </a>
              </div>
            )}
          </div>
        </div>

        {place.overview && (
          <section className="detail__section">
            <h2>소개</h2>
            <p className="detail__text">{place.overview}</p>
          </section>
        )}

        {eventRows.length > 0 && (
          <section className="detail__section">
            <h2>행사 정보</h2>
            <dl className="detail__info">
              {eventRows.map(([label, value]) => (
                <div key={label} className="detail__row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {program && (
          <section className="detail__section">
            <h2>행사 프로그램</h2>
            <p className="detail__text">{program}</p>
          </section>
        )}

        {subevent && (
          <section className="detail__section">
            <h2>부대 행사</h2>
            <p className="detail__text">{subevent}</p>
          </section>
        )}
      </article>

      {/* 나중에 AI 결과가 들어갈 자리 — 정리된 상세 정보를 그대로 전달 */}
      <AiCourseSection place={place} />
    </div>
  )
}

export default Detail
