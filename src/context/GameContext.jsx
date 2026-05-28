import React, { createContext, useContext, useReducer } from 'react'
import { reducer, initialState } from '../game/reducer'

// Shared context used by both SoloProvider and OnlineProvider
export const GameContext = createContext(null)

// ─── Solo Provider (local reducer, single device) ───────────────────────────

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <GameContext.Provider value={{ state, dispatch, isOnline: false, myPlayerIndex: null }}>
      {children}
    </GameContext.Provider>
  )
}

// ─── Shared hook ─────────────────────────────────────────────────────────────

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be inside GameProvider or OnlineProvider')
  return ctx
}
