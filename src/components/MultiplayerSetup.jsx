import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Copy, Check, QrCode } from 'lucide-react'
import { socket } from '../socket'
import { PLAYER_PRESETS } from '../game/gameLogic'
import { getPlayerId, saveSession, loadSession, clearSession } from '../utils/playerId'
import Emoji from './Emoji'

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function ConnectingScreen({ message }) {
  return (
    <div style={cardStyle}>
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <div style={{ marginBottom: '12px' }}><Emoji symbol="🌐" size="44px" /></div>
        <p style={{ color: '#8b949e', fontSize: '13px' }}>{message}</p>
      </div>
    </div>
  )
}

function SetupForm({ onBack, onEnterLobby, initialJoinCode, connError }) {
  const [name, setName]         = useState('')
  const [presetIdx, setPreset]  = useState(0)
  const [joinCode, setJoinCode] = useState(initialJoinCode || '')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const preset = PLAYER_PRESETS[presetIdx]
  const playerId = getPlayerId()

  useEffect(() => {
    function onRoomCreated({ code, playerIndex, lobbyPlayers }) {
      setLoading(false)
      saveSession({ code, playerId })
      onEnterLobby({ code, playerIndex, lobbyPlayers, isHost: true })
    }
    function onRoomJoined({ code, playerIndex, lobbyPlayers }) {
      setLoading(false)
      saveSession({ code, playerId })
      onEnterLobby({ code, playerIndex, lobbyPlayers, isHost: playerIndex === 0 })
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
  }, [onEnterLobby, playerId])

  function handleBack() {
    socket.disconnect()
    onBack()
  }

  function validateName() {
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn!')
      return false
    }
    return true
  }

  function createRoom() {
    setError('')
    if (!validateName()) return
    setLoading(true)
    socket.emit('create_room', {
      name: name.trim(),
      color: preset.color,
      emoji: preset.emoji,
      playerId,
    })
  }

  function joinRoom() {
    if (!validateName()) return
    if (joinCode.trim().length < 4) { setError('Nhập đủ 4 ký tự mã phòng!'); return }
    setError('')
    setLoading(true)
    socket.emit('join_room', {
      code: joinCode.trim().toUpperCase(),
      name: name.trim(),
      color: preset.color,
      emoji: preset.emoji,
      playerId,
    })
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ marginBottom: '6px' }}><Emoji symbol="🌐" size="44px" /></div>
        <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#e6edf3', letterSpacing: '0.06em' }}>
          CHƠI ONLINE
        </h2>
        <p style={{ fontSize: '12px', color: '#8b949e' }}>Chơi với bạn bè qua Internet</p>
      </div>

      {connError && (
        <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#ffd700' }}>
          <Emoji symbol="⏳" /> {connError}
        </div>
      )}

      {/* Name input */}
      <label style={labelStyle}>Tên của bạn <span style={{ color: '#ff7b72' }}>*</span></label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nhập tên của bạn (bắt buộc)..."
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
            cursor: 'pointer', transition: 'border 0.15s',
            flexShrink: 0,
          }}>
            <Emoji symbol={p.emoji} size="19px" />
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#ff7b72' }}>
          <Emoji symbol="⚠️" /> {error}
        </div>
      )}

      {/* Create room */}
      <button onClick={createRoom} disabled={loading} style={primaryBtnStyle(loading)}>
        {loading ? <><Emoji symbol="⏳" /> Đang kết nối...</> : <><Emoji symbol="🏠" /> Tạo phòng mới</>}
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
          <Emoji symbol="🚪" /> Vào
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
  const [maxRounds, setMaxRounds] = useState(0)
  const [qrSrc, setQrSrc]     = useState('')
  const [showQr, setShowQr]   = useState(false)

  const joinUrl = `${window.location.origin}${window.location.pathname}?join=${code}`

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

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { width: 220, margin: 1, color: { dark: '#0d1117', light: '#e6edf3' } })
      .then(setQrSrc)
      .catch(() => setQrSrc(''))
  }, [joinUrl])

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function startGame() {
    setError('')
    socket.emit('start_game', { maxRounds })
  }

  function leaveRoom() {
    socket.emit('leave_room')
    socket.disconnect()
    clearSession()
    onBack()
  }

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ marginBottom: '6px' }}><Emoji symbol="🏠" size="44px" /></div>
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
            display: 'flex', alignItems: 'center', gap: '6px',
            background: copied ? 'rgba(63,185,80,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (copied ? '#3fb950' : '#30363d'),
            borderRadius: '8px', padding: '8px 12px',
            color: copied ? '#3fb950' : '#8b949e',
            fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Đã sao chép' : 'Sao chép'}
          </button>
          <button onClick={() => setShowQr(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: showQr ? 'rgba(65,105,225,0.18)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (showQr ? '#4169e1' : '#30363d'),
            borderRadius: '8px', padding: '8px 12px',
            color: showQr ? '#79b8ff' : '#8b949e',
            fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <QrCode size={14} /> QR
          </button>
        </div>

        {showQr && (
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            {qrSrc
              ? <img src={qrSrc} alt="Mã QR vào phòng" style={{ width: '160px', height: '160px', borderRadius: '10px', border: '1px solid #30363d' }} />
              : <div style={{ fontSize: '12px', color: '#484f58' }}>Đang tạo mã QR...</div>}
            <div style={{ fontSize: '11px', color: '#8b949e' }}>Quét để vào phòng nhanh</div>
          </div>
        )}
      </div>

      {/* Player list */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Người chơi ({players.length}/4)
        </div>
        {players.map((p, i) => (
          <div key={p.playerId} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '8px', marginBottom: '6px',
            background: i === playerIndex ? 'rgba(63,185,80,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid ' + (i === playerIndex ? 'rgba(63,185,80,0.25)' : '#30363d'),
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Emoji symbol={p.emoji} size="16px" />
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

      {/* Round limit (host only) */}
      {isHost && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Số vòng chơi
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 10, 15, 20].map(n => (
              <button key={n} onClick={() => setMaxRounds(n)} style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid',
                borderColor: maxRounds === n ? '#3fb950' : '#30363d',
                background: maxRounds === n ? 'rgba(63,185,80,0.15)' : '#0d1117',
                color: maxRounds === n ? '#3fb950' : '#8b949e',
                fontWeight: 700, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {n === 0 ? 'Không giới hạn' : `${n} vòng`}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '14px', fontSize: '12px', color: '#ff7b72' }}>
          <Emoji symbol="⚠️" /> {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={leaveRoom} style={{ ...secondaryBtnStyle, flex: 1 }}>
          <Emoji symbol="👋" /> Rời phòng
        </button>
        {isHost && (
          <button
            onClick={startGame}
            disabled={players.length < 2}
            style={{ ...primaryBtnStyle(players.length < 2), flex: 2 }}
          >
            <Emoji symbol="🚀" /> Bắt đầu ({players.length} người)
          </button>
        )}
        {!isHost && (
          <div style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#484f58', fontStyle: 'italic' }}>
            <Emoji symbol="⏳" /> Chờ host bắt đầu...
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MultiplayerSetup({ onBack, onGameStart }) {
  // 'connecting' | 'setup' | 'lobby'
  const [screen, setScreen] = useState('connecting')
  const [lobbyData, setLobbyData] = useState(null)
  const [connError, setConnError] = useState('')
  const initialJoinCode = useRef(new URLSearchParams(window.location.search).get('join') || '').current

  useEffect(() => {
    const playerId = getPlayerId()
    const session = loadSession()

    function attemptRejoin() {
      if (session?.code && session?.playerId === playerId) {
        socket.emit('rejoin_room', { playerId })
      } else {
        setScreen('setup')
      }
    }

    function onConnect() {
      setConnError('')
      attemptRejoin()
    }
    function onConnectError() {
      setConnError('Không thể kết nối đến máy chủ. Đang thử kết nối lại...')
    }
    function onRejoined({ code, playerIndex, gameState }) {
      saveSession({ code, playerId })
      onGameStart({ socket, myPlayerIndex: playerIndex, initialGameState: gameState, code, playerId })
    }
    function onRejoinedLobby({ code, playerIndex, lobbyPlayers }) {
      saveSession({ code, playerId })
      setLobbyData({ code, playerIndex, lobbyPlayers, isHost: playerIndex === 0 })
      setScreen('lobby')
    }
    function onRejoinFailed() {
      clearSession()
      setScreen('setup')
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onConnectError)
    socket.on('rejoined', onRejoined)
    socket.on('rejoined_lobby', onRejoinedLobby)
    socket.on('rejoin_failed', onRejoinFailed)

    socket.connect()
    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
      socket.off('rejoined', onRejoined)
      socket.off('rejoined_lobby', onRejoinedLobby)
      socket.off('rejoin_failed', onRejoinFailed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnterLobby(data) {
    setLobbyData(data)
    setScreen('lobby')
  }

  function handleGameStart({ gameState, playerIndex }) {
    const playerId = getPlayerId()
    onGameStart({ socket, myPlayerIndex: playerIndex, initialGameState: gameState, code: lobbyData.code, playerId })
  }

  function handleBackFromLobby() {
    setLobbyData(null)
    setScreen('setup')
  }

  if (screen === 'connecting') {
    return (
      <div style={wrapStyle}>
        <ConnectingScreen message={connError || 'Đang kết nối...'} />
      </div>
    )
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
      <SetupForm onBack={onBack} onEnterLobby={handleEnterLobby} initialJoinCode={initialJoinCode} connError={connError} />
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
