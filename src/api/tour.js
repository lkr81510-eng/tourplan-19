// 한국관광공사 국문 관광정보 서비스 (TourAPI, KorService2)
// - 지역 필터는 법정동 시도코드(lDongRegnCd)를 사용합니다.
//   (areaCode / 지역코드조회(areaCode2)는 공식 문서상 "미사용·삭제 예정")
// - API 키는 .env 의 VITE_TOUR_API_KEY 에서만 읽습니다. 절대 로그로 출력하지 마세요.

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2'
const API_KEY = import.meta.env.VITE_TOUR_API_KEY

const COMMON_PARAMS = {
  MobileOS: 'WEB',
  MobileApp: 'TourPlan',
  _type: 'json',
}

export class TourApiError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'TourApiError'
    this.code = code
  }
}

// 오류 코드 → 사용자에게 보여줄 메시지
const ERROR_MESSAGES = {
  NO_API_KEY: 'API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
  NETWORK: '네트워크 연결을 확인해 주세요.',
  HTTP: '관광정보 서버 응답에 문제가 있습니다.',
  PARSE: '관광정보 응답을 해석하지 못했습니다.',
  SERVICE_KEY_IS_NOT_REGISTERED_ERROR:
    '등록되지 않은 API 키입니다. 키 활성화까지 시간이 걸릴 수 있습니다.',
  SERVICE_ACCESS_DENIED_ERROR: 'API 사용 권한이 없습니다.',
  LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR:
    '오늘 API 호출 한도를 초과했습니다.',
}

function errorFor(code, fallback) {
  return new TourApiError(ERROR_MESSAGES[code] ?? fallback ?? `관광정보 조회 실패 (${code})`, code)
}

/**
 * TourAPI 공통 요청 함수
 * @returns {Promise<{ items: object[], totalCount: number }>}
 */
async function request(operation, params = {}, { signal } = {}) {
  if (!API_KEY) throw errorFor('NO_API_KEY')

  const query = new URLSearchParams({ serviceKey: API_KEY, ...COMMON_PARAMS })
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })

  let res
  try {
    res = await fetch(`${BASE_URL}/${operation}?${query}`, { signal })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw errorFor('NETWORK')
  }

  const text = await res.text()

  // 인증 오류 등은 _type=json 이어도 XML 로 내려오는 경우가 있음
  if (text.trim().startsWith('<')) {
    const code =
      text.match(/<returnReasonCode>(.*?)<\/returnReasonCode>/)?.[1] ??
      text.match(/<resultCode>(.*?)<\/resultCode>/)?.[1]
    const reason =
      text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1] ??
      text.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1]
    throw errorFor(reason || code || 'PARSE')
  }

  if (!res.ok) throw errorFor('HTTP', `관광정보 서버 오류 (HTTP ${res.status})`)

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw errorFor('PARSE')
  }

  // 파라미터 오류 등은 { resultCode: '10', resultMsg: '...' } 처럼 response 없이 오기도 함
  if (!data?.response && data?.resultCode) {
    throw errorFor(data.resultCode, `관광정보 요청 오류 (${data.resultCode})`)
  }

  const header = data?.response?.header
  if (header?.resultCode !== '0000') {
    throw errorFor(header?.resultCode ?? 'PARSE', header?.resultMsg)
  }

  const body = data.response.body
  // 결과가 없으면 items 가 "" 로 오고, 1건이면 item 이 배열이 아닐 수 있음
  const items = body?.items?.item ? [].concat(body.items.item) : []
  return { items, totalCount: Number(body?.totalCount ?? items.length) }
}

/** Date → 'YYYYMMDD' (로컬 시간 기준) */
export function toYmd(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

/** 'YYYYMMDD' → 'YYYY.MM.DD' */
export function formatYmd(ymd) {
  if (!ymd || ymd.length !== 8) return ''
  return `${ymd.slice(0, 4)}.${ymd.slice(4, 6)}.${ymd.slice(6, 8)}`
}

/**
 * 지정한 날짜에 진행 중인 축제·행사 목록 (행사정보조회 searchFestival2)
 * eventStartDate·eventEndDate 를 같은 날짜로 주면 그 날 진행 중인 행사만 반환됩니다.
 *
 * @param {object} options
 * @param {string} [options.date]   'YYYYMMDD', 기본값 오늘
 * @param {string} [options.region] 법정동 시도코드(lDongRegnCd), 빈 값이면 전국
 * @param {number} [options.numOfRows]
 * @param {number} [options.pageNo]
 * @param {AbortSignal} [options.signal]
 */
export async function getFestivals({
  date = toYmd(),
  region = '',
  numOfRows = 10,
  pageNo = 1,
  signal,
} = {}) {
  return request(
    'searchFestival2',
    {
      eventStartDate: date,
      eventEndDate: date,
      lDongRegnCd: region,
      arrange: 'C', // 수정일순
      numOfRows,
      pageNo,
    },
    { signal },
  )
}

/** 'YYYYMMDD' ↔ 'YYYY-MM-DD' (input type="date" 값) */
export function ymdToInput(ymd) {
  return ymd && ymd.length === 8 ? `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}` : ''
}
export function inputToYmd(value) {
  return value ? value.replaceAll('-', '') : ''
}

/** 관광타입(contentTypeId) — 공식 문서 코드표 기준 */
export const FESTIVAL_TYPE_ID = '15'
export const THEMES = [
  { id: FESTIVAL_TYPE_ID, label: '축제·행사', icon: '🎪' },
  { id: '12', label: '관광지', icon: '🏞️' },
  { id: '14', label: '문화시설', icon: '🏛️' },
  { id: '28', label: '레포츠', icon: '🚴' },
  { id: '32', label: '숙박', icon: '🏨' },
  { id: '39', label: '음식점', icon: '🍜' },
]

/**
 * 지역기반 관광정보 목록 (지역기반 관광정보조회 areaBasedList2)
 *
 * @param {object} options
 * @param {string} options.contentTypeId 관광타입 ID (12 관광지, 14 문화시설, 28 레포츠, 32 숙박, 39 음식점 …)
 * @param {string} [options.region] 법정동 시도코드(lDongRegnCd), 빈 값이면 전국
 * @param {number} [options.numOfRows]
 * @param {number} [options.pageNo]
 * @param {AbortSignal} [options.signal]
 */
export async function getAreaBasedList({
  contentTypeId,
  region = '',
  numOfRows = 12,
  pageNo = 1,
  signal,
} = {}) {
  return request(
    'areaBasedList2',
    {
      contentTypeId,
      lDongRegnCd: region,
      arrange: 'Q', // 대표이미지 있는 항목만, 수정일순
      numOfRows,
      pageNo,
    },
    { signal },
  )
}

/**
 * 테마에 맞는 목록 조회
 * - 축제·행사: 선택한 날짜에 진행 중인 행사 (searchFestival2)
 * - 그 외: 선택한 지역의 관광타입별 목록 (areaBasedList2)
 */
export async function getPlaces({ theme = FESTIVAL_TYPE_ID, date, region, numOfRows, pageNo, signal }) {
  if (theme === FESTIVAL_TYPE_ID) {
    return getFestivals({ date, region, numOfRows, pageNo, signal })
  }
  return getAreaBasedList({ contentTypeId: theme, region, numOfRows, pageNo, signal })
}

/**
 * 공통정보 조회 (detailCommon2) — 필수: contentId
 * @returns {Promise<object|null>} 없으면 null
 */
export async function getDetailCommon(contentId, { signal } = {}) {
  const { items } = await request('detailCommon2', { contentId }, { signal })
  return items[0] ?? null
}

/**
 * 소개정보 조회 (detailIntro2) — 필수: contentId, contentTypeId
 * @returns {Promise<object|null>} 없으면 null
 */
export async function getDetailIntro(contentId, contentTypeId, { signal } = {}) {
  const { items } = await request('detailIntro2', { contentId, contentTypeId }, { signal })
  return items[0] ?? null
}

/**
 * 상세 페이지용: 공통정보 + (행사라면) 소개정보
 * 소개정보 조회가 실패해도 공통정보는 보여줄 수 있도록 intro 는 null 로 둡니다.
 * @returns {Promise<{ common: object, intro: object|null } | null>} 콘텐츠가 없으면 null
 */
export async function getPlaceDetail(contentId, { signal } = {}) {
  const common = await getDetailCommon(contentId, { signal })
  if (!common) return null

  let intro = null
  if (common.contenttypeid === FESTIVAL_TYPE_ID) {
    try {
      intro = await getDetailIntro(contentId, common.contenttypeid, { signal })
    } catch (err) {
      if (err.name === 'AbortError') throw err
    }
  }
  return { common, intro }
}

/**
 * 지역코드 조회 (법정동코드조회 ldongCode2)
 * - regionCode 없이 호출: 시도 목록
 * - regionCode 지정: 해당 시도의 시군구 목록
 * @returns {Promise<{ code: string, name: string }[]>}
 */
export async function getRegionCodes({ regionCode = '', signal } = {}) {
  const { items } = await request(
    'ldongCode2',
    { lDongRegnCd: regionCode, numOfRows: 100, pageNo: 1 },
    { signal },
  )
  return items.map(({ code, name }) => ({ code: String(code), name }))
}
