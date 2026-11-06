import { useCallback, useSyncExternalStore } from 'react'

// 관심 여행지 저장소
// - localStorage('tourplan-favorites')에 저장
// - 모듈 단위 저장소 + useSyncExternalStore → 어느 컴포넌트에서 바꿔도 모든 화면이 즉시 갱신
// - 다른 탭에서 바뀌면 storage 이벤트로 반영
// - localStorage 가 막혀 있거나 JSON 이 깨져 있어도 메모리에서 계속 동작

const STORAGE_KEY = 'tourplan-favorites'

let favorites = null // null = 아직 읽지 않음
const listeners = new Set()

function isValidItem(item) {
  return item && typeof item === 'object' && item.contentid && item.title
}

function readStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(isValidItem) : []
  } catch {
    return [] // 접근 차단 또는 JSON 손상
  }
}

function writeStorage(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 저장 불가(시크릿 모드·용량 초과 등): 이번 세션 메모리에만 유지
  }
}

function getSnapshot() {
  if (favorites === null) favorites = readStorage()
  return favorites
}

function emit() {
  listeners.forEach((listener) => listener())
}

function setFavorites(next) {
  favorites = next
  writeStorage(next)
  emit()
}

function handleStorage(e) {
  if (e.key === STORAGE_KEY || e.key === null) {
    favorites = readStorage()
    emit()
  }
}

function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', handleStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', handleStorage)
  }
}

/**
 * TourAPI 항목(목록/상세 공통정보) → 저장용 객체
 * 저장 항목: contentid, 제목, 이미지, 주소, 기간(있으면)
 */
export function toFavoriteItem(source) {
  const item = {
    contentid: String(source.contentid),
    title: source.title ?? '',
    image: source.firstimage || source.firstimage2 || source.image || '',
    addr: source.addr ?? source.address ?? [source.addr1, source.addr2].filter(Boolean).join(' '),
  }
  const start = source.eventstartdate
  const end = source.eventenddate
  if (start) item.eventstartdate = start
  if (end) item.eventenddate = end
  return item
}

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, getSnapshot, () => [])

  const isFavorite = useCallback(
    (contentid) => list.some((it) => it.contentid === String(contentid)),
    [list],
  )

  const addFavorite = useCallback((source) => {
    const item = toFavoriteItem(source)
    const current = getSnapshot()
    if (current.some((it) => it.contentid === item.contentid)) return
    setFavorites([{ ...item, savedAt: Date.now() }, ...current])
  }, [])

  const removeFavorite = useCallback((contentid) => {
    const id = String(contentid)
    setFavorites(getSnapshot().filter((it) => it.contentid !== id))
  }, [])

  const toggleFavorite = useCallback(
    (source) => {
      const id = String(source.contentid)
      if (getSnapshot().some((it) => it.contentid === id)) removeFavorite(id)
      else addFavorite(source)
    },
    [addFavorite, removeFavorite],
  )

  return {
    favorites: list,
    count: list.length,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }
}
