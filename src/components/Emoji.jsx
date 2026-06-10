import React, { useState, useEffect } from 'react'
import twemoji from '@twemoji/api'

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/npm/@twemoji/svg@15.0.0'

// Hiển thị emoji dạng SVG (Twemoji) để đồng nhất trên mọi thiết bị/trình duyệt.
// Một số emoji không có file SVG kèm dấu chọn biến thể (FE0F) riêng, nên nếu
// ảnh lỗi thì thử lại bằng mã không có FE0F.
export default function Emoji({ symbol, size = '1em', className, style }) {
  const codeWithVS = symbol ? twemoji.convert.toCodePoint(symbol) : null
  const codeNoVS   = symbol ? twemoji.convert.toCodePoint(symbol.replace(/️/g, '')) : null
  const [code, setCode] = useState(codeWithVS)

  useEffect(() => { setCode(codeWithVS) }, [codeWithVS])

  if (!symbol) return null
  return (
    <img
      src={`${TWEMOJI_BASE}/${code}.svg`}
      alt={symbol}
      className={className}
      draggable={false}
      style={{ width: size, height: size, verticalAlign: '-0.125em', display: 'inline-block', ...style }}
      onError={() => { if (code !== codeNoVS) setCode(codeNoVS) }}
    />
  )
}
