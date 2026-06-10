import React from 'react'
import { useGame } from '../context/GameContext'
import { BOARD_SPACES } from '../data/boardData'
import { isDoubles, calculateNetWorth } from '../game/gameLogic'

export default function GamePanel() {
  const { state, dispatch, isOnline, myPlayerIndex, logout, disconnectedPlayers, code } = useGame()
  const { players, currentPlayerIndex, ownership, dice, diceRolled, doublesCount, pendingAction, log, phase, winner } = state
  const player = players[currentPlayerIndex]

  // In online mode, only the active player can act
  const isMyTurn = !isOnline || myPlayerIndex === currentPlayerIndex

  const canReroll  = isMyTurn && diceRolled && isDoubles(dice) && doublesCount > 0 && !pendingAction && !player?.inJail
  const canRoll    = isMyTurn && ((!diceRolled && !pendingAction && !player?.bankrupt) || canReroll)

  if (phase === 'ended') {
    const w = players.find(p => p.id === winner)
    return (
      <div className="game-panel">
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>🏆</div>
          <h2 className="font-display" style={{ color: '#ffd700', fontSize: '20px', fontWeight: 800 }}>{w?.name}</h2>
          <p style={{ color: '#8b949e', fontSize: '13px' }}>Chiến Thắng!</p>
          <p className="font-display" style={{ color: '#3fb950', fontSize: '18px', fontWeight: 700, marginTop: '8px' }}>
            ${w?.money?.toLocaleString()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="game-panel">
      {/* Online room bar + logout */}
      {isOnline && (
        <div className="panel-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
          <div style={{ fontSize: '11px', color: '#8b949e' }}>
            🌐 Phòng <span style={{ color: '#ffd700', fontWeight: 800, letterSpacing: '0.1em' }}>{code}</span>
          </div>
          <button onClick={logout} style={{
            background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
            borderRadius: '6px', padding: '4px 10px', color: '#ff7b72',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
          }}>
            🚪 Đăng xuất
          </button>
        </div>
      )}

      {/* Current player */}
      <div className="panel-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: player.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
          }}>{player.emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#e6edf3' }}>
              {player.name}
              {isOnline && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#4169e1', background: 'rgba(65,105,225,0.15)', padding: '2px 5px', borderRadius: '4px' }}>🌐</span>}
            </div>
            <div style={{ fontSize: '11px', color: '#8b949e' }}>
              {isOnline && !isMyTurn ? '⏳ Chờ lượt...' : 'Lượt đang chơi'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="font-display" style={{ fontWeight: 800, fontSize: '16px', color: '#ffd700' }}>${player.money.toLocaleString()}</div>
            <div style={{ fontSize: '10px', color: '#8b949e' }}>ô {player.position}</div>
          </div>
        </div>

        {/* In jail indicator */}
        {player.inJail && (
          <div style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', fontSize: '12px', color: '#ff7b72' }}>
            🛂 Đang bị giam — lượt {player.jailTurns}/{3}
            {player.jailFreeCards > 0 && (
              <button onClick={() => dispatch({ type: 'USE_JAIL_FREE' })} disabled={!isMyTurn} style={smallBtnStyle('#a371f7', !isMyTurn)}>
                Dùng thẻ tự do
              </button>
            )}
            <button onClick={() => dispatch({ type: 'PAY_JAIL_FINE' })} disabled={!isMyTurn || player.money < 50}
              style={smallBtnStyle('#ffd700', player.money < 50)}>
              Nộp $50
            </button>
          </div>
        )}
      </div>

      {/* Dice */}
      <div className="panel-section" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
          <Die value={dice[0]} rolled={diceRolled} />
          <Die value={dice[1]} rolled={diceRolled} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => dispatch({ type: 'ROLL_DICE' })}
            disabled={!canRoll}
            style={actionBtnStyle(!canRoll, canReroll ? 'reroll' : 'primary')}
          >
            {canReroll ? '🎲 Tung Lại!' : '🎲 Tung Xúc Xắc'}
          </button>
        </div>
      </div>

      {/* All players */}
      <div className="panel-section">
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Tất cả người chơi
        </div>
        {players.map(p => (
          <PlayerRow key={p.id} player={p} isActive={p.id === player.id}
            isMe={isOnline && p.id === myPlayerIndex}
            isDisconnected={isOnline && disconnectedPlayers?.has(p.id)} />
        ))}
      </div>

      {/* Tổng tài sản & xếp hạng realtime */}
      <NetWorthRanking players={players} ownership={ownership} myPlayerIndex={isOnline ? myPlayerIndex : null} />

      {/* Tài sản của tôi */}
      <MyAssets players={players} ownership={ownership} myId={isOnline ? myPlayerIndex : currentPlayerIndex} isOnline={isOnline} />

      {/* Log */}
      <div className="panel-section" style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Nhật ký
        </div>
        <div style={{ overflowY: 'auto', maxHeight: '160px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: '11px', color: i === 0 ? '#e6edf3' : '#484f58', lineHeight: 1.4 }}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Die({ value, rolled }) {
  const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  return (
    <div style={{
      width: '52px', height: '52px', borderRadius: '10px',
      background: rolled ? '#e6edf3' : '#21262d',
      border: '2px solid ' + (rolled ? '#e6edf3' : '#30363d'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '32px', transition: 'all 0.2s',
      color: '#1a1a2e',
    }}>
      {faces[value] || '⚀'}
    </div>
  )
}

function PlayerRow({ player, isActive, isMe, isDisconnected }) {
  const space = BOARD_SPACES[player.position]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 8px', borderRadius: '8px', marginBottom: '4px',
      background: isActive ? 'rgba(63,185,80,0.08)' : 'transparent',
      border: isActive ? '1px solid rgba(63,185,80,0.2)' : '1px solid transparent',
      opacity: player.bankrupt ? 0.4 : 1,
    }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: player.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', flexShrink: 0 }}>
        {player.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#3fb950' : '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {player.name} {player.inJail ? '🛂' : ''}
          {isMe && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#4169e1', background: 'rgba(65,105,225,0.15)', padding: '1px 5px', borderRadius: '3px' }}>bạn</span>}
          {isDisconnected && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#ffd700', background: 'rgba(255,215,0,0.12)', padding: '1px 5px', borderRadius: '3px' }}>🔌 tự chơi</span>}
        </div>
        <div style={{ fontSize: '10px', color: '#8b949e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {space?.name || '—'}
        </div>
      </div>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffd700', flexShrink: 0 }}>
        ${player.money.toLocaleString()}
      </div>
    </div>
  )
}

// ── Tổng tài sản & xếp hạng realtime ───────────────────────────────────────────
function NetWorthRanking({ players, ownership, myPlayerIndex }) {
  const ranked = [...players]
    .map(p => ({ ...p, netWorth: calculateNetWorth(p, ownership) }))
    .sort((a, b) => b.netWorth - a.netWorth)

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣']

  return (
    <div className="panel-section">
      <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        Xếp hạng tổng tài sản
      </div>
      {ranked.map((p, i) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 8px', borderRadius: '8px', marginBottom: '3px',
          background: p.id === myPlayerIndex ? 'rgba(65,105,225,0.08)' : 'transparent',
          opacity: p.bankrupt ? 0.4 : 1,
        }}>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>{medals[i] || `${i + 1}.`}</span>
          <span style={{ fontSize: '13px', flexShrink: 0 }}>{p.emoji}</span>
          <div style={{ flex: 1, fontSize: '12px', fontWeight: 700, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#3fb950' }}>
            ${p.netWorth.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Tài sản của tôi ─────────────────────────────────────────────────────────────
function MyAssets({ players, ownership, myId, isOnline }) {
  const me = players.find(p => p.id === myId)
  if (!me) return null

  const owned = Object.entries(ownership)
    .filter(([, ownerId]) => ownerId === myId)
    .map(([spaceId]) => BOARD_SPACES[+spaceId])
    .filter(Boolean)

  const totalValue = owned.reduce((sum, s) => sum + (s.price || 0), 0)

  return (
    <div className="panel-section">
      <div style={{ fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        🏳️ Tài sản của {isOnline ? 'tôi' : me.name}
      </div>
      {owned.length === 0 ? (
        <div style={{ fontSize: '12px', color: '#484f58', fontStyle: 'italic', textAlign: 'center', padding: '6px' }}>
          Chưa sở hữu tài sản nào
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
            {owned.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span>{s.icon}</span>
                <span style={{ flex: 1, color: '#e6edf3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                <span style={{ color: '#ffd700', fontWeight: 700 }}>${s.price}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#8b949e' }}>Tổng giá trị ({owned.length})</span>
            <span style={{ color: '#3fb950', fontWeight: 800 }}>${totalValue.toLocaleString()}</span>
          </div>
        </>
      )}
    </div>
  )
}

const actionBtnStyle = (disabled, variant) => ({
  flex: 1, padding: '10px 8px', borderRadius: '8px', border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled
    ? '#21262d'
    : variant === 'primary'
      ? 'linear-gradient(135deg,#3fb950,#4169e1)'
      : variant === 'reroll'
        ? 'linear-gradient(135deg,#ffd700,#ff8c00)'
        : '#21262d',
  color: disabled ? '#484f58' : '#e6edf3',
  fontWeight: 700, fontSize: '12px', transition: 'opacity 0.15s',
  animation: variant === 'reroll' && !disabled ? 'pulseBtn 0.8s ease infinite alternate' : 'none',
})

const smallBtnStyle = (color, disabled) => ({
  display: 'inline-block', marginLeft: '8px', padding: '2px 8px',
  background: disabled ? 'transparent' : color + '22',
  color: disabled ? '#484f58' : color,
  border: '1px solid ' + (disabled ? '#30363d' : color),
  borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
})
