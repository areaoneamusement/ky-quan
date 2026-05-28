export const GROUPS = {
  BROWN:     { name: 'Châu Mỹ La Tinh', color: '#c27b45', count: 2 },
  LIGHT_BLUE:{ name: 'Châu Đại Dương',  color: '#58a6ff', count: 3 },
  PINK:      { name: 'Châu Phi',         color: '#f778ba', count: 3 },
  ORANGE:    { name: 'Đông Nam Á',       color: '#ff8c32', count: 3 },
  RED:       { name: 'Đông Á',           color: '#ff4d4d', count: 3 },
  YELLOW:    { name: 'Nam Á & T.Đông',   color: '#ffd700', count: 3 },
  GREEN:     { name: 'Châu Âu',          color: '#3fb950', count: 3 },
  DARK_BLUE: { name: 'Biểu Tượng T.Giới',color: '#4169e1', count: 2 },
};

// 40 spaces, clockwise from GO (id=0) at bottom-right corner
export const BOARD_SPACES = [
  // --- CORNER: GO (bottom-right) ---
  { id: 0,  type: 'corner',   subtype: 'go',        name: 'KHỞI HÀNH',       icon: '🌍', desc: 'Nhận $200 mỗi vòng' },

  // --- BOTTOM ROW (id 1–9, right→left) ---
  { id: 1,  type: 'property', name: 'Machu Picchu',        country: 'Peru',        icon: '🏔️', group: 'BROWN',      price: 60,  baseRent: 2  },
  { id: 2,  type: 'chest',    name: 'Quỹ Di Sản',                                  icon: '📜', desc: 'Rút thẻ Di Sản' },
  { id: 3,  type: 'property', name: 'Easter Island',        country: 'Chile',       icon: '🗿', group: 'BROWN',      price: 60,  baseRent: 4  },
  { id: 4,  type: 'tax',      name: 'Phí Du Lịch',                                 icon: '💸', amount: 200 },
  { id: 5,  type: 'airport',  name: 'Changi',               country: 'Singapore',   icon: '✈️', price: 200 },
  { id: 6,  type: 'property', name: 'Great Barrier Reef',   country: 'Úc',          icon: '🪸', group: 'LIGHT_BLUE', price: 100, baseRent: 6  },
  { id: 7,  type: 'chance',   name: 'Thám Hiểm',                                   icon: '🧭', desc: 'Rút thẻ Thám Hiểm' },
  { id: 8,  type: 'property', name: 'Uluru',                country: 'Úc',          icon: '🏜️', group: 'LIGHT_BLUE', price: 100, baseRent: 6  },
  { id: 9,  type: 'property', name: 'Fiordland',            country: 'New Zealand', icon: '🏔️', group: 'LIGHT_BLUE', price: 120, baseRent: 8  },

  // --- CORNER: JAIL (bottom-left) ---
  { id: 10, type: 'corner',   subtype: 'jail',      name: 'BIÊN GIỚI',       icon: '🛂', desc: 'Thăm / Bị Giữ Lại' },

  // --- LEFT COLUMN (id 11–19, bottom→top) ---
  { id: 11, type: 'property', name: 'Pyramids of Giza',     country: 'Ai Cập',      icon: '🔺', group: 'PINK',       price: 140, baseRent: 10 },
  { id: 12, type: 'utility',  name: 'Thủy Điện',                                   icon: '💧', price: 150 },
  { id: 13, type: 'property', name: 'Victoria Falls',       country: 'Zimbabwe',    icon: '🌊', group: 'PINK',       price: 140, baseRent: 10 },
  { id: 14, type: 'property', name: 'Serengeti',            country: 'Tanzania',    icon: '🦁', group: 'PINK',       price: 160, baseRent: 12 },
  { id: 15, type: 'airport',  name: 'Heathrow',             country: 'Anh',         icon: '✈️', price: 200 },
  { id: 16, type: 'property', name: 'Vịnh Hạ Long',         country: 'Việt Nam',    icon: '⛵', group: 'ORANGE',     price: 180, baseRent: 14 },
  { id: 17, type: 'chest',    name: 'Quỹ Di Sản',                                  icon: '📜', desc: 'Rút thẻ Di Sản' },
  { id: 18, type: 'property', name: 'Angkor Wat',           country: 'Cambodia',    icon: '🕌', group: 'ORANGE',     price: 180, baseRent: 14 },
  { id: 19, type: 'property', name: 'Borobudur',            country: 'Indonesia',   icon: '🛕', group: 'ORANGE',     price: 200, baseRent: 16 },

  // --- CORNER: FREE PARKING (top-left) ---
  { id: 20, type: 'corner',   subtype: 'parking',   name: 'BASE CAMP',       icon: '⛺', desc: 'Nghỉ Ngơi Miễn Phí' },

  // --- TOP ROW (id 21–29, left→right) ---
  { id: 21, type: 'property', name: 'Vạn Lý Trường Thành', country: 'Trung Quốc',  icon: '🏯', group: 'RED',        price: 220, baseRent: 18 },
  { id: 22, type: 'chance',   name: 'Thám Hiểm',                                   icon: '🧭', desc: 'Rút thẻ Thám Hiểm' },
  { id: 23, type: 'property', name: 'Mount Fuji',           country: 'Nhật Bản',   icon: '🗻', group: 'RED',        price: 220, baseRent: 18 },
  { id: 24, type: 'property', name: 'Tử Cấm Thành',        country: 'Trung Quốc',  icon: '🏛️', group: 'RED',        price: 240, baseRent: 20 },
  { id: 25, type: 'airport',  name: 'Dubai',                country: 'UAE',         icon: '✈️', price: 200 },
  { id: 26, type: 'property', name: 'Taj Mahal',            country: 'Ấn Độ',       icon: '🕍', group: 'YELLOW',     price: 260, baseRent: 22 },
  { id: 27, type: 'property', name: 'Petra',                country: 'Jordan',      icon: '🏺', group: 'YELLOW',     price: 260, baseRent: 22 },
  { id: 28, type: 'utility',  name: 'Năng Lượng Mặt Trời',                         icon: '☀️', price: 150 },
  { id: 29, type: 'property', name: 'Persepolis',           country: 'Iran',        icon: '🏛️', group: 'YELLOW',     price: 280, baseRent: 24 },

  // --- CORNER: GO TO JAIL (top-right) ---
  { id: 30, type: 'corner',   subtype: 'gotojail',  name: 'HỘ CHIẾU BỊ THU', icon: '🚫', desc: 'Đến Ngay Biên Giới!' },

  // --- RIGHT COLUMN (id 31–39, top→bottom) ---
  { id: 31, type: 'property', name: 'Colosseum',            country: 'Ý',           icon: '🏟️', group: 'GREEN',      price: 300, baseRent: 26 },
  { id: 32, type: 'property', name: 'Alhambra',             country: 'Tây Ban Nha', icon: '🏰', group: 'GREEN',      price: 300, baseRent: 26 },
  { id: 33, type: 'chest',    name: 'Quỹ Di Sản',                                  icon: '📜', desc: 'Rút thẻ Di Sản' },
  { id: 34, type: 'property', name: 'Acropolis',            country: 'Hy Lạp',      icon: '🏛️', group: 'GREEN',      price: 320, baseRent: 28 },
  { id: 35, type: 'airport',  name: 'JFK',                  country: 'Mỹ',          icon: '✈️', price: 200 },
  { id: 36, type: 'chance',   name: 'Thám Hiểm',                                   icon: '🧭', desc: 'Rút thẻ Thám Hiểm' },
  { id: 37, type: 'property', name: 'Grand Canyon',         country: 'Mỹ',          icon: '🏜️', group: 'DARK_BLUE',  price: 350, baseRent: 35 },
  { id: 38, type: 'tax',      name: 'Phí Xa Xỉ',                                   icon: '💎', amount: 100 },
  { id: 39, type: 'property', name: 'Amazon Rainforest',    country: 'Brazil',      icon: '🌿', group: 'DARK_BLUE',  price: 400, baseRent: 50 },
];

// CSS Grid position (1-indexed)
export function getGridPos(id) {
  if (id === 0)                    return { row: 11, col: 11 };
  if (id >= 1  && id <= 9)         return { row: 11, col: 11 - id };
  if (id === 10)                   return { row: 11, col: 1  };
  if (id >= 11 && id <= 19)        return { row: 11 - (id - 10), col: 1 };
  if (id === 20)                   return { row: 1,  col: 1  };
  if (id >= 21 && id <= 29)        return { row: 1,  col: id - 19 };
  if (id === 30)                   return { row: 1,  col: 11 };
  if (id >= 31 && id <= 39)        return { row: id - 29, col: 11 };
  return { row: 1, col: 1 };
}

// Which side of the board the space is on
export function getSide(id) {
  if (id >= 1  && id <= 9)  return 'bottom';
  if (id >= 11 && id <= 19) return 'left';
  if (id >= 21 && id <= 29) return 'top';
  if (id >= 31 && id <= 39) return 'right';
  return 'corner';
}
