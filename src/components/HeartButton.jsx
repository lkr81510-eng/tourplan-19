import { useFavorites } from '../hooks/useFavorites'
import './HeartButton.css'

/**
 * 관심 여행지 하트 버튼
 * @param {object} item TourAPI 항목 (contentid, title, firstimage, addr1 …) 또는 저장된 항목
 * @param {'sm'|'lg'} size
 */
function HeartButton({ item, size = 'sm', className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const saved = isFavorite(item.contentid)

  const handleClick = (e) => {
    // 카드 클릭(상세 이동)과 겹치지 않도록
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(item)
  }

  return (
    <button
      type="button"
      className={`heart-button heart-button--${size} ${saved ? 'heart-button--on' : ''} ${className}`}
      aria-pressed={saved}
      aria-label={saved ? `${item.title} 관심 여행지에서 삭제` : `${item.title} 관심 여행지에 저장`}
      title={saved ? '관심 여행지에서 삭제' : '관심 여행지에 저장'}
      onClick={handleClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 2.9 4.5 6.6 4.1c2.1-.2 4 .9 5.4 2.7 1.4-1.8 3.3-2.9 5.4-2.7 3.7.4 5.7 4.2 4.2 7.6C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  )
}

export default HeartButton
