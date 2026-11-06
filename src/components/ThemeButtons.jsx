import { THEMES } from '../api/tour'
import './ThemeButtons.css'

/**
 * 테마(관광타입) 카테고리 버튼
 * @param {string} value 선택된 contentTypeId
 * @param {(id: string) => void} onChange
 */
function ThemeButtons({ value, onChange }) {
  return (
    <div className="theme-buttons" role="tablist" aria-label="테마 선택">
      {THEMES.map(({ id, label, icon }) => {
        const selected = id === value
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={selected ? 'theme-buttons__item theme-buttons__item--active' : 'theme-buttons__item'}
            onClick={() => onChange(id)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default ThemeButtons
