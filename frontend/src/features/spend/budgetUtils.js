/* ==========================================================
   Hàm tính cho ngân sách nhóm: kỳ ngân sách, mức dùng,
   chuỗi chi tiêu luỹ kế, chi tiêu theo thành viên.
   ========================================================== */
import { TODAY, addDays, startOfDay, daysBetween, formatDate } from '@/lib/format'
import { sum } from '@/lib/selectors'

export const PERIODS = ['Tháng', 'Quý', 'Năm', 'Trọn đời']
export const PERIOD_LABEL = { Tháng: 'Hằng tháng', Quý: 'Hằng quý', Năm: 'Hằng năm', 'Trọn đời': 'Trọn đời' }

/** Màu nhấn cho ngân sách (dữ liệu, không phải màu bề mặt) */
export const BUDGET_COLORS = ['#138f66', '#4f7fe0', '#c2588a', '#d99a2b', '#7a6fd6', '#59a7b8', '#e07a5f', '#6d8f3a']

/** Danh mục gợi ý theo mẫu ngân sách */
export const TEMPLATE_PRESETS = {
  'Công tác phí': { color: '#59a7b8', categories: ['travel', 'meals'], limit: 60000000 },
  'Tiếp khách': { color: '#d99a2b', categories: ['meals'], limit: 30000000 },
  'Đào tạo': { color: '#7a6fd6', categories: ['office'], limit: 25000000 },
  'Văn phòng': { color: '#6d8f3a', categories: ['office', 'utilities'], limit: 20000000 },
  'Phần mềm': { color: '#4f7fe0', categories: ['software'], limit: 40000000 },
}

/** Khoảng thời gian của kỳ ngân sách hiện tại */
export function periodRange(b) {
  const y = TODAY.getFullYear(), m = TODAY.getMonth()
  if (b.period === 'Tháng') return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0), label: `Tháng ${m + 1}/${y}` }
  if (b.period === 'Quý') {
    const q = Math.floor(m / 3)
    return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 0), label: `Quý ${q + 1}/${y}` }
  }
  if (b.period === 'Năm') return { start: new Date(y, 0, 1), end: new Date(y, 11, 31), label: `Năm ${y}` }
  const s = startOfDay(b.start || b.created || TODAY)
  return { start: s, end: null, label: `Từ ${formatDate(s)}` }
}

/** "Còn 22 ngày" cho kỳ có ngày kết thúc */
export function periodRemaining(b) {
  const { end } = periodRange(b)
  if (!end) return 'Không giới hạn thời gian'
  const d = daysBetween(TODAY, end)
  return d <= 0 ? 'Kỳ kết thúc hôm nay' : `Còn ${d} ngày trong kỳ`
}

export const usagePct = (b) => (b.limit ? Math.round((b.spent / b.limit) * 100) : 0)
export const usageTone = (pct) => (pct >= 90 ? 'neg' : pct >= 75 ? 'warn' : 'brand')

export const budgetCards = (cards, id) => cards.filter((c) => c.budget === id)

/** Giao dịch thẻ thuộc ngân sách (thẻ gắn với ngân sách → giao dịch có tx.card trùng 4 số cuối) */
export function budgetTransactions(transactions, cards, id) {
  const last4s = new Set(budgetCards(cards, id).map((c) => c.last4))
  return transactions.filter((t) => t.card && last4s.has(t.card))
}

/**
 * Chuỗi chi tiêu luỹ kế trong kỳ + chi tiêu theo thành viên.
 * Hình dáng lấy từ giao dịch thật của thẻ, rồi quy về đúng số "đã chi" của ngân sách
 * để biểu đồ và con số tiêu đề luôn khớp nhau.
 */
export function budgetSpend(b, txs) {
  const { start } = periodRange(b)
  const inPeriod = txs.filter((t) => t.amount < 0 && t.status !== 'failed' && new Date(t.date) >= start && new Date(t.date) <= TODAY)
  const raw = sum(inPeriod, (t) => -t.amount)
  const k = raw ? b.spent / raw : 0
  const days = Math.max(1, daysBetween(start, TODAY))
  const byDay = new Map()
  inPeriod.forEach((t) => {
    const d = daysBetween(start, t.date)
    byDay.set(d, (byDay.get(d) || 0) - t.amount)
  })
  let acc = 0
  const series = []
  for (let i = 0; i <= days; i++) {
    acc += raw ? (byDay.get(i) || 0) * k : b.spent / (days + 1)
    series.push({ date: addDays(start, i), value: Math.round(acc) })
  }
  const perMember = {}
  inPeriod.forEach((t) => { if (t.member) perMember[t.member] = (perMember[t.member] || 0) - t.amount * k })
  if (!raw && b.spent) perMember[b.owner] = b.spent
  return { series, perMember, txs: inPeriod }
}

/** 4 số cuối ngẫu nhiên cho thẻ ảo mới */
export const randomLast4 = () => String(Math.floor(1000 + Math.random() * 9000))
