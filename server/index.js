import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import path from 'path'

import { reducer, initialState } from '../src/game/reducer.js'

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
//   host: socketId,            // first player's socket ID
//   lobbyPlayers: [{ socketId, name, color, emoji }],
//   gameState: null | object,  // authoritative game state
//   phase: 'lobby' | 'playing'
// }
const rooms = new Map()

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  } while (rooms.has(code))
  return code
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  let currentRoomCode = null   // which room this socket is in

  console.log(`[+] Connected: ${socket.id}`)

  // ── Create a new room ──────────────────────────────────────────────────────
  socket.on('create_room', ({ name, color, emoji }) => {
    if (currentRoomCode) return // already in a room

    const code = generateCode()
    const room = {
      code,
      host: socket.id,
      lobbyPlayers: [{ socketId: socket.id, name, color, emoji }],
      gameState: null,
      phase: 'lobby',
    }
    rooms.set(code, room)
    currentRoomCode = code
    socket.join(code)

    console.log(`[room] Created ${code} by ${name}`)
    socket.emit('room_created', {
      code,
      playerIndex: 0,
      lobbyPlayers: room.lobbyPlayers,
    })
  })

  // ── Join an existing room ──────────────────────────────────────────────────
  socket.on('join_room', ({ code, name, color, emoji }) => {
    const upper = code.toUpperCase()
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
    if (currentRoomCode) return

    room.lobbyPlayers.push({ socketId: socket.id, name, color, emoji })
    currentRoomCode = upper
    socket.join(upper)

    const playerIndex = room.lobbyPlayers.length - 1
    console.log(`[room] ${name} joined ${upper} as player ${playerIndex}`)

    socket.emit('room_joined', {
      code: upper,
      playerIndex,
      lobbyPlayers: room.lobbyPlayers,
    })
    // Broadcast updated lobby to everyone else
    socket.to(upper).emit('lobby_updated', { lobbyPlayers: room.lobbyPlayers })
  })

  // ── Host starts the game ───────────────────────────────────────────────────
  socket.on('start_game', () => {
    const room = rooms.get(currentRoomCode)
    if (!room) return
    if (room.host !== socket.id) {
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
    })

    console.log(`[room] Game started in ${currentRoomCode} (${room.lobbyPlayers.length} players)`)
    io.to(currentRoomCode).emit('game_started', { gameState: room.gameState })
  })

  // ── Player dispatches a game action ───────────────────────────────────────
  socket.on('game_action', (action) => {
    const room = rooms.get(currentRoomCode)
    if (!room || room.phase !== 'playing' || !room.gameState) return

    // Validate it's this player's turn
    const playerIndex = room.lobbyPlayers.findIndex(p => p.socketId === socket.id)
    if (playerIndex < 0 || playerIndex !== room.gameState.currentPlayerIndex) {
      return // Silently ignore out-of-turn actions
    }

    const prevState = room.gameState
    room.gameState  = reducer(prevState, action)

    io.to(currentRoomCode).emit('state_updated', { gameState: room.gameState })
  })

  // ── Leave room manually ────────────────────────────────────────────────────
  socket.on('leave_room', () => handleLeave())

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] Disconnected: ${socket.id}`)
    handleLeave()
  })

  function handleLeave() {
    if (!currentRoomCode) return
    const room = rooms.get(currentRoomCode)
    if (!room) { currentRoomCode = null; return }

    if (room.phase === 'lobby') {
      // Remove from lobby
      room.lobbyPlayers = room.lobbyPlayers.filter(p => p.socketId !== socket.id)
      if (room.lobbyPlayers.length === 0) {
        rooms.delete(currentRoomCode)
        console.log(`[room] Deleted empty room ${currentRoomCode}`)
      } else {
        // Transfer host if needed
        if (room.host === socket.id) {
          room.host = room.lobbyPlayers[0].socketId
        }
        io.to(currentRoomCode).emit('lobby_updated', { lobbyPlayers: room.lobbyPlayers })
      }
    } else {
      // Game is running — notify others (optional: mark player as disconnected)
      const playerIndex = room.lobbyPlayers.findIndex(p => p.socketId === socket.id)
      if (playerIndex >= 0) {
        io.to(currentRoomCode).emit('player_disconnected', {
          playerIndex,
          name: room.lobbyPlayers[playerIndex].name,
        })
      }
    }

    socket.leave(currentRoomCode)
    currentRoomCode = null
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
