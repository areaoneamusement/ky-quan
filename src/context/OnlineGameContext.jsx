import React, { useState, useEffect, useCallback } from 'react'
import { GameContext } from './GameContext'
import { initialState } from '../game/reducer'
import { clearSession } from '../utils/playerId'

// Online Provider — game state comes from server via Socket.io broadcasts.
// dispatch() forwards actions to the server instead of running locally.

export function OnlineProvider({ children, socket, myPlayerIndex, initialGameState, playerId, code, onExit }) {
  const [state, setState] = useState(initialGameState || { ...initialState, phase: 'playing' })
  const [connectionStatus, setConnectionStatus] = useState('connected') // connected | reconnecting | disconnected
  const [disconnectedPlayers, setDisconnectedPlayers] = useState(() => new Set())

  useEffect(() => {
    function onGameStarted({ gameState }) {
      setState(gameState)
    }
    function onStateUpdated({ gameState }) {
      setState(gameState)
    }
    function onPlayerDisconnected({ playerIndex }) {
      setDisconnectedPlayers(prev => new Set(prev).add(playerIndex))
    }
    function onPlayerReconnected({ playerIndex }) {
      setDisconnectedPlayers(prev => {
        const next = new Set(prev)
        next.delete(playerIndex)
        return next
      })
    }
    function onRejoined({ gameState }) {
      setState(gameState)
      setConnectionStatus('connected')
    }
    function onDisconnect() {
      setConnectionStatus('reconnecting')
    }
    function onConnect() {
      // Socket reconnected (new transport) — re-claim our seat in the room
      if (playerId) socket.emit('rejoin_room', { playerId })
    }
    function onConnectError() {
      setConnectionStatus('disconnected')
    }

    socket.on('game_started', onGameStarted)
    socket.on('state_updated', onStateUpdated)
    socket.on('player_disconnected', onPlayerDisconnected)
    socket.on('player_reconnected', onPlayerReconnected)
    socket.on('rejoined', onRejoined)
    socket.on('disconnect', onDisconnect)
    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)

    return () => {
      socket.off('game_started', onGameStarted)
      socket.off('state_updated', onStateUpdated)
      socket.off('player_disconnected', onPlayerDisconnected)
      socket.off('player_reconnected', onPlayerReconnected)
      socket.off('rejoined', onRejoined)
      socket.off('disconnect', onDisconnect)
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
    }
  }, [socket, playerId])

  const dispatch = useCallback((action) => {
    // Only send if it's this player's turn (client-side guard)
    socket.emit('game_action', action)
  }, [socket])

  // Logout — leave the room without ending the game for the others.
  // The seat stays reserved (auto-play takes over) and our session is
  // kept locally so we can rejoin the same room/season later.
  const logout = useCallback(() => {
    socket.emit('leave_room')
    socket.disconnect()
    clearSession()
    onExit?.()
  }, [socket, onExit])

  return (
    <GameContext.Provider value={{
      state, dispatch, isOnline: true, myPlayerIndex,
      connectionStatus, disconnectedPlayers, code, logout,
    }}>
      {children}
    </GameContext.Provider>
  )
}
