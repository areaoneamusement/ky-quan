// Định danh người chơi & phiên chơi — lưu cục bộ trên trình duyệt (không gửi dữ liệu cá nhân nào khác).

const PLAYER_ID_KEY = 'kyquan_player_id'
const SESSION_KEY   = 'kyquan_session'

export function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
