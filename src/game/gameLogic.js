import { BOARD_SPACES } from '../data/boardData.js'

export const STARTING_MONEY  = 1500
export const GO_BONUS        = 200
export const JAIL_POSITION   = 10
export const JAIL_FINE       = 50
export const MAX_JAIL_TURNS  = 3

export const AIRPORT_POSITIONS = [5, 15, 25, 35]
export const UTILITY_POSITIONS = [12, 28]

export const PLAYER_PRESETS = [
  { color: '#ff4d4d', emoji: '🚀' },
  { color: '#4d9eff', emoji: '🛸' },
  { color: '#4dff88', emoji: '🎯' },
  { color: '#ffd700', emoji: '⚡' },
  { color: '#ff88ff', emoji: '🌟' },
  { color: '#ff8c00', emoji: '🔥' },
]

export function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

export function isDoubles(dice) {
  return dice[0] === dice[1]
}

export function movePlayer(currentPos, steps) {
  const raw    = currentPos + steps
  const newPos = raw % 40
  const passedGo = raw >= 40
  return { newPos, passedGo }
}

export function getNearestAirport(pos) {
  for (const ap of AIRPORT_POSITIONS) {
    if (ap > pos) return ap
  }
  return AIRPORT_POSITIONS[0]
}

export function getNearestUtility(pos) {
  for (const u of UTILITY_POSITIONS) {
    if (u > pos) return u
  }
  return UTILITY_POSITIONS[0]
}

export function calculatePropertyRent(spaceId, ownership) {
  const space = BOARD_SPACES[spaceId]
  if (!space || space.type !== 'property') return 0
  const ownerId    = ownership[spaceId]
  if (ownerId === undefined) return 0
  const groupIds   = BOARD_SPACES.filter(s => s.type === 'property' && s.group === space.group).map(s => s.id)
  const hasMonopoly = groupIds.every(id => ownership[id] === ownerId)
  return hasMonopoly ? space.baseRent * 2 : space.baseRent
}

export function calculateAirportRent(ownerId, ownership) {
  const count = AIRPORT_POSITIONS.filter(id => ownership[id] === ownerId).length
  return [0, 25, 50, 100, 200][count] ?? 25
}

export function calculateUtilityRent(ownerId, ownership, dice) {
  const count = UTILITY_POSITIONS.filter(id => ownership[id] === ownerId).length
  return (dice[0] + dice[1]) * (count === 2 ? 10 : 4)
}

export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function formatMoney(n) {
  return '$' + n.toLocaleString()
}
