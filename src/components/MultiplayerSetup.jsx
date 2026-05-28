import React, { useState, useEffect, useRef } from 'react'
import { socket } from '../socket'
import { PLAYER_PRESETS } from '../game/gameLogic'

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function SetupForm({ onBack, onEnterLobby }) {
  const [name, setName]         = useState('')
  const [presetIdx, setPreset]  = useState(0)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const preset = PLAYER_PRESETS[presetIdx]

  useEffect(() => {
    socket.connect()

    function onRoomCreated({ code, playerIndex, lobbyPlayers }) {
      setLoading(false)
      onEnterLobby({ code, playerIndex, lobbyPlayers, isHost: true })
    }
    function onRoomJoined({ code, playerIndex, lobbyPlayers }) {
      setLoading(false)
      onEnterLobby({ code, playerIndex, lobbyPlayers, isHost: false })
    }
    function onError({ message }) {
      setLoading(false)
      setError(message)
    }

    socket.on('room_created', onRoomCreated)
    socket.on('room_joined', onRoomJoined)
    socket.on('error', onError)

    return () => {
      socket.off('room_created', onRoomCreated)
      socket.off('room_joined', onRoomJoined)
      socket.off('error', onError)
    }
  }, [onEnterLobby])

  function handleBack() {
    socket.disconnect()
    onBack()
  }

  function createRoom() {
    setError('')
    setLoading(true)
    socket.emit('create_room', {
      name: name.trim() || 'Ẩn Danh',
      color: preset.color,
      emoji: preset.emoji,
    })
  }

  function joinRoom() {
    if (joinCode.trim().length < 4) { setError('Nhập đủ 4 ký tự mã phòng!'); return }
    setError('')
    setLoading(true)
    socket.emit('join_room', {
      code: joinCode.trim().toUpperCase(),
      name: name.trim() || 'Ẩn Danh',
      color: preset.color,
      emoji: preset.emoji,
    })
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '44px', marginBottom: '6px' }}>🌐</div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#e6edf3', letterSpacing: '0.06em' }}>
          CHƠI ONLINE
        </h2>
        <p style={{ fontSize: '12px', color: '#8b949e' }}>Chơi với bạn bè qua Internet</p>
      </div>

      {/* Name input */}
      <label style={labelStyle}>Tên của bạn</label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nhập tên..."
        maxLength={20}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = '#3fb950'}
        onBlur={e => e.target.style.borderColor = '#30363d'}
      />

      {/* Avatar picker */}
      <label style={{ ...labelStyle, marginTop: '14px' }}>Chọn nhân vật</label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {PLAYER_PRESETS.map((p, i) => (
          <button key={i} onClick={() => setPreset(i)} style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: p.color,
            border: presetIdx === i ? '3px solid #e6edf3' : '3px solid transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', cursor: 'pointer', transition: 'border 0.15s',
            flexShrink: 0,
          }}>
            {p.emoji}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#ff7b72' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Create room */}
      <button onClick={createRoom} disabled={loading} style={primaryBtnStyle(loading)}>
        {loading ? '⏳ Đang kết nối...' : '🏠 Tạo phòng mới'}
      </button>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
        <div style={{ flex: 1, height: '1px', background: '#30363d' }} />
        <span style={{ fontSize: '11px', color: '#484f58' }}>HOẶC</span>
        <div style={{ flex: 1, height: '1px', background: '#30363d' }} />
      </div>

      {/* Join room */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
          placeholder="MÃ PHÒNG"
          maxLength={4}
          style={{ ...inputStyle, flex: 1, textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800, fontSize: '18px', marginBottom: 0 }}
          onFocus={e => e.target.style.borderColor = '#4169e1'}
          onBlur={e => e.target.style.borderColor = '#30363d'}
          onKeyDown={e => e.key === 'Enter' && joinRoom()}
        />
        <button onClick={joinRoom} disabled={loading} style={{
          ...primaryBtnStyle(loading),
          background: loading ? '#21262d' : 'linear-gradient(135deg,#4169e1,#6e40c9)',
          flex: 'none', width: '90px',
        }}>
          🚪 Vào
        </button>
      </div>

      {/* Back */}
      <button onClick={handleBack} style={{ ...secondaryBtnStyle, marginTop: '16px' }}>
        ← Quay lại
      </button>
    </div>
  )
}

function LobbyScreen({ lobbyData, onGameStart, onBack }) {
  const { code, playerIndex, isHost } = lobbyData
  const [players, setPlayers] = useState(lobbyData.lobbyPlayers)
  const [copied, setCopied]   = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    function onLobbyUpdated({ lobbyPlayers }) {
      setPlayers(lobbyPlayers)
    }
    function onGameStarted({ gameState }) {
      onGameStart({ gameState, playerIndex })
    }
    function onError({ message }) {
      setError(message)
    }

    socket.on('lobby_updated', onLobbyUpdated)
    socket.on('game_started', onGameStarted)
    socket.on('error', onError)

    return () => {
      socket.off('lobby_updated', onLobbyUpdated)
      socket.off('game_started', onGameStarted)
      socket.off('error', onError)
    }
  }, [onGameStart, playerIndex])

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function startGame() {
    setError('')
    socket.emit('start_game')
  }

  function leaveRoom() {
    socket.emit('leave_room')
    socket.disconnect()
    onBack()
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '44px', marginBottom: '6px' }}>🏠</div>
        <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#e6edf3' }}>Phòng Chờ</h2>
      </div>

      {/* Room code */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
          Mã phòng — chia sẻ với bạn bè
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div style={{
            fontSize: '42px', fontWeight: 900, letterSpacing: '0.22em',
            color: '#ffd700', fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(255,215,0,0.4)',
          }}>
            {code}
          </div>
          <button onClick={copyCode} style={{
            background: copied ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (copied ? '#3fb950' : '#30363d'),
            borderRadius: '8px', padding: '8px 12px',
            color: copied ? '#3fb950' : '#8b949e',
            fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? '✓ Đã sao chép' : '📋 Sao chép'}
          </button>
        </div>
      </div>

      {/* Player list */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Người chơi ({players.length}/4)
        </div>
        {players.map((p, i) => (
          <div key={p.socketId} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '8px', marginBottom: '6px',
            background: i === playerIndex ? 'rgba(63,185,80,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (i === playerIndex ? 'rgba(63,185,80,0.25)' : '#30363d'),
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px', flexShrink: 0,
            }}>
              {p.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#e6edf3' }}>{p.name}</span>
              {i === playerIndex && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#3fb950' }}>(bạn)</span>}
            </div>
            {i === 0 && (
              <span style={{ fontSize: '10px', color: '#ffd700', background: 'rgba(255,215,0,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                👑 Host
              </span>
            )}
          </div>
        ))}

        {players.length < 2 && (
          <div style={{ fontSize: '12px', color: '#484f58', textAlign: 'center', padding: '8px', fontStyle: 'italic' }}>
            Đang chờ thêm người chơi...
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#ff7b72' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={leaveRoom} style={{ ...secondaryBtnStyle, flex: 1 }}>
          👋 Rời phòng
        </button>
        {isHost && (
          <button
            onClick={startGame}
            disabled={players.length < 2}
            style={{ ...primaryBtnStyle(players.length < 2), flex: 2 }}
          >
            🚀 Bắt đầu ({players.length} người)
          </button>
        )}
        {!isHost && (
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#484f58', fontStyle: 'italic' }}>
            ⏳ Chờ host bắt đầu...
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MultiplayerSetup({ onBack, onGameStart }) {
  const [screen, setScreen] = useState('setup') // 'setup' | 'lobby'
  const [lobbyData, setLobbyData] = useState(null)

  function handleEnterLobby(data) {
    setLobbyData(data)
    setScreen('lobby')
  }

  function handleGameStart({ gameState, playerIndex }) {
    onGameStart({ socket, myPlayerIndex: playerIndex, initialGameState: gameState })
  }

  function handleBackFromLobby() {
    setLobbyData(null)
    setScreen('setup')
  }

  if (screen === 'lobby' && lobbyData) {
    return (
      <div style={wrapStyle}>
        <LobbyScreen
          lobbyData={lobbyData}
          onGameStart={handleGameStart}
          onBack={handleBackFromLobby}
        />
      </div>
    )
  }

  return (
    <div style={wrapStyle}>
      <SetupForm onBack={onBack} onEnterLobby={handleEnterLobby} />
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wrapStyle = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '24px',
}

const cardStyle = {
  background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
  padding: '28px', width: '100%', maxWidth: '420px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}

const labelStyle = {
  fontSize: '11px', color: '#8b949e', textTransform: 'uppercase',
  letterSpacing: '0.08em', display: 'block', marginBottom: '6px',
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: '#0d1117', border: '1px solid #30363d', borderRadius: '8px',
  padding: '10px 12px', color: '#e6edf3', fontSize: '14px', outline: 'none',
  marginBottom: '4px', transition: 'border-color 0.15s',
}

const primaryBtnStyle = (disabled) => ({
  width: '100%', padding: '12px 8px', borderRadius: '8px', border: 'none',
  background: disabled ? '#21262d' : 'linear-gradient(135deg,#3fb950,#4169e1)',
  color: disabled ? '#484f58' : '#fff',
  fontWeight: 800, fontSize: '14px', letterSpacing: '0.04em',
  cursor: disabled ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
})

const secondaryBtnStyle = {
  width: '100%', padding: '10px 8px', borderRadius: '8px',
  border: '1px solid #30363d', background: 'transparent',
  color: '#8b949e', fontWeight: 600, fontSize: '13px',
  cursor: 'pointer', transition: 'all 0.15s',
}
