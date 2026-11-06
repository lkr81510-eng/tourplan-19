import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatYmd } from '../api/tour'
import './EventCard.css'

function EventCard({ event }) {
  const { contentid, title, eventstartdate, eventenddate, addr1, addr2, firstimage, firstimage2 } =
    event
  const image = firstimage || firstimage2
  const [imageFailed, setImageFailed] = useState(false)
  const address = [addr1, addr2].filter(Boolean).join(' ')

  return (
    <Link to={`/detail/${contentid}`} className="event-card" aria-label={`${title} 상세 보기`}>
      <article>
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
      </article>
    </Link>
  )
}

export default EventCard
