import React, { useState, useEffect, useRef } from 'react'
import { BOARD_SPACES, GROUPS } from '../data/boardData'
import BoardCell from './BoardCell'
import { useGame } from '../context/GameContext'

const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function DiceAnimation({ dice }) {
  const sum = dice[0] + dice[1]
  const isDouble = dice[0] === dice[1]
  return (
    <div className="dice-overlay">
      <div className="dice-overlay-inner">
        <div className="dice-row">
          <span className="die-big die-1">{DICE_FACES[dice[0]]}</span>
          <span className="die-big die-2">{DICE_FACES[dice[1]]}</span>
        </div>
        <div className="dice-total">{sum}</div>
        {isDouble && <div className="dice-doubles">🎲 Đôi! Tung lại!</div>}
      </div>
    </div>
  )
}

function BoardCenter() {
  return (
    <div className="board-center" style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}>
      <div className="center-globe">🌍</div>
      <div className="center-title">KỲ QUAN XÓM LÀO</div>
      <div className="center-subtitle">Vòng Quanh Thế Giới</div>
      <div className="center-divider" />
      <div className="center-legend">
        {Object.entries(GROUPS).map(([key, g]) => (
          <div key={key} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: g.color }} />
            <span>{g.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Board() {
  const { state } = useGame()
  const { players, ownership, phase, dice, diceRolled } = state

  // Track dice rolls to trigger animation
  const [rollKey, setRollKey] = useState(null)
  const [showAnim, setShowAnim] = useState(false)
  const prevDice = useRef(dice)
  const animTimer = useRef(null)

  useEffect(() => {
    if (
      diceRolled &&
      (dice[0] !== prevDice.current[0] || dice[1] !== prevDice.current[1])
    ) {
      clearTimeout(animTimer.current)
      setRollKey(Date.now())
      setShowAnim(true)
      animTimer.current = setTimeout(() => setShowAnim(false), 3000)
    }
    prevDice.current = dice
  }, [dice, diceRolled])

  // Build position → players map
  const playerMap = {}
  if (phase === 'playing' || phase === 'ended') {
    players.forEach(p => {
      if (!p.bankrupt) {
        if (!playerMap[p.position]) playerMap[p.position] = []
        playerMap[p.position].push(p)
      }
    })
  }

  return (
    <div style={{ padding: 'clamp(4px,1vmin,16px)', display: 'flex', justifyContent: 'center' }}>
      {/* Wrapper needs position:relative so the animation overlay works */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className="board-grid">
          {BOARD_SPACES.map(space => (
            <BoardCell
              key={space.id}
              space={space}
              playersHere={playerMap[space.id] || []}
              ownerColor={
                ownership[space.id] !== undefined
                  ? players[ownership[space.id]]?.color
                  : undefined
              }
            />
          ))}
          <BoardCenter />
        </div>

        {/* Dice animation — outside board-grid to avoid overflow:hidden clipping */}
        {showAnim && <DiceAnimation key={rollKey} dice={dice} />}
      </div>
    </div>
  )
}
