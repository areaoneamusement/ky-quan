import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import path from 'path'

import { reducer, initialState } from '../src/game/reducer.js'
import { BOARD_SPACES } from '../src/data/boardData.js'
import * as L from '../src/game/gameLogic.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app        = express()
const httpServer = createServer(app)
const io         = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

// ─── In-memory rooms ──────────────────────────────────────────────────────────
// rooms[code] = {
//   code,
//   hostPlayerId,
//   lobbyPlayers: [{ playerId, socketId, name, color, emoji, connected }],
//   gameState: null | object,  // authoritative game state
//   phase: 'lobby' | 'playing',
//   emptyTimer, botTimer,
// }
const rooms       = new Map()
// playerId -> roomCode  (cho phép tham gia lại sau khi mất kết nối)
const playerRooms = new Map()

const ROOM_GRACE_MS  = 10 * 60 * 1000 // dọn phòng nếu không ai quay lại sau 10 phút
const BOT_DELAY_MS   = 1100

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

// Chỉ gửi cho client những gì cần thiết — không lộ socketId nội bộ
function publicLobby(lobbyPlayers) {
  return lobbyPlayers.map(({ playerId, name, color, emoji, connected }) => ({
    playerId, name, color, emoji, connected,
  }))
}

// ─── Auto-chơi hộ người chơi bị mất kết nối ──────────────────────────────────
function maybeRunBot(room) {
  if (!room || room.phase !== 'playing' || !room.gameState) return
  const gs = room.gameState
  if (gs.phase !== 'playing' && gs.phase !== 'order_roll' && gs.phase !== 'order_result') return
  const idx = gs.phase === 'order_roll' ? gs.orderRollQueue[0] : gs.currentPlayerIndex
  if (idx === undefined) return
  const lp = room.lobbyPlayers[idx]
  if (!lp || lp.connected) return
  if (room.botTimer) return
  room.botTimer = setTimeout(() => {
    room.botTimer = null
    botStep(room)
  }, BOT_DELAY_MS)
}

function botStep(room) {
  if (!room || room.phase !== 'playing' || !room.gameState) return
  const gs = room.gameState
  if (gs.phase !== 'playing' && gs.phase !== 'order_roll' && gs.phase !== 'order_result') return
  const idx = gs.phase === 'order_roll' ? gs.orderRollQueue[0] : gs.currentPlayerIndex
  const lp = room.lobbyPlayers[idx]
  if (!lp || lp.connected) return

  let action
  if (gs.phase === 'order_roll') {
    action = { type: 'ROLL_ORDER' }
  } else if (gs.phase === 'order_result') {
    action = { type: 'BEGIN_PLAY' }
  } else {
    const player = gs.players[idx]
    if (gs.pendingAction) {
      const pa = gs.pendingAction
      if (pa.landType === 'buy') {
        const space = BOARD_SPACES[pa.spaceId]
        action = (player.money >= space.price + 100) ? { type: 'BUY_PROPERTY' } : { type: 'DECLINE_PROPERTY' }
      } else if (pa.landType === 'card') {
        action = { type: 'RESOLVE_CARD', card: pa.card }
      } else {
        action = { type: 'RESOLVE_LAND' }
      }
    } else if (!gs.diceRolled || (L.isDoubles(gs.dice) && gs.doublesCount > 0)) {
      action = { type: 'ROLL_DICE' }
    } else {
      action = { type: 'END_TURN' }
    }
  }

  room.gameState = reducer(gs, action)
  io.to(room.code).emit('state_updated', { gameState: room.gameState })
  maybeRunBot(room)
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  let currentRoomCode = null   // which room this socket is in
  let myPlayerId      = null   // persistent player identity

  console.log(`[+] Connected: ${socket.id}`)

  // ── Create a new room ──────────────────────────────────────────────────────
  socket.on('create_room', ({ name, color, emoji, playerId }) => {
    if (currentRoomCode) return
    if (!playerId) return socket.emit('error', { message: 'Thiếu định danh người chơi, vui lòng tải lại trang!' })
    const cleanName = (name || '').trim().slice(0, 20)
    if (!cleanName) return socket.emit('error', { message: 'Vui lòng nhập tên người chơi!' })

    const code = generateCode()
    const room = {
      code,
      hostPlayerId: playerId,
      lobbyPlayers: [{ playerId, socketId: socket.id, name: cleanName, color, emoji, connected: true }],
      gameState: null,
      phase: 'lobby',
      emptyTimer: null,
      botTimer: null,
    }
    rooms.set(code, room)
    playerRooms.set(playerId, code)
    currentRoomCode = code
    myPlayerId = playerId
    socket.join(code)

    console.log(`[room] Created ${code} by ${cleanName}`)
    socket.emit('room_created', {
      code,
      playerIndex: 0,
      lobbyPlayers: publicLobby(room.lobbyPlayers),
    })
  })

  // ── Join an existing room ──────────────────────────────────────────────────
  socket.on('join_room', ({ code, name, color, emoji, playerId }) => {
    if (!playerId) return socket.emit('error', { message: 'Thiếu định danh người chơi, vui lòng tải lại trang!' })
    const cleanName = (name || '').trim().slice(0, 20)
    if (!cleanName) return socket.emit('error', { message: 'Vui lòng nhập tên người chơi!' })

    const upper = (code || '').toUpperCase()
    const room  = rooms.get(upper)

    if (!room) {
      return socket.emit('error', { message: 'Không tìm thấy phòng!' })
    }
    if (room.phase === 'playing') {
      return socket.emit('error', { message: 'Trận đấu đã bắt đầu rồi!' })
    }
    if (room.lobbyPlayers.length >= 4) {
      return socket.emit('error', { message: 'Phòng đã đầy (tối đa 4 người)!' })
    }
    if (room.lobbyPlayers.some(p => p.playerId === playerId)) {
      return socket.emit('error', { message: 'Bạn đã ở trong phòng này!' })
    }
    if (currentRoomCode) return

    room.lobbyPlayers.push({ playerId, socketId: socket.id, name: cleanName, color, emoji, connected: true })
    playerRooms.set(playerId, upper)
    currentRoomCode = upper
    myPlayerId = playerId
    socket.join(upper)

    const playerIndex = room.lobbyPlayers.length - 1
    console.log(`[room] ${cleanName} joined ${upper} as player ${playerIndex}`)

    socket.emit('room_joined', {
      code: upper,
      playerIndex,
      lobbyPlayers: publicLobby(room.lobbyPlayers),
    })
    // Broadcast updated lobby to everyone else
    socket.to(upper).emit('lobby_updated', { lobbyPlayers: publicLobby(room.lobbyPlayers) })
  })

  // ── Rejoin after disconnect / page reload ───────────────────────────────────
  socket.on('rejoin_room', ({ playerId }) => {
    if (!playerId) return socket.emit('rejoin_failed')
    const code = playerRooms.get(playerId)
    const room = code && rooms.get(code)
    if (!room) return socket.emit('rejoin_failed')

    const idx = room.lobbyPlayers.findIndex(p => p.playerId === playerId)
    if (idx < 0) return socket.emit('rejoin_failed')

    if (currentRoomCode && currentRoomCode !== code) handleLeave()

    room.lobbyPlayers[idx].socketId  = socket.id
    room.lobbyPlayers[idx].connected = true
    currentRoomCode = code
    myPlayerId = playerId
    socket.join(code)

    if (room.emptyTimer) {
      clearTimeout(room.emptyTimer)
      room.emptyTimer = null
    }

    if (room.phase === 'playing' && room.gameState) {
      console.log(`[room] ${room.lobbyPlayers[idx].name} rejoined ${code}`)
      socket.emit('rejoined', {
        code,
        playerIndex: idx,
        gameState: room.gameState,
        lobbyPlayers: publicLobby(room.lobbyPlayers),
      })
      io.to(code).emit('player_reconnected', { playerIndex: idx, name: room.lobbyPlayers[idx].name })
    } else {
      socket.emit('rejoined_lobby', {
        code,
        playerIndex: idx,
        lobbyPlayers: publicLobby(room.lobbyPlayers),
      })
      io.to(code).emit('lobby_updated', { lobbyPlayers: publicLobby(room.lobbyPlayers) })
    }
  })

  // ── Host starts the game ───────────────────────────────────────────────────
  socket.on('start_game', (payload = {}) => {
    const room = rooms.get(currentRoomCode)
    if (!room) return
    if (room.hostPlayerId !== myPlayerId) {
      return socket.emit('error', { message: 'Chỉ host mới có thể bắt đầu!' })
    }
    if (room.lobbyPlayers.length < 2) {
      return socket.emit('error', { message: 'Cần ít nhất 2 người chơi!' })
    }

    room.phase     = 'playing'
    room.gameState = reducer({ ...initialState }, {
      type: 'START_GAME',
      playerConfigs: room.lobbyPlayers.map(p => ({
        name: p.name, color: p.color, emoji: p.emoji,
      })),
      maxRounds: payload.maxRounds,
    })

    console.log(`[room] Game started in ${currentRoomCode} (${room.lobbyPlayers.length} players)`)
    io.to(currentRoomCode).emit('game_started', { gameState: room.gameState })
    maybeRunBot(room)
  })

  // ── Player dispatches a game action ───────────────────────────────────────
  socket.on('game_action', (action) => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'playing' || !room.gameState) return

    const playerIndex = room.lobbyPlayers.findIndex(p => p.playerId === myPlayerId)
    const gs = room.gameState
    const expectedIndex = gs.phase === 'order_roll' ? gs.orderRollQueue[0] : gs.currentPlayerIndex
    if (playerIndex < 0 || playerIndex !== expectedIndex) {
      return // Silently ignore out-of-turn actions
    }

    room.gameState = reducer(gs, action)
    io.to(currentRoomCode).emit('state_updated', { gameState: room.gameState })
    maybeRunBot(room)
  })

  // ── Leave room manually (logout — does not affect the running game) ───────
  socket.on('leave_room', () => handleLeave())

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`)
    handleLeave()
  })

  function handleLeave() {
    if (!currentRoomCode) return
    const room = rooms.get(currentRoomCode)
    if (!room) { currentRoomCode = null; myPlayerId = null; return }

    if (room.phase === 'lobby') {
      // Remove from lobby entirely
      room.lobbyPlayers = room.lobbyPlayers.filter(p => p.playerId !== myPlayerId)
      playerRooms.delete(myPlayerId)
      if (room.lobbyPlayers.length === 0) {
        rooms.delete(currentRoomCode)
        console.log(`[room] Deleted empty room ${currentRoomCode}`)
      } else {
        if (room.hostPlayerId === myPlayerId) {
          room.hostPlayerId = room.lobbyPlayers[0].playerId
        }
        io.to(currentRoomCode).emit('lobby_updated', { lobbyPlayers: publicLobby(room.lobbyPlayers) })
      }
    } else {
      // Game is running — keep the seat, mark disconnected, let auto-play take over
      const idx = room.lobbyPlayers.findIndex(p => p.playerId === myPlayerId)
      if (idx >= 0) {
        room.lobbyPlayers[idx].connected = false
        io.to(currentRoomCode).emit('player_disconnected', {
          playerIndex: idx,
          name: room.lobbyPlayers[idx].name,
        })
        maybeRunBot(room)
      }

      if (room.lobbyPlayers.every(p => !p.connected)) {
        clearTimeout(room.emptyTimer)
        room.emptyTimer = setTimeout(() => {
          room.lobbyPlayers.forEach(p => playerRooms.delete(p.playerId))
          rooms.delete(currentRoomCode)
          console.log(`[room] Deleted abandoned room ${currentRoomCode}`)
        }, ROOM_GRACE_MS)
      }
    }

    socket.leave(currentRoomCode)
    currentRoomCode = null
    myPlayerId = null
  }
})

// ─── Serve React app in production ───────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist')
  app.use(express.static(distPath))
  // SPA fallback — send index.html for all non-asset routes
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`🌍 Kỳ Quan Server running on port ${PORT}`)
})
