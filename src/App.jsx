import React, { useState, useEffect, useRef } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { OnlineProvider } from './context/OnlineGameContext'
import SetupScreen from './components/SetupScreen'
import Board from './components/Board'
import GamePanel from './components/GamePanel'
import ActionModal from './components/ActionModal'
import MultiplayerSetup from './components/MultiplayerSetup'

// ─── Game view (board + panel + modal) ───────────────────────────────────────

function GameApp() {
  const { state, isOnline, myPlayerIndex } = useGame()
  const { phase, dice, diceRolled, currentPlayerIndex } = state

  // Delay ActionModal until after dice animation (3s) so they don't overlap
  const [modalReady, setModalReady] = useState(true)
  const prevDiceRef = useRef(null)
  const timerRef    = useRef(null)

  useEffect(() => {
    if (!diceRolled) {
      prevDiceRef.current = null
      return
    }
    const prev = prevDiceRef.current
    if (prev === null || prev[0] !== dice[0] || prev[1] !== dice[1]) {
      prevDiceRef.current = dice
      setModalReady(false)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setModalReady(true), 2800)
    }
  }, [dice, diceRolled])

  // In solo mode: setup screen before game starts
  if (phase === 'setup') return <SetupScreen />

  // In online mode: modal only shows for the active player
  const isMyTurn = !isOnline || myPlayerIndex === currentPlayerIndex

  return (
    <div className="game-layout">
      <div className="board-area">
        <Board />
      </div>
      <div className="panel-area">
        <GamePanel />
      </div>
      {modalReady && isMyTurn && <ActionModal />}
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onSolo, onOnline }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
        padding: '36px 32px', width: '100%', maxWidth: '400px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '10px' }}>🌍</div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.08em', color: '#e6edf3', marginBottom: '4px' }}>
          KỲ QUAN XÓM LÀO
        </h1>
        <p style={{ fontSize: '12px', color: '#8b949e', letterSpacing: '0.14em', marginBottom: '32px' }}>
          VÒNG QUANH THẾ GIỚI
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={onSolo} style={{
            padding: '14px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg,#3fb950,#2ea043)',
            color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            👤 CHƠI ĐỘC LẬP
          </button>

          <button onClick={onOnline} style={{
            padding: '14px', borderRadius: '10px', border: '1px solid #4169e1',
            background: 'rgba(65,105,225,0.12)',
            color: '#79b8ff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(65,105,225,0.25)'; e.currentTarget.style.color = '#e6edf3' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(65,105,225,0.12)'; e.currentTarget.style.color = '#79b8ff' }}
          >
            🌐 CHƠI ONLINE
          </button>
        </div>

        <p style={{ marginTop: '24px', fontSize: '10px', color: '#484f58' }}>
          Chơi online với bạn bè — khác nhà, khác mạng
        </p>
      </div>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  // mode: 'home' | 'solo' | 'online_setup' | 'online_game'
  const [mode, setMode] = useState('home')
  const [onlineData, setOnlineData] = useState(null)

  function handleOnlineGameStart({ socket, myPlayerIndex, initialGameState }) {
    setOnlineData({ socket, myPlayerIndex, initialGameState })
    setMode('online_game')
  }

  if (mode === 'home') {
    return (
      <HomeScreen
        onSolo={() => setMode('solo')}
        onOnline={() => setMode('online_setup')}
      />
    )
  }

  if (mode === 'solo') {
    return (
      <GameProvider>
        <GameApp />
      </GameProvider>
    )
  }

  if (mode === 'online_setup') {
    return (
      <MultiplayerSetup
        onBack={() => setMode('home')}
        onGameStart={handleOnlineGameStart}
      />
    )
  }

  if (mode === 'online_game' && onlineData) {
    return (
      <OnlineProvider
        socket={onlineData.socket}
        myPlayerIndex={onlineData.myPlayerIndex}
        initialGameState={onlineData.initialGameState}
      >
        <GameApp />
      </OnlineProvider>
    )
  }

  return null
}
