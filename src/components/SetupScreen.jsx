import React, { useState } from 'react'
import { PLAYER_PRESETS } from '../game/gameLogic'
import { useGame } from '../context/GameContext'
import Emoji from './Emoji'

export default function SetupScreen() {
  const { dispatch } = useGame()
  const [count, setCount]   = useState(2)
  const [names, setNames]   = useState(['', '', '', '', '', ''])

  function start() {
    const playerConfigs = Array.from({ length: count }, (_, i) => ({
      name:  names[i].trim() || `Người chơi ${i + 1}`,
      color: PLAYER_PRESETS[i].color,
      emoji: PLAYER_PRESETS[i].emoji,
    }))
    dispatch({ type: 'START_GAME', playerConfigs })
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
        padding: '32px', width: '100%', maxWidth: '460px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ marginBottom: '8px' }}><Emoji symbol="🌍" size="48px" /></div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.06em', color: '#e6edf3', marginBottom: '4px' }}>
            KỲ QUAN XÓM LÀO
          </h1>
          <p style={{ fontSize: '12px', color: '#8b949e', letterSpacing: '0.12em' }}>
            Vòng Quanh Thế Giới
          </p>
        </div>

        {/* Player count */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '10px' }}>
            Số người chơi
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setCount(n)} style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                borderColor: count === n ? '#3fb950' : '#30363d',
                background: count === n ? 'rgba(63,185,80,0.15)' : '#0d1117',
                color: count === n ? '#3fb950' : '#8b949e',
                fontWeight: 700, fontSize: '16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player names */}
        <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Tên người chơi
          </label>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: PLAYER_PRESETS[i].color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Emoji symbol={PLAYER_PRESETS[i].emoji} size="17px" />
              </div>
              <input
                value={names[i]}
                onChange={e => setNames(n => n.map((v, j) => j === i ? e.target.value : v))}
                placeholder={`Người chơi ${i + 1}`}
                maxLength={20}
                style={{
                  flex: 1, background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px',
                  padding: '8px 12px', color: '#e6edf3', fontSize: '14px', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = PLAYER_PRESETS[i].color}
                onBlur={e => e.target.style.borderColor = '#30363d'}
              />
            </div>
          ))}
        </div>

        {/* Start button */}
        <button onClick={start} style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: 'linear-gradient(135deg, #3fb950, #4169e1)',
          color: '#fff', fontWeight: 800, fontSize: '16px', letterSpacing: '0.06em',
          cursor: 'pointer', transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.target.style.opacity = '0.85'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          <Emoji symbol="🚀" /> BẮT ĐẦU CHƠI
        </button>
      </div>
    </div>
  )
}
