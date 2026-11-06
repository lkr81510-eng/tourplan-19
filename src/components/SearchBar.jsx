import { useState } from 'react'
import { inputToYmd, toYmd, ymdToInput } from '../api/tour'
import './SearchBar.css'

/**
 * 지역·날짜 검색창
 * - 입력값은 내부에서만 바뀌고, "검색"을 눌렀을 때 onSearch({ region, date }) 로 Home 에 전달
 * @param {{ code: string, name: string }[]} regions 법정동 시도 목록
 * @param {string} region  현재 적용된 지역 코드 ('' = 전국)
 * @param {string} date    현재 적용된 날짜 'YYYYMMDD'
 * @param {boolean} dateDisabled 날짜가 의미 없는 테마일 때 true
 */
function SearchBar({ regions = [], region, date, dateDisabled = false, onSearch }) {
  const [draftRegion, setDraftRegion] = useState(region)
  const [draftDate, setDraftDate] = useState(ymdToInput(date))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch({ region: draftRegion, date: inputToYmd(draftDate) || toYmd() })
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label className="search-bar__field">
        <span className="search-bar__label">지역</span>
        <select value={draftRegion} onChange={(e) => setDraftRegion(e.target.value)}>
          <option value="">전국</option>
          {regions.map(({ code, name }) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="search-bar__field">
        <span className="search-bar__label">
          날짜{dateDisabled && <small> (축제·행사에만 적용)</small>}
        </span>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          disabled={dateDisabled}
        />
      </label>

      <button type="submit" className="search-bar__button">
        검색
      </button>
    </form>
  )
}

export default SearchBar
