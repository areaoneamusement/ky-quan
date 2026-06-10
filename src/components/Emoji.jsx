import React, { useState, useEffect } from 'react'
import emojiMap from '../data/emojiMap.json'

// Hiển thị emoji dạng SVG (Twemoji) được đóng gói sẵn trong dự án để đồng nhất
// trên mọi thiết bị/trình duyệt mà không phụ thuộc vào CDN bên ngoài.
// Nếu emoji không có trong bảng ánh xạ (emojiMap), hiển thị emoji gốc dưới
// dạng văn bản để tránh icon vỡ.
export default function Emoji({ symbol, size = '1em', className, style }) {
  const code = symbol ? emojiMap[symbol] : null
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false) }, [symbol])

  if (!symbol) return null

  if (!code || failed) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1, ...style }}>
        {symbol}
      </span>
    )
  }

  return (
    <img
      src={`/emoji/${code}.svg`}
      alt={symbol}
      className={className}
      draggable={false}
      style={{ width: size, height: size, verticalAlign: '-0.125em', display: 'inline-block', ...style }}
      onError={() => setFailed(true)}
    />
  )
}
