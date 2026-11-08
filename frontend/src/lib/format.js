/* ==========================================================
   Định dạng theo chuẩn Việt Nam (vi-VN)
   - Tiền: 1.284.560.000 ₫ · rút gọn 1,28 tỷ · 48,2 tr
   - Ngày: 08/11/2026 · "8 thg 11" · "Hôm nay"
   ========================================================== */
const nf = new Intl.NumberFormat('vi-VN')
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 })

export const TODAY = new Date(2026, 10, 8, 9, 30) // mốc thời gian cố định của bản demo

export function formatNumber(n) {
  return nf.format(Math.round(n || 0))
}

/** 1284560000 → "1.284.560.000 ₫" */
export function formatVND(n, { sign = false } = {}) {
  const v = Math.round(n || 0)
  const s = nf.format(Math.abs(v)) + ' ₫'
  if (v < 0) return '−' + s
  if (sign && v > 0) return '+' + s
  return s
}

/** Rút gọn: 1,28 tỷ · 48,2 tr · 950 N */
export function formatCompact(n, { unit = true } = {}) {
  const v = Math.abs(n || 0)
  const neg = (n || 0) < 0 ? '−' : ''
  if (v >= 1e9) return neg + nf2.format(v / 1e9) + (unit ? ' tỷ' : '')
  if (v >= 1e6) return neg + nf1.format(v / 1e6) + (unit ? ' tr' : '')
  if (v >= 1e3) return neg + nf.format(Math.round(v / 1e3)) + (unit ? ' N' : '')
  return neg + nf.format(Math.round(v))
}

export function formatPercent(n, digits = 1) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(n) + '%'
}

const pad = (n) => String(n).padStart(2, '0')
export const toDate = (d) => (d instanceof Date ? d : new Date(d))

/** 08/11/2026 */
export function formatDate(d) {
  const x = toDate(d)
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`
}
/** "8 thg 11" (có năm nếu khác năm hiện tại) */
export function formatDay(d, { year = false } = {}) {
  const x = toDate(d)
  const y = year || x.getFullYear() !== TODAY.getFullYear()
  return `${x.getDate()} thg ${x.getMonth() + 1}${y ? ', ' + x.getFullYear() : ''}`
}
export function formatTime(d) {
  const x = toDate(d)
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`
}
export function formatDateTime(d) {
  return `${formatTime(d)} · ${formatDate(d)}`
}
/** "Tháng 11/2026" */
export function formatMonth(d) {
  const x = toDate(d)
  return `Tháng ${x.getMonth() + 1}/${x.getFullYear()}`
}
export const MONTH_SHORT = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12']

export function startOfDay(d) {
  const x = new Date(toDate(d))
  x.setHours(0, 0, 0, 0)
  return x
}
export function daysBetween(a, b) {
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000)
}
export function addDays(d, n) {
  const x = new Date(toDate(d))
  x.setDate(x.getDate() + n)
  return x
}
/** "Hôm nay" · "Hôm qua" · "3 ngày trước" · "8 thg 11" */
export function formatRelative(d) {
  const diff = daysBetween(d, TODAY)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  if (diff > 1 && diff < 7) return `${diff} ngày trước`
  if (diff === -1) return 'Ngày mai'
  if (diff < -1 && diff > -7) return `Còn ${-diff} ngày`
  return formatDay(d)
}

/** Chữ cái đầu cho avatar: "Nguyễn Minh Anh" → "MA" */
export function initials(name = '') {
  // bỏ tiền tố loại hình ("Công ty Cổ phần", "CTCP"…) và hậu tố ("Digital", "Group"…) rồi lấy 2 chữ cuối:
  // "Nguyễn Minh Anh" → MA · "Công ty Cổ phần Sen Việt Digital" → SV · "CTCP Thời Trang Mây" → TM
  const parts = name
    .replace(/^((Công ty|Cty)(\s+(Cổ phần|TNHH|CP))?|CTCP|TNHH|Cửa hàng|Nhà hàng|Nha khoa)\s+/i, '')
    .replace(/\s+(Digital|Group|Studio|Tech|Store|JSC)$/i, '')
    .trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Che số tài khoản: "••2502" */
export const mask = (last4) => `••${last4}`

/** Đọc số tiền thành chữ (dùng trên hoá đơn): 1.250.000 → "Một triệu hai trăm năm mươi nghìn đồng" */
const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
function readTriple(n, full) {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10
  const out = []
  if (full || h) out.push(DIGITS[h] + ' trăm')
  if (t === 0 && u && (full || h)) out.push('linh')
  if (t === 1) out.push('mười')
  else if (t > 1) out.push(DIGITS[t] + ' mươi')
  if (u) {
    if (u === 1 && t > 1) out.push('mốt')
    else if (u === 5 && t > 0) out.push('lăm')
    else if (u === 4 && t > 1) out.push('tư')
    else out.push(DIGITS[u])
  }
  return out.join(' ')
}
export function readVND(n) {
  n = Math.round(Math.abs(n || 0))
  if (n === 0) return 'Không đồng'
  const units = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ']
  const groups = []
  while (n > 0) { groups.push(n % 1000); n = Math.floor(n / 1000) }
  const parts = []
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] === 0) continue
    parts.push(readTriple(groups[i], i < groups.length - 1) + units[i])
  }
  const s = parts.join(' ').replace(/\s+/g, ' ').trim()
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng'
}

/** Bỏ dấu tiếng Việt (nội dung chuyển khoản liên ngân hàng nên viết không dấu) */
export function stripAccents(s = '') {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
}
