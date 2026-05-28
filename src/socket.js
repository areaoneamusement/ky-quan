import { io } from 'socket.io-client'

// Create socket with autoConnect: false — we manually connect when user enters online mode.
// In dev: Vite proxies /socket.io → http://localhost:4000
// In production: connects to same origin (server serves both static + socket.io)
export const socket = io({ autoConnect: false })
