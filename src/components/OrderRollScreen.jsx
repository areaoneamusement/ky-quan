import React, { useEffect, useState } from 'react'
import { useGame } from '../context/GameContext'

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const RESULT_DELAY_MS = 4000

export default function OrderRollScreen() {
  const { state, dispatch, isOnline, myPlayerIndex } = useGame()
  const { players, orderRolls, orderRollQueue, dice, diceRolled, log, phase, currentPlayerIndex } = state

  const isResult = phase === 'order_result'
  const winnerId = isResult ? currentPlayerIndex : null
  const winner   = players.find(p => p.id === winnerId)

  const currentRollerId = orderRollQueue[0]
  const currentRoller   = players.find(p => p.id === currentRollerId)
  const isMyTurn = !isOnline || myPlayerIndex === currentRollerId

  const [countdown, setCountdown] = useState(Math.ceil(RESULT_DELAY_MS / 1000))

  // Sau khi có kết quả, hiển thị vài giây cho mọi người xem rồi mới vào bàn chơi
  useEffect(() => {
    if (!isResult) {
      setCountdown(Math.ceil(RESULT_DELAY_MS / 1000))
      return
    }
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    const shouldDispatch = !isOnline || myPlayerIndex === winnerId
    let timer
    if (shouldDispatch) {
      timer = setTimeout(() => dispatch({ type: 'BEGIN_PLAY' }), RESULT_DELAY_MS)
    }
    return () => { clearInterval(tick); clearTimeout(timer) }
  }, [isResult, winnerId])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
        padding: '32px', width: '100%', maxWidth: '440px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>{isResult ? '🏁' : '🎲'}</div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#e6edf3', marginBottom: '4px', letterSpacing: '0.04em' }}>
          {isResult ? 'KẾT QUẢ THỨ TỰ CHƠI' : 'XÁC ĐỊNH THỨ TỰ CHƠI'}
        </h2>
        <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '24px' }}>
          {isResult
            ? `${winner?.emoji || ''} ${winner?.name || ''} có điểm cao nhất — đi trước tiên!`
            : 'Mỗi người tung xúc xắc một lần — ai cao nhất đi trước!'}
        </p>

        {/* Dice display */}
        {!isResult && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '20px' }}>
            <Die value={dice[0]} rolled={diceRolled} />
            <Die value={dice[1]} rolled={diceRolled} />
          </div>
        )}

        {/* Players & their rolls */}
        <div style={{ marginBottom: '24px' }}>
          {players.map(p => {
            const result = orderRolls.find(r => r.id === p.id)
            const isCurrent = !isResult && p.id === currentRollerId
            const isWinner  = isResult && p.id === winnerId
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
                background: (isCurrent || isWinner) ? 'rgba(63,185,80,0.08)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + ((isCurrent || isWinner) ? 'rgba(63,185,80,0.25)' : '#30363d'),
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', flexShrink: 0,
                }}>{p.emoji}</div>
                <div style={{ flex: 1, textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>
                  {p.name}
                  {isWinner && <span style={{ marginLeft: '6px' }}>🏆</span>}
                  {isOnline && p.id === myPlayerIndex && (
                    <span style={{ marginLeft: '6px', fontSize: '9px', color: '#4169e1', background: 'rgba(65,105,225,0.15)', padding: '1px 5px', borderRadius: '3px' }}>bạn</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: result ? '#ffd700' : '#484f58' }}>
                  {result ? result.value : (isCurrent ? '🎲...' : '—')}
                </div>
              </div>
            )
          })}
        </div>

        {/* Roll button / countdown */}
        {isResult ? (
          <div style={{ fontSize: '13px', color: '#8b949e', fontStyle: 'italic', padding: '14px' }}>
            ⏳ Bắt đầu trò chơi sau {countdown}s...
          </div>
        ) : isMyTurn ? (
          <button
            onClick={() => dispatch({ type: 'ROLL_ORDER' })}
            style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg,#3fb950,#4169e1)',
              color: '#fff', fontWeight: 800, fontSize: '15px', letterSpacing: '0.04em', cursor: 'pointer',
            }}
          >
            🎲 {currentRoller?.name} — Tung xúc xắc!
          </button>
        ) : (
          <div style={{ fontSize: '13px', color: '#8b949e', fontStyle: 'italic', padding: '14px' }}>
            ⏳ Đang chờ {currentRoller?.emoji} {currentRoller?.name} tung xúc xắc...
          </div>
        )}

        {/* Latest log line */}
        {log[0] && (
          <p style={{ marginTop: '16px', fontSize: '11px', color: '#484f58' }}>{log[0]}</p>
        )}
      </div>
    </div>
  )
}

function Die({ value, rolled }) {
  return (
    <div style={{
      width: '52px', height: '52px', borderRadius: '10px',
      background: rolled ? '#e6edf3' : '#21262d',
      border: '2px solid ' + (rolled ? '#e6edf3' : '#30363d'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '32px', transition: 'all 0.2s', color: '#1a1a2e',
    }}>
      {DICE_FACES[value] || '⚀'}
    </div>
  )
}
