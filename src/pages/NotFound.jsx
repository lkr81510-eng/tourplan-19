import { Link } from 'react-router-dom'
import './Page.css'

function NotFound() {
  return (
    <div className="page page--center">
      <span className="page__icon" aria-hidden="true">🧭</span>
      <h2>페이지를 찾을 수 없습니다</h2>
      <p>주소가 바뀌었거나 없는 페이지예요.</p>
      <Link to="/" className="page__button">홈으로 가기</Link>
    </div>
  )
}

export default NotFound
