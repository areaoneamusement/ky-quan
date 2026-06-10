import React, { useState, useEffect, useRef } from 'react'
import { BOARD_SPACES, GROUPS } from '../data/boardData'
import BoardCell from './BoardCell'
import { useGame } from '../context/GameContext'
import Emoji from './Emoji'

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
        {isDouble && <div className="dice-doubles"><Emoji symbol="🎲" size="1.1em" /> Đôi! Tung lại!</div>}
      </div>
    </div>
  )
}

function BoardCenter() {
  return (
    <div className="board-center" style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}>
      <div className="center-globe"><Emoji symbol="🌍" size="1em" /></div>
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

const BOARD_SIZE = 40
const STEP_MS = 220

export default function Board() {
  const { state, isOnline, myPlayerIndex } = useGame()
  const { players, ownership, phase, dice, diceRolled, currentPlayerIndex } = state

  // Track dice rolls to trigger animation
  const [rollKey, setRollKey] = useState(null)
  const [showAnim, setShowAnim] = useState(false)
  const prevDice = useRef(dice)
  const animTimer = useRef(null)

  // Step-by-step movement animation
  const prevPositionsRef = useRef({})
  const [moveAnim, setMoveAnim] = useState(null) // { player, path, step }
  const moveIntervalRef = useRef(null)

  useEffect(() => {
    if (
      diceRolled &&
      (dice[0] !== prevDice.current[0] || dice[1] !== prevDice.current[1])
    ) {
      clearTimeout(animTimer.current)
      setRollKey(Date.now())
      setShowAnim(true)
      animTimer.current = setTimeout(() => setShowAnim(false), 3000)

      // Animate the active player's token moving step-by-step
      const player = players[currentPlayerIndex]
      const oldPos = prevPositionsRef.current[player?.id]
      const sum = dice[0] + dice[1]
      if (player && oldPos !== undefined && oldPos !== player.position) {
        const path = []
        for (let i = 0; i <= sum; i++) path.push((oldPos + i) % BOARD_SIZE)
        if (path[path.length - 1] === player.position) {
          clearInterval(moveIntervalRef.current)
          let step = 0
          setMoveAnim({ player, path, step: 0 })
          moveIntervalRef.current = setInterval(() => {
            step += 1
            if (step >= path.length) {
              clearInterval(moveIntervalRef.current)
              setMoveAnim(null)
              return
            }
            setMoveAnim({ player, path, step })
          }, STEP_MS)
        }
      }
    }
    prevDice.current = dice
  }, [dice, diceRolled])

  // Keep track of latest positions for the next animation (after this render's effects run)
  useEffect(() => {
    const m = {}
    players.forEach(p => { m[p.id] = p.position })
    prevPositionsRef.current = m
  }, [players])

  useEffect(() => () => clearInterval(moveIntervalRef.current), [])

  // Build position → players map
  const playerMap = {}
  if (phase === 'playing' || phase === 'ended') {
    players.forEach(p => {
      if (!p.bankrupt) {
        if (moveAnim && moveAnim.player.id === p.id) return // hidden while animating
        if (!playerMap[p.position]) playerMap[p.position] = []
        playerMap[p.position].push(p)
      }
    })
  }

  // "Bạn đang ở đây" — vị trí của người chơi hiện tại (online: bạn; solo: người đang đi)
  const myId = isOnline ? myPlayerIndex : currentPlayerIndex
  const myPlayer = players.find(p => p.id === myId)
  const myPosition = (phase === 'playing' && myPlayer && !myPlayer.bankrupt) ? myPlayer.position : null

  const ghostSpaceId = moveAnim ? moveAnim.path[moveAnim.step] : null

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
              isMyPosition={space.id === myPosition}
              ghostPlayer={space.id === ghostSpaceId ? moveAnim.player : null}
              highlight={space.id === ghostSpaceId}
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
