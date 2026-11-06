import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatYmd } from '../api/tour'
import HeartButton from './HeartButton'
import './EventCard.css'

/**
 * 여행지·행사 카드
 * - 카드(링크)를 누르면 /detail/:contentid 로 이동
 * - 하트 버튼은 링크 바깥 형제 요소로 두어 <a> 안에 <button> 이 중첩되지 않게 함
 * @param {object} event TourAPI 항목 (contentid, title, firstimage, addr1, eventstartdate …)
 */
function EventCard({ event }) {
  const { contentid, title, eventstartdate, eventenddate, addr1, addr2, firstimage, firstimage2 } =
    event
  const image = firstimage || firstimage2
  const [imageFailed, setImageFailed] = useState(false)
  const address = [addr1, addr2].filter(Boolean).join(' ')

  return (
    <article className="event-card">
      <Link to={`/detail/${contentid}`} className="event-card__link" aria-label={`${title} 상세 보기`}>
        <div className="event-card__thumb">
          {image && !imageFailed ? (
            <img src={image} alt={title} loading="lazy" onError={() => setImageFailed(true)} />
          ) : (
            <div className="event-card__no-image" aria-label="이미지 없음">
              <span aria-hidden="true">🎪</span>
              <p>이미지 준비 중</p>
            </div>
          )}
        </div>
        <div className="event-card__body">
          <h3 className="event-card__title">{title}</h3>
          {/* 기간은 축제·행사(contentTypeId 15)에만 있음 */}
          {eventstartdate && (
            <p className="event-card__period">
              {formatYmd(eventstartdate)} ~ {formatYmd(eventenddate)}
            </p>
          )}
          <p className="event-card__addr">{address || '주소 정보 없음'}</p>
        </div>
      </Link>
      <HeartButton item={event} className="event-card__heart" />
    </article>
  )
}

export default EventCard
