import { Link, useParams } from 'react-router-dom'
import './Page.css'

// 5번 상세정보 + AI 추천 화면이 들어올 자리
function Detail() {
  const { id } = useParams() // TourAPI contentid

  return (
    <div className="page page--center">
      <span className="page__icon" aria-hidden="true">🛠️</span>
      <h2>상세 페이지 준비 중</h2>
      <p>
        콘텐츠 ID: <strong>{id}</strong>
      </p>
      <Link to="/" className="page__button">홈으로</Link>
    </div>
  )
}

export default Detail
