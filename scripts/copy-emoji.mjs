import fs from 'fs'
import path from 'path'
import twemoji from '@twemoji/api'

const SYMBOLS = [
  '⏭️','⏳','⚠️','✅','🌍','🌐','🎲','🏆','🏠','🏳️','👋','👤','💸','📋','📍','🔌','😔','🚀','🚪','🚫','🛂',
  '🏁','🎉','👀','🏕️','✨','🥇','🥈','🥉','4️⃣','5️⃣','6️⃣',
  // board icons
  '☀️','⛵','⛺','✈️','🌊','🌿','🏔️','🏛️','🏜️','🏟️','🏯','🏰','🏺','💎','💧','📜','🔺','🕌','🕍','🗻','🗿','🛕','🦁','🧭','🪸',
  // player avatars
  '⚡','🌟','🎯','🔥','🛸',
]

const SVG_DIR = path.resolve('node_modules/@twemoji/svg')
const OUT_DIR = path.resolve('public/emoji')

const map = {}
for (const symbol of SYMBOLS) {
  const withVS = twemoji.convert.toCodePoint(symbol)
  const noVS   = twemoji.convert.toCodePoint(symbol.replace(/️/g, ''))
  let code = null
  if (fs.existsSync(path.join(SVG_DIR, `${withVS}.svg`))) code = withVS
  else if (fs.existsSync(path.join(SVG_DIR, `${noVS}.svg`))) code = noVS
  else {
    console.warn('MISSING SVG for', symbol, withVS, noVS)
    continue
  }
  fs.copyFileSync(path.join(SVG_DIR, `${code}.svg`), path.join(OUT_DIR, `${code}.svg`))
  map[symbol] = code
}

fs.writeFileSync(path.resolve('src/data/emojiMap.json'), JSON.stringify(map, null, 2))
console.log(`Copied ${Object.keys(map).length}/${SYMBOLS.length} emoji SVGs`)
