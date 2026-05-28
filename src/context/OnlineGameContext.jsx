import React, { useState, useEffect, useCallback } from 'react'
import { GameContext } from './GameContext'
import { initialState } from '../game/reducer'

// Online Provider — game state comes from server via Socket.io broadcasts.
// dispatch() forwards actions to the server instead of running locally.

export function OnlineProvider({ children, socket, myPlayerIndex, initialGameState }) {
  const [state, setState] = useState(initialGameState || { ...initialState, phase: 'playing' })

  useEffect(() => {
    function onGameStarted({ gameState }) {
      setState(gameState)
    }
    function onStateUpdated({ gameState }) {
      setState(gameState)
    }
    socket.on('game_started', onGameStarted)
    socket.on('state_updated', onStateUpdated)
    return () => {
      socket.off('game_started', onGameStarted)
      socket.off('state_updated', onStateUpdated)
    }
  }, [socket])

  const dispatch = useCallback((action) => {
    // Only send if it's this player's turn (client-side guard)
    socket.emit('game_action', action)
  }, [socket])

  return (
    <GameContext.Provider value={{ state, dispatch, isOnline: true, myPlayerIndex }}>
      {children}
    </GameContext.Provider>
  )
}
