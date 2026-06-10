import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BOARD_SPACES, GROUPS } from '../data/boardData'
import { useGame } from '../context/GameContext'

export default function ActionModal() {
  const { state, dispatch } = useGame()
  const { pendingAction, players, currentPlayerIndex, ownership } = state
  const isLand = pendingAction && pendingAction.type === 'land'

  const player  = isLand ? players[currentPlayerIndex] : null
  const { landType, spaceId } = pendingAction || {}
  const space   = spaceId !== undefined ? BOARD_SPACES[spaceId] : null
  const group   = space?.group ? GROUPS[space.group] : null
  const showHdr = space && ['property', 'airport', 'utility', 'tax'].includes(space.type)

  return (
    <AnimatePresence>
      {isLand && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: '16px',
        padding: '24px 22px', width: '100%', maxWidth: '380px',
        textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Space header (property / airport / utility / tax) */}
        {showHdr && (
          <>
            <div style={{ fontSize: '44px', marginBottom: '6px' }}>{space.icon}</div>
            {group && (
              <div style={{
                display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                background: group.color + '33', color: group.color,
                fontSize: '11px', fontWeight: 700, marginBottom: '8px',
              }}>{group.name}</div>
            )}
            <h2 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' }}>
              {space.name}
            </h2>
            {space.country && (
              <p style={{ fontSize: '12px', color: '#8b949e', margin: '0 0 14px' }}>{space.country}</p>
            )}
          </>
        )}

        {/* Per-type content */}
        {landType === 'buy'     && <BuyContent space={space} player={player} dispatch={dispatch} />}
        {landType === 'rent'    && <RentContent pa={pendingAction} players={players} dispatch={dispatch} />}
        {landType === 'own'     && <OwnContent space={space} spaceId={spaceId} ownership={ownership} dispatch={dispatch} />}
        {landType === 'card'    && <CardContent pa={pendingAction} dispatch={dispatch} />}
        {landType === 'tax'     && <TaxContent pa={pendingAction} player={player} dispatch={dispatch} />}
        {landType === 'gotojail'&& <JailContent dispatch={dispatch} />}
        {landType === 'corner'  && <CornerContent space={space} dispatch={dispatch} />}
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Buy ────────────────────────────────────────────────────────────────────────
function BuyContent({ space, player, dispatch }) {
  const canAfford = player.money >= space.price
  return (
    <>
      <div style={{
        background: '#0d1117', borderRadius: '10px', padding: '12px 16px',
        marginBottom: '12px', display: 'flex', justifyContent: 'space-around',
      }}>
        <Stat label="Giá mua"   value={`$${space.price}`}            color="#ffd700" />
        {space.baseRent && <Stat label="Tiền thuê"  value={`$${space.baseRent}`}       color="#ff8c32" />}
        {space.baseRent && <Stat label="Độc quyền"  value={`$${space.baseRent * 2}`}   color="#ff4d4d" />}
      </div>

      {/* Rules */}
      <div style={{
        background: 'rgba(88,166,255,0.07)', border: '1px solid rgba(88,166,255,0.2)',
        borderRadius: '8px', padding: '10px 12px', marginBottom: '12px',
        textAlign: 'left', fontSize: '11px', color: '#8b949e', lineHeight: 1.7,
      }}>
        <div style={{ color: '#58a6ff', fontWeight: 700, marginBottom: '4px' }}>📋 Luật chơi</div>
        <div>• <b style={{ color: '#e6edf3' }}>Mua đứt</b> → sở hữu, thu tiền thuê từ người khác</div>
        <div>• <b style={{ color: '#e6edf3' }}>Tiền thuê</b> → người đến ô của bạn trả tiền</div>
        <div>• <b style={{ color: '#e6edf3' }}>Độc quyền</b> → sở hữu cả nhóm màu, tiền thuê ×2</div>
        <div>• <b style={{ color: '#e6edf3' }}>Sân bay</b> → càng nhiều sân bay, thuê càng cao</div>
      </div>

      <p style={{ fontSize: '12px', color: '#8b949e', marginBottom: '14px' }}>
        {player.emoji} {player.name}:{' '}
        <strong style={{ color: canAfford ? '#3fb950' : '#ff4d4d' }}>${player.money}</strong>
      </p>

      <div style={{ display: 'flex', gap: '10px' }}>
        <Btn primary onClick={() => dispatch({ type: 'BUY_PROPERTY' })} disabled={!canAfford}>
          🏳️ Mua ngay
        </Btn>
        <Btn onClick={() => dispatch({ type: 'DECLINE_PROPERTY' })}>
          ⏭ Bỏ qua
        </Btn>
      </div>
    </>
  )
}

// ── Rent ───────────────────────────────────────────────────────────────────────
function RentContent({ pa, players, dispatch }) {
  const owner = players.find(p => p.id === pa.ownerId)
  return (
    <>
      <div style={{
        background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
        borderRadius: '10px', padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '28px', marginBottom: '6px' }}>💸</div>
        <div className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: '#ff7b72' }}>${pa.amount}</div>
        <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '6px' }}>
          Tiền thuê cho{' '}
          <span style={{ color: owner?.color || '#e6edf3', fontWeight: 700 }}>
            {owner?.emoji} {owner?.name}
          </span>
        </div>
      </div>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_LAND' })}>
        ✅ Xác nhận trả tiền
      </Btn>
    </>
  )
}

// ── Own property ──────────────────────────────────────────────────────────────
function OwnContent({ space, dispatch }) {
  return (
    <>
      <div style={{
        background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.3)',
        borderRadius: '10px', padding: '14px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#3fb950', marginBottom: '4px' }}>
          🏳️ Tài sản của bạn!
        </div>
        {space?.baseRent && (
          <div style={{ fontSize: '12px', color: '#8b949e' }}>
            Người khác đến đây trả ${space.baseRent} (độc quyền: ${space.baseRent * 2})
          </div>
        )}
      </div>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_LAND' })}>
        ✅ Tiếp tục
      </Btn>
    </>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────────
function CardContent({ pa, dispatch }) {
  const { card, deck } = pa
  const isChance = deck === 'chance'
  return (
    <>
      <div style={{ fontSize: '36px', marginBottom: '6px' }}>{isChance ? '🧭' : '📜'}</div>
      <div style={{
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em',
        color: isChance ? '#ff8c32' : '#a371f7', fontWeight: 700, marginBottom: '10px',
      }}>
        {isChance ? 'Thám Hiểm' : 'Quỹ Di Sản'}
      </div>
      <h3 className="font-display" style={{ fontSize: '16px', fontWeight: 800, color: '#e6edf3', margin: '0 0 8px', lineHeight: 1.3 }}>
        {card.title}
      </h3>
      <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px', lineHeight: 1.5 }}>
        {card.desc}
      </p>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_CARD', card })}>
        ✅ Xác nhận
      </Btn>
    </>
  )
}

// ── Tax ────────────────────────────────────────────────────────────────────────
function TaxContent({ pa, player, dispatch }) {
  const after = player.money - pa.amount
  return (
    <>
      <div style={{
        background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)',
        borderRadius: '10px', padding: '16px', marginBottom: '16px',
      }}>
        <div style={{ fontSize: '28px', marginBottom: '6px' }}>💸</div>
        <div className="font-display" style={{ fontSize: '26px', fontWeight: 800, color: '#ff7b72' }}>−${pa.amount}</div>
        <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '6px' }}>
          Số dư: ${player.money} → <span style={{ color: after < 0 ? '#ff4d4d' : '#3fb950' }}>${after}</span>
        </div>
      </div>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_LAND' })}>
        ✅ Xác nhận
      </Btn>
    </>
  )
}

// ── Go to jail ─────────────────────────────────────────────────────────────────
function JailContent({ dispatch }) {
  return (
    <>
      <div style={{ fontSize: '52px', margin: '4px 0 10px' }}>🚫</div>
      <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 800, color: '#ff7b72', margin: '0 0 8px' }}>
        Bị giam tại Biên Giới!
      </h3>
      <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px', lineHeight: 1.5 }}>
        Không được di chuyển. Tung đôi hoặc nộp $50 để thoát ra.
      </p>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_LAND' })}>
        😔 Vào tù thôi
      </Btn>
    </>
  )
}

// ── Corner ─────────────────────────────────────────────────────────────────────
function CornerContent({ space, dispatch }) {
  const info = {
    go:      { icon: '🎉', title: 'Khởi Hành!',         msg: 'Nhận $200 khi đi qua hoặc dừng tại đây.' },
    jail:    { icon: '👀', title: 'Thăm Biên Giới',      msg: 'Chỉ thăm thôi, không bị giam.' },
    parking: { icon: '🏕️', title: 'Base Camp',           msg: 'Nghỉ ngơi miễn phí — không có gì xảy ra.' },
  }[space?.subtype] || { icon: space?.icon || '✨', title: space?.name || '', msg: '' }

  return (
    <>
      <div style={{ fontSize: '48px', margin: '4px 0 10px' }}>{info.icon}</div>
      <h3 className="font-display" style={{ fontSize: '17px', fontWeight: 800, color: '#e6edf3', margin: '0 0 8px' }}>
        {info.title}
      </h3>
      <p style={{ fontSize: '13px', color: '#8b949e', marginBottom: '20px' }}>{info.msg}</p>
      <Btn primary onClick={() => dispatch({ type: 'RESOLVE_LAND' })}>
        ✅ Tiếp tục
      </Btn>
    </>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '16px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#8b949e' }}>{label}</div>
    </div>
  )
}

function Btn({ children, onClick, disabled, primary }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      background: primary
        ? (disabled ? '#21262d' : 'linear-gradient(135deg,#3fb950,#4169e1)')
        : '#21262d',
      color: disabled ? '#484f58' : '#e6edf3',
      fontWeight: 700, fontSize: '13px', transition: 'opacity 0.15s',
    }}>
      {children}
    </button>
  )
}
