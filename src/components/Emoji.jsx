import React, { useState, useEffect } from 'react'
import twemoji from '@twemoji/api'

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/npm/@twemoji/svg@15.0.0'

// Hiển thị emoji dạng SVG (Twemoji) để đồng nhất trên mọi thiết bị/trình duyệt.
// Một số emoji không có file SVG kèm dấu chọn biến thể (FE0F) riêng, nên nếu
// ảnh lỗi thì thử lại bằng mã không có FE0F. Nếu cả hai đều lỗi (ví dụ CDN
// chặn), hiển thị emoji gốc dưới dạng văn bản để tránh icon vỡ.
export default function Emoji({ symbol, size = '1em', className, style }) {
  const codes = symbol
    ? [...new Set([
        twemoji.convert.toCodePoint(symbol),
        twemoji.convert.toCodePoint(symbol.replace(/️/g, '')),
      ])]
    : []
  const [stage, setStage] = useState(0)

  useEffect(() => { setStage(0) }, [symbol])

  if (!symbol) return null

  if (stage >= codes.length) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {symbol}
      </span>
    )
  }

  return (
    <img
      src={`${TWEMOJI_BASE}/${codes[stage]}.svg`}
      alt={symbol}
      className={className}
      draggable={false}
      style={{ width: size, height: size, verticalAlign: '-0.125em', display: 'inline-block', ...style }}
      onError={() => setStage(s => s + 1)}
    />
  )
}
