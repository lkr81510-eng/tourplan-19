import { Link } from 'react-router-dom'
import { useFavorites } from '../hooks/useFavorites'
import EventCard from '../components/EventCard'
import './Page.css'
import './Home.css'

/** 저장 항목 → EventCard 가 쓰는 TourAPI 형태 */
function toCardData(item) {
  return {
    contentid: item.contentid,
    title: item.title,
    firstimage: item.image,
    addr1: item.addr,
    eventstartdate: item.eventstartdate,
    eventenddate: item.eventenddate,
  }
}

function Favorites() {
  const { favorites, count } = useFavorites()

  if (count === 0) {
    return (
      <div className="page page--center">
        <span className="page__icon" aria-hidden="true">💙</span>
        <h2>아직 저장한 여행지가 없어요</h2>
        <p>마음에 드는 여행지의 하트를 눌러 저장해 보세요.</p>
        <Link to="/" className="page__button">여행지 둘러보기</Link>
      </div>
    )
  }

  return (
    <div className="home">
      <div className="home__heading">
        <h2>관심 여행지</h2>
        <p>저장한 여행지 {count}곳 · 하트를 누르면 삭제돼요</p>
      </div>
      <div className="event-grid">
        {favorites.map((item) => (
          <EventCard key={item.contentid} event={toCardData(item)} />
        ))}
      </div>
    </div>
  )
}

export default Favorites
