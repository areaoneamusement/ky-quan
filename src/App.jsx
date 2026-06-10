import React, { useState, useEffect, useRef } from 'react'
import { GameProvider, useGame } from './context/GameContext'
import { OnlineProvider } from './context/OnlineGameContext'
import SetupScreen from './components/SetupScreen'
import Board from './components/Board'
import GamePanel from './components/GamePanel'
import ActionModal from './components/ActionModal'
import MultiplayerSetup from './components/MultiplayerSetup'
import OrderRollScreen from './components/OrderRollScreen'
import { loadSession } from './utils/playerId'
import { canAutoEndTurn } from './game/reducer'
import { WifiOff } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Top banner — shows the latest log line whenever dice are rolled ────────

function TopBanner() {
  const { state } = useGame()
  const { dice, diceRolled, log, phase } = state
  const [visible, setVisible] = useState(false)
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
      setVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setVisible(false), 3500)
    }
  }, [dice, diceRolled])

  return (
    <AnimatePresence>
      {phase === 'playing' && visible && log[0] && (
        <motion.div
          className="top-banner"
          initial={{ opacity: 0, y: -16, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -16, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
          🎲 {log[0]}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Connection status banner (online mode) ─────────────────────────────────

function ConnectionBanner() {
  const { isOnline, connectionStatus } = useGame()
  if (!isOnline || connectionStatus === 'connected') return null
  return (
    <div className="connection-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <WifiOff size={13} /> Mất kết nối — đang kết nối lại...
    </div>
  )
}

// ─── Game view (board + panel + modal) ───────────────────────────────────────

function GameApp() {
  const { state, dispatch, isOnline, myPlayerIndex } = useGame()
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

  // Tự động kết thúc lượt sau khi xử lý xong, nhưng để chậm lại một chút
  // để người chơi kịp xem kết quả tung xúc xắc (đặc biệt khi đang bị giam)
  const isMyTurn = !isOnline || myPlayerIndex === currentPlayerIndex
  useEffect(() => {
    if (!isMyTurn || !canAutoEndTurn(state)) return
    const t = setTimeout(() => dispatch({ type: 'END_TURN' }), 1800)
    return () => clearTimeout(t)
  }, [state, isMyTurn, dispatch])

  // In solo mode: setup screen before game starts
  if (phase === 'setup') return <SetupScreen />

  // Roll-for-order phase before the actual game begins
  if (phase === 'order_roll' || phase === 'order_result') {
    return (
      <>
        <ConnectionBanner />
        <OrderRollScreen />
      </>
    )
  }

  return (
    <div className="game-layout">
      <ConnectionBanner />
      <TopBanner />
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
        <h1 className="font-display" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.08em', color: '#e6edf3', marginBottom: '4px' }}>
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
  const [mode, setMode] = useState(() => {
    // Tự động vào lại phòng nếu đã có phiên trước đó, hoặc nếu mở từ link mã QR
    const hasJoinLink = new URLSearchParams(window.location.search).has('join')
    const hasSession  = !!loadSession()
    return (hasJoinLink || hasSession) ? 'online_setup' : 'home'
  })
  const [onlineData, setOnlineData] = useState(null)

  function handleOnlineGameStart({ socket, myPlayerIndex, initialGameState, code, playerId }) {
    setOnlineData({ socket, myPlayerIndex, initialGameState, code, playerId })
    setMode('online_game')
  }

  function handleExitToHome() {
    setOnlineData(null)
    setMode('home')
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
        code={onlineData.code}
        playerId={onlineData.playerId}
        onExit={handleExitToHome}
      >
        <GameApp />
      </OnlineProvider>
    )
  }

  return null
}
