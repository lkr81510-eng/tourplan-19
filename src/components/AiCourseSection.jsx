import './AiCourseSection.css'

/**
 * AI 여행 코스 추천 영역 (현재는 자리만)
 *
 * 나중에 AI 결과를 넣을 때 이 props 를 그대로 사용하면 됩니다.
 * @param {object} place
 * @param {string} place.contentid     TourAPI 콘텐츠 ID
 * @param {string} place.contenttypeid 관광타입 ID
 * @param {string} place.title         제목
 * @param {string} place.regionCode    법정동 시도코드(lDongRegnCd)
 * @param {string} place.regionName    지역 이름 (주소 첫 단어)
 * @param {string} place.address       주소
 * @param {number|null} place.mapx     경도
 * @param {number|null} place.mapy     위도
 * @param {string} [place.eventstartdate] 행사 시작일 'YYYYMMDD'
 * @param {string} [place.eventenddate]   행사 종료일 'YYYYMMDD'
 */
// eslint-disable-next-line no-unused-vars -- place 는 AI 기능 연결 시 사용 예정
function AiCourseSection({ place }) {
  return (
    <section className="ai-course" aria-labelledby="ai-course-title">
      <div className="ai-course__header">
        <span className="ai-course__icon" aria-hidden="true">✨</span>
        <h2 id="ai-course-title">AI 여행 코스 추천</h2>
      </div>
      <p className="ai-course__placeholder">준비 중이에요. 곧 이곳에서 맞춤 여행 코스를 추천해 드릴게요.</p>
    </section>
  )
}

export default AiCourseSection
