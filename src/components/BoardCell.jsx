import React from 'react'
import { GROUPS, getGridPos, getSide } from '../data/boardData'
import Emoji from './Emoji'

const STRIP_STYLES = {
  bottom: { top: 0, left: 0, right: 0, height: '22%', position: 'absolute', zIndex: 2 },
  top:    { bottom: 0, left: 0, right: 0, height: '22%', position: 'absolute', zIndex: 2 },
  left:   { right: 0, top: 0, bottom: 0, width: '22%', position: 'absolute', zIndex: 2 },
  right:  { left: 0, top: 0, bottom: 0, width: '22%', position: 'absolute', zIndex: 2 },
}

const PADDING_STYLES = {
  bottom: { paddingTop: '26%' },
  top:    { paddingBottom: '26%' },
  left:   { paddingRight: '26%' },
  right:  { paddingLeft: '26%' },
}

const SPECIAL_COLORS = {
  chance:  { bg: 'rgba(255,165,0,0.08)',  border: 'rgba(255,165,0,0.35)' },
  chest:   { bg: 'rgba(130,80,255,0.08)', border: 'rgba(130,80,255,0.35)' },
  tax:     { bg: 'rgba(255,60,60,0.08)',  border: 'rgba(255,60,60,0.35)' },
  airport: { bg: 'rgba(88,166,255,0.08)', border: 'rgba(88,166,255,0.35)' },
  utility: { bg: 'rgba(63,185,80,0.08)',  border: 'rgba(63,185,80,0.35)' },
}

const CORNER_BG = {
  go:       'linear-gradient(135deg, #0d1117 0%, #0f2210 100%)',
  jail:     'linear-gradient(135deg, #0d1117 0%, #1a1106 100%)',
  parking:  'linear-gradient(135deg, #0d1117 0%, #0a1520 100%)',
  gotojail: 'linear-gradient(135deg, #0d1117 0%, #1a0a0a 100%)',
}

// Player tokens shown inside a cell
function PlayerTokens({ players }) {
  if (!players || players.length === 0) return null
  return (
    <div style={{
      position: 'absolute', bottom: '2px', left: '2px', right: '2px',
      display: 'flex', flexWrap: 'wrap', gap: '2px', zIndex: 10,
    }}>
      {players.map(p => (
        <div key={p.id} title={p.name} style={{
          minWidth: 'clamp(12px,2.4vmin,28px)',
          height: 'clamp(12px,2.4vmin,28px)',
          borderRadius: '6px',
          background: p.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(8px,1.6vmin,18px)',
          border: '2px solid rgba(255,255,255,0.6)',
          boxShadow: `0 2px 8px ${p.color}bb`,
          lineHeight: 1,
          flexShrink: 0,
        }}>
          <Emoji symbol={p.emoji} />
        </div>
      ))}
    </div>
  )
}

// "Bạn đang ở đây" tag
function HereTag() {
  return (
    <div style={{
      position: 'absolute', top: '2px', left: '2px', zIndex: 12,
      background: 'rgba(65,105,225,0.9)', color: '#fff',
      fontSize: 'clamp(5px,1vmin,9px)', fontWeight: 800,
      padding: '1px 4px', borderRadius: '4px',
      whiteSpace: 'nowrap', lineHeight: 1.4,
      boxShadow: '0 0 6px rgba(65,105,225,0.8)',
      animation: 'pulseHere 1.2s ease infinite alternate',
    }}>
      <Emoji symbol="📍" /> Bạn
    </div>
  )
}

// Token "ma" hiển thị khi avatar đang di chuyển từng bước qua ô này
function GhostToken({ player }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%', zIndex: 15,
      transform: 'translate(-50%, -50%)',
      width: 'clamp(16px,3.2vmin,34px)', height: 'clamp(16px,3.2vmin,34px)',
      borderRadius: '50%', background: player.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 'clamp(10px,2vmin,22px)',
      border: '2px solid #fff',
      boxShadow: `0 0 12px 4px ${player.color}`,
      animation: 'ghostHop 0.22s ease',
    }}>
      <Emoji symbol={player.emoji} />
    </div>
  )
}

// Small ownership dot in top-right of strip
function OwnerDot({ color }) {
  if (!color) return null
  return (
    <div style={{
      position: 'absolute', top: '2px', right: '2px', zIndex: 5,
      width: 'clamp(4px,1vmin,10px)', height: 'clamp(4px,1vmin,10px)',
      borderRadius: '50%', background: color,
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: `0 0 4px ${color}`,
    }} />
  )
}

const HIGHLIGHT_STYLE = {
  boxShadow: 'inset 0 0 0 3px #ffd700, 0 0 14px 2px rgba(255,215,0,0.7)',
  zIndex: 6,
}

function PropertyCell({ space, side, playersHere, ownerColor, isMyPosition, ghostPlayer, highlight }) {
  const group = GROUPS[space.group]
  const { row, col } = getGridPos(space.id)

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col, ...(highlight ? HIGHLIGHT_STYLE : {}) }} title={`${space.name} — $${space.price}`}>
      <div style={{ ...STRIP_STYLES[side], backgroundColor: group.color }} />
      <OwnerDot color={ownerColor} />
      {isMyPosition && <HereTag />}
      <div className="cell-inner" style={PADDING_STYLES[side]}>
        <div className="cell-icon"><Emoji symbol={space.icon} /></div>
        <div className="cell-name">{space.name}</div>
        {space.country && <div className="cell-country">{space.country}</div>}
        <div className="cell-price">${space.price}</div>
      </div>
      <PlayerTokens players={playersHere} />
      {ghostPlayer && <GhostToken player={ghostPlayer} />}
    </div>
  )
}

function SpecialCell({ space, side, playersHere, ownerColor, isMyPosition, ghostPlayer, highlight }) {
  const { row, col } = getGridPos(space.id)
  const { bg, border } = SPECIAL_COLORS[space.type] || { bg: '#0d1117', border: '#30363d' }

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col, background: bg, borderColor: border, ...(highlight ? HIGHLIGHT_STYLE : {}) }} title={space.name}>
      <OwnerDot color={ownerColor} />
      {isMyPosition && <HereTag />}
      <div className="cell-inner" style={PADDING_STYLES[side]}>
        <div className="cell-icon"><Emoji symbol={space.icon} /></div>
        <div className="cell-name">{space.name}</div>
        {space.amount  && <div className="cell-price" style={{ color: '#ff7b72' }}>−${space.amount}</div>}
        {space.price   && space.type !== 'property' && <div className="cell-price">${space.price}</div>}
        {space.country && <div className="cell-country">{space.country}</div>}
      </div>
      <PlayerTokens players={playersHere} />
      {ghostPlayer && <GhostToken player={ghostPlayer} />}
    </div>
  )
}

function CornerCell({ space, playersHere, isMyPosition, ghostPlayer, highlight }) {
  const { row, col } = getGridPos(space.id)

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col, background: CORNER_BG[space.subtype], ...(highlight ? HIGHLIGHT_STYLE : {}) }} title={space.name}>
      {isMyPosition && <HereTag />}
      <div className="corner-inner">
        <div className="corner-icon"><Emoji symbol={space.icon} /></div>
        <div className="corner-name">{space.name}</div>
        {space.desc && <div className="corner-desc">{space.desc}</div>}
      </div>
      <PlayerTokens players={playersHere} />
      {ghostPlayer && <GhostToken player={ghostPlayer} />}
    </div>
  )
}

export default function BoardCell({ space, playersHere = [], ownerColor, isMyPosition, ghostPlayer, highlight }) {
  const side = getSide(space.id)
  const extra = { isMyPosition, ghostPlayer, highlight }
  if (space.type === 'corner')   return <CornerCell space={space} playersHere={playersHere} {...extra} />
  if (space.type === 'property') return <PropertyCell space={space} side={side} playersHere={playersHere} ownerColor={ownerColor} {...extra} />
  return <SpecialCell space={space} side={side} playersHere={playersHere} ownerColor={ownerColor} {...extra} />
}
