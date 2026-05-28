import React from 'react'
import { GROUPS, getGridPos, getSide } from '../data/boardData'

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
          {p.emoji}
        </div>
      ))}
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

function PropertyCell({ space, side, playersHere, ownerColor }) {
  const group = GROUPS[space.group]
  const { row, col } = getGridPos(space.id)

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col }} title={`${space.name} — $${space.price}`}>
      <div style={{ ...STRIP_STYLES[side], backgroundColor: group.color }} />
      <OwnerDot color={ownerColor} />
      <div className="cell-inner" style={PADDING_STYLES[side]}>
        <div className="cell-icon">{space.icon}</div>
        <div className="cell-name">{space.name}</div>
        {space.country && <div className="cell-country">{space.country}</div>}
        <div className="cell-price">${space.price}</div>
      </div>
      <PlayerTokens players={playersHere} />
    </div>
  )
}

function SpecialCell({ space, side, playersHere, ownerColor }) {
  const { row, col } = getGridPos(space.id)
  const { bg, border } = SPECIAL_COLORS[space.type] || { bg: '#0d1117', border: '#30363d' }

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col, background: bg, borderColor: border }} title={space.name}>
      <OwnerDot color={ownerColor} />
      <div className="cell-inner" style={PADDING_STYLES[side]}>
        <div className="cell-icon">{space.icon}</div>
        <div className="cell-name">{space.name}</div>
        {space.amount  && <div className="cell-price" style={{ color: '#ff7b72' }}>−${space.amount}</div>}
        {space.price   && space.type !== 'property' && <div className="cell-price">${space.price}</div>}
        {space.country && <div className="cell-country">{space.country}</div>}
      </div>
      <PlayerTokens players={playersHere} />
    </div>
  )
}

function CornerCell({ space, playersHere }) {
  const { row, col } = getGridPos(space.id)

  return (
    <div className="board-cell" style={{ gridRow: row, gridColumn: col, background: CORNER_BG[space.subtype] }} title={space.name}>
      <div className="corner-inner">
        <div className="corner-icon">{space.icon}</div>
        <div className="corner-name">{space.name}</div>
        {space.desc && <div className="corner-desc">{space.desc}</div>}
      </div>
      <PlayerTokens players={playersHere} />
    </div>
  )
}

export default function BoardCell({ space, playersHere = [], ownerColor }) {
  const side = getSide(space.id)
  if (space.type === 'corner')   return <CornerCell space={space} playersHere={playersHere} />
  if (space.type === 'property') return <PropertyCell space={space} side={side} playersHere={playersHere} ownerColor={ownerColor} />
  return <SpecialCell space={space} side={side} playersHere={playersHere} ownerColor={ownerColor} />
}
