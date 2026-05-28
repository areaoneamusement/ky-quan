// Pure game reducer — no React dependencies.
// Used by both the client (GameContext) and the server (Socket.io backend).

import { BOARD_SPACES } from '../data/boardData.js'
import { CHANCE_CARDS, CHEST_CARDS } from '../data/cardData.js'
import * as L from './gameLogic.js'

// ─── helpers ────────────────────────────────────────────────────────────────

function addLog(state, msg) {
  return { ...state, log: [msg, ...state.log].slice(0, 30) }
}

export function getPlayer(state, id) {
  return state.players.find(p => p.id === id)
}

export function updatePlayer(state, id, updates) {
  return {
    ...state,
    players: state.players.map(p => p.id === id ? { ...p, ...updates } : p),
  }
}

function payRent(state, payerId, receiverId, amount, label) {
  const payer    = getPlayer(state, payerId)
  const receiver = getPlayer(state, receiverId)
  if (!payer || !receiver || receiverId === payerId) return state
  const paid = Math.min(amount, Math.max(payer.money, 0))
  let s = updatePlayer(state, payerId,    { money: payer.money - paid })
  s     = updatePlayer(s,     receiverId, { money: receiver.money + paid })
  s     = addLog(s, `💸 ${payer.name} trả $${paid} tiền thuê ${label} cho ${receiver.name}`)
  if (payer.money - paid < 0) s = declareBankrupt(s, payerId)
  return s
}

function declareBankrupt(state, playerId) {
  const player = getPlayer(state, playerId)
  let s = updatePlayer(state, playerId, { bankrupt: true })
  s = addLog(s, `💔 ${player.name} đã phá sản!`)
  const newOwnership = { ...s.ownership }
  Object.keys(newOwnership).forEach(k => {
    if (newOwnership[k] === playerId) delete newOwnership[k]
  })
  return { ...s, ownership: newOwnership }
}

export function processLanding(state, playerId, dice) {
  const player  = getPlayer(state, playerId)
  const space   = BOARD_SPACES[player.position]
  if (!space) return state
  const spaceId = player.position

  switch (space.type) {
    case 'property':
    case 'airport':
    case 'utility': {
      const ownerId = state.ownership[spaceId]
      if (ownerId === undefined) {
        return { ...state, pendingAction: { type: 'land', landType: 'buy', spaceId } }
      }
      if (ownerId === player.id) {
        return { ...state, pendingAction: { type: 'land', landType: 'own', spaceId } }
      }
      let rent
      if (space.type === 'property')  rent = L.calculatePropertyRent(spaceId, state.ownership)
      else if (space.type === 'airport') rent = L.calculateAirportRent(ownerId, state.ownership)
      else                            rent = L.calculateUtilityRent(ownerId, state.ownership, dice)
      return { ...state, pendingAction: { type: 'land', landType: 'rent', spaceId, ownerId, amount: rent } }
    }
    case 'chance': {
      const card = state.chanceDeck[state.chanceIndex % state.chanceDeck.length]
      return { ...state, chanceIndex: state.chanceIndex + 1,
        pendingAction: { type: 'land', landType: 'card', spaceId, card, deck: 'chance' } }
    }
    case 'chest': {
      const card = state.chestDeck[state.chestIndex % state.chestDeck.length]
      return { ...state, chestIndex: state.chestIndex + 1,
        pendingAction: { type: 'land', landType: 'card', spaceId, card, deck: 'chest' } }
    }
    case 'tax': {
      return { ...state, pendingAction: { type: 'land', landType: 'tax', spaceId, amount: space.amount } }
    }
    case 'corner': {
      if (space.subtype === 'gotojail') {
        return { ...state, pendingAction: { type: 'land', landType: 'gotojail', spaceId } }
      }
      return { ...state, pendingAction: { type: 'land', landType: 'corner', spaceId } }
    }
    default:
      return state
  }
}

// ─── initial state ──────────────────────────────────────────────────────────

export const initialState = {
  phase: 'setup',
  players: [],
  currentPlayerIndex: 0,
  dice: [1, 1],
  diceRolled: false,
  doublesCount: 0,
  ownership: {},
  pendingAction: null,
  log: [],
  chanceDeck: [],
  chestDeck: [],
  chanceIndex: 0,
  chestIndex: 0,
  winner: null,
}

// ─── reducer ────────────────────────────────────────────────────────────────

export function reducer(state, action) {
  switch (action.type) {

    // ── setup ──────────────────────────────────────────────────────────────
    case 'START_GAME': {
      const players = action.playerConfigs.map((cfg, i) => ({
        id: i, name: cfg.name, color: cfg.color, emoji: cfg.emoji,
        position: 0, money: L.STARTING_MONEY,
        properties: [], inJail: false, jailTurns: 0, jailFreeCards: 0, bankrupt: false,
      }))
      return {
        ...initialState,
        phase: 'playing',
        players,
        chanceDeck: L.shuffleArray(CHANCE_CARDS),
        chestDeck:  L.shuffleArray(CHEST_CARDS),
        log: [`🌍 Bắt đầu! Lượt của ${players[0].name}`],
      }
    }

    // ── roll dice ──────────────────────────────────────────────────────────
    case 'ROLL_DICE': {
      const player = state.players[state.currentPlayerIndex]
      const canReroll = state.diceRolled && L.isDoubles(state.dice) && state.doublesCount > 0 && !state.pendingAction && !player.inJail
      if (!canReroll && (state.diceRolled || state.pendingAction)) return state
      const d1 = L.rollDie(), d2 = L.rollDie()
      const dice = [d1, d2]
      const sum = d1 + d2
      const doubles = L.isDoubles(dice)

      if (player.inJail) {
        let s = { ...state, dice, diceRolled: true }
        if (doubles) {
          s = updatePlayer(s, player.id, { inJail: false, jailTurns: 0 })
          s = addLog(s, `${player.emoji} ${player.name} tung đôi ${d1}+${d2}, thoát Biên Giới!`)
          const { newPos, passedGo } = L.movePlayer(player.position, sum)
          s = updatePlayer(s, player.id, { position: newPos })
          if (passedGo) {
            s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + L.GO_BONUS })
            s = addLog(s, `🌍 ${player.name} qua Khởi Hành, nhận $${L.GO_BONUS}!`)
          }
          return processLanding(s, player.id, dice)
        }
        const newJailTurns = player.jailTurns + 1
        if (newJailTurns >= L.MAX_JAIL_TURNS) {
          s = updatePlayer(s, player.id, {
            inJail: false, jailTurns: 0,
            money: player.money - L.JAIL_FINE,
          })
          s = addLog(s, `${player.emoji} ${player.name} hết ${L.MAX_JAIL_TURNS} lượt, bắt buộc nộp $${L.JAIL_FINE}`)
          const { newPos, passedGo } = L.movePlayer(player.position, sum)
          s = updatePlayer(s, player.id, { position: newPos })
          if (passedGo) {
            s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + L.GO_BONUS })
            s = addLog(s, `🌍 ${player.name} qua Khởi Hành, nhận $${L.GO_BONUS}!`)
          }
          return processLanding(s, player.id, dice)
        }
        s = updatePlayer(s, player.id, { jailTurns: newJailTurns })
        return addLog(s, `${player.emoji} ${player.name} tung ${d1}+${d2} — không thoát Biên Giới (lượt ${newJailTurns}/${L.MAX_JAIL_TURNS})`)
      }

      const newDoublesCount = doubles ? state.doublesCount + 1 : 0
      if (newDoublesCount >= 3) {
        let s = { ...state, dice, diceRolled: true, doublesCount: 0 }
        s = updatePlayer(s, player.id, { inJail: true, jailTurns: 0, position: L.JAIL_POSITION })
        return addLog(s, `🚫 ${player.name} tung đôi 3 lần — bị giam tại Biên Giới!`)
      }

      const { newPos, passedGo } = L.movePlayer(player.position, sum)
      let s = { ...state, dice, diceRolled: true, doublesCount: newDoublesCount }
      s = updatePlayer(s, player.id, { position: newPos })
      s = addLog(s, `${player.emoji} ${player.name} tung ${d1}+${d2}=${sum}${doubles ? ' 🎲🎲 Đôi!' : ''} → ô ${newPos}`)
      if (passedGo) {
        s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + L.GO_BONUS })
        s = addLog(s, `🌍 ${player.name} qua Khởi Hành, nhận $${L.GO_BONUS}!`)
      }
      return processLanding(s, player.id, dice)
    }

    // ── buy property ───────────────────────────────────────────────────────
    case 'BUY_PROPERTY': {
      const pa = state.pendingAction
      if (!pa || pa.type !== 'land' || pa.landType !== 'buy') return state
      const player  = state.players[state.currentPlayerIndex]
      const spaceId = pa.spaceId
      const space   = BOARD_SPACES[spaceId]
      if (player.money < space.price) return state
      let s = { ...state, pendingAction: null, ownership: { ...state.ownership, [spaceId]: player.id } }
      s = updatePlayer(s, player.id, { money: player.money - space.price, properties: [...player.properties, spaceId] })
      return addLog(s, `🏳️ ${player.name} mua ${space.name} ($${space.price})`)
    }

    case 'DECLINE_PROPERTY': {
      return { ...state, pendingAction: null }
    }

    // ── resolve landing ────────────────────────────────────────────────────
    case 'RESOLVE_LAND': {
      const pa = state.pendingAction
      if (!pa || pa.type !== 'land') return state
      const player = state.players[state.currentPlayerIndex]
      switch (pa.landType) {
        case 'rent':
          return payRent({ ...state, pendingAction: null }, player.id, pa.ownerId, pa.amount,
            BOARD_SPACES[pa.spaceId]?.name || '')
        case 'tax': {
          let s = updatePlayer({ ...state, pendingAction: null }, player.id, { money: player.money - pa.amount })
          s = addLog(s, `💸 ${player.name} nộp $${pa.amount} ${BOARD_SPACES[pa.spaceId]?.name}`)
          if (player.money - pa.amount < 0) s = declareBankrupt(s, player.id)
          return s
        }
        case 'gotojail': {
          let s = updatePlayer({ ...state, pendingAction: null }, player.id,
            { inJail: true, jailTurns: 0, position: L.JAIL_POSITION })
          return addLog(s, `🚫 ${player.name} bị giam tại Biên Giới!`)
        }
        default:
          return { ...state, pendingAction: null }
      }
    }

    // ── resolve card ───────────────────────────────────────────────────────
    case 'RESOLVE_CARD': {
      const { card } = action
      const pa = state.pendingAction
      if (!pa || pa.type !== 'land' || pa.landType !== 'card') return state
      const player = state.players[state.currentPlayerIndex]
      let s = { ...state, pendingAction: null }

      switch (card.type) {
        case 'collect': {
          s = updatePlayer(s, player.id, { money: player.money + card.amount })
          s = addLog(s, `${player.emoji} ${player.name} nhận $${card.amount}`)
          break
        }
        case 'pay': {
          s = updatePlayer(s, player.id, { money: player.money - card.amount })
          s = addLog(s, `${player.emoji} ${player.name} nộp $${card.amount}`)
          if (player.money - card.amount < 0) s = declareBankrupt(s, player.id)
          break
        }
        case 'collect_from_players': {
          const others = s.players.filter(p => p.id !== player.id && !p.bankrupt)
          let total = 0
          others.forEach(op => {
            const paid = Math.min(card.amount, Math.max(op.money, 0))
            s = updatePlayer(s, op.id, { money: op.money - paid })
            total += paid
          })
          s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + total })
          s = addLog(s, `${player.emoji} ${player.name} thu $${card.amount} từ ${others.length} người`)
          break
        }
        case 'move': {
          const fromPos = player.position
          const toPos   = card.target
          const wentPastGo = card.collectGo && (toPos < fromPos || toPos === 0)
          s = updatePlayer(s, player.id, { position: toPos })
          if (toPos === 0 || wentPastGo) {
            s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + L.GO_BONUS })
            s = addLog(s, `🌍 ${player.name} qua Khởi Hành, nhận $${L.GO_BONUS}!`)
          }
          s = processLanding(s, player.id, state.dice)
          break
        }
        case 'move_back': {
          const newPos = ((player.position - card.steps) + 40) % 40
          s = updatePlayer(s, player.id, { position: newPos })
          s = addLog(s, `${player.emoji} ${player.name} lùi ${card.steps} bước`)
          s = processLanding(s, player.id, state.dice)
          break
        }
        case 'go_to_jail': {
          s = updatePlayer(s, player.id, { inJail: true, jailTurns: 0, position: L.JAIL_POSITION })
          s = addLog(s, `🚫 ${player.name} bị giam tại Biên Giới!`)
          break
        }
        case 'jail_free': {
          s = updatePlayer(s, player.id, { jailFreeCards: player.jailFreeCards + 1 })
          s = addLog(s, `${player.emoji} ${player.name} nhận thẻ Ra Tù Miễn Phí!`)
          break
        }
        case 'nearest_airport': {
          const ap = L.getNearestAirport(player.position)
          const wentPastGo = ap <= player.position
          s = updatePlayer(s, player.id, { position: ap })
          if (wentPastGo) {
            s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money + L.GO_BONUS })
            s = addLog(s, `🌍 ${player.name} qua Khởi Hành, nhận $${L.GO_BONUS}!`)
          }
          const ownerId = s.ownership[ap]
          if (ownerId !== undefined && ownerId !== player.id) {
            const rent = L.calculateAirportRent(ownerId, s.ownership) * card.multiplier
            s = payRent(s, player.id, ownerId, rent, BOARD_SPACES[ap].name)
          } else if (ownerId === undefined) {
            s = { ...s, pendingAction: { type: 'land', landType: 'buy', spaceId: ap } }
          }
          break
        }
        case 'nearest_utility': {
          const u = L.getNearestUtility(player.position)
          s = updatePlayer(s, player.id, { position: u })
          const ownerId = s.ownership[u]
          if (ownerId !== undefined && ownerId !== player.id) {
            const rent = (state.dice[0] + state.dice[1]) * card.multiplier
            s = payRent(s, player.id, ownerId, rent, BOARD_SPACES[u].name)
          } else if (ownerId === undefined) {
            s = { ...s, pendingAction: { type: 'land', landType: 'buy', spaceId: u } }
          }
          break
        }
        case 'repair': {
          const buildings = s.buildings || {}
          let houses = 0, hotels = 0
          Object.entries(buildings).forEach(([id, b]) => {
            if (s.ownership[+id] === player.id) {
              if (b.hotel) hotels++; else houses += (b.houses || 0)
            }
          })
          const cost = houses * card.houseCost + hotels * card.hotelCost
          if (cost > 0) {
            s = updatePlayer(s, player.id, { money: getPlayer(s, player.id).money - cost })
            s = addLog(s, `🔧 ${player.name} nộp $${cost} phí bảo trì`)
          }
          break
        }
        default: break
      }
      return s
    }

    // ── jail actions ───────────────────────────────────────────────────────
    case 'PAY_JAIL_FINE': {
      const player = state.players[state.currentPlayerIndex]
      if (!player.inJail) return state
      let s = updatePlayer(state, player.id, { money: player.money - L.JAIL_FINE, inJail: false, jailTurns: 0 })
      return addLog(s, `${player.emoji} ${player.name} nộp $${L.JAIL_FINE} để ra Biên Giới`)
    }

    case 'USE_JAIL_FREE': {
      const player = state.players[state.currentPlayerIndex]
      if (!player.inJail || player.jailFreeCards < 1) return state
      let s = updatePlayer(state, player.id, { jailFreeCards: player.jailFreeCards - 1, inJail: false, jailTurns: 0 })
      return addLog(s, `${player.emoji} ${player.name} dùng thẻ Ra Tù Miễn Phí!`)
    }

    // ── end turn ───────────────────────────────────────────────────────────
    case 'END_TURN': {
      if (state.pendingAction) return state
      const alive = state.players.filter(p => !p.bankrupt)
      if (alive.length === 1) {
        return addLog({ ...state, phase: 'ended', winner: alive[0].id }, `🏆 ${alive[0].name} chiến thắng!`)
      }

      let nextIdx = (state.currentPlayerIndex + 1) % state.players.length
      while (state.players[nextIdx].bankrupt) nextIdx = (nextIdx + 1) % state.players.length

      const next = state.players[nextIdx]
      let s = { ...state, currentPlayerIndex: nextIdx, diceRolled: false, doublesCount: 0, dice: [1, 1] }
      return addLog(s, `--- Lượt của ${next.name} ---`)
    }

    default:
      return state
  }
}
