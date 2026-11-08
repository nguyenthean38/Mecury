/* ==========================================================
   Hàm tính cho hoá đơn phải trả & người nhận
   ========================================================== */
import { TODAY, daysBetween, formatDate } from '@/lib/format'
import { txName } from '@/data/transactions'
import { sum } from '@/lib/selectors'

export const FORWARD_EMAIL = 'hoadon@senviet.mach.vn'

/** Hạn còn lại (dương = còn ngày, âm = quá hạn) và cờ quá hạn đã tính lại theo hôm nay */
export function billState(b) {
  const days = daysBetween(TODAY, b.due)
  const overdue = b.status === 'overdue' || (['draft', 'review'].includes(b.status) && days < 0)
  return { days, overdue }
}

/** Trạng thái hiển thị: hoá đơn chưa trả mà quá hạn thì coi là "overdue" */
export const displayStatus = (b) => (billState(b).overdue ? 'overdue' : b.status)

/** Dòng chữ hạn thanh toán: "Quá hạn 4 ngày" · "Còn 3 ngày" · "Đã trả 05/11/2026" */
export function dueText(b) {
  if (b.status === 'paid') return { text: b.paidAt ? `Đã trả ${formatDate(b.paidAt)}` : 'Đã trả', tone: 'muted' }
  if (b.status === 'scheduled') return { text: `Trả ngày ${formatDate(b.scheduledFor)}`, tone: 'info' }
  const { days, overdue } = billState(b)
  if (overdue) return { text: days < 0 ? `Quá hạn ${-days} ngày` : 'Quá hạn', tone: 'neg' }
  if (days === 0) return { text: 'Đến hạn hôm nay', tone: 'warn' }
  if (days === 1) return { text: 'Đến hạn ngày mai', tone: 'warn' }
  if (days <= 7) return { text: `Còn ${days} ngày`, tone: 'warn' }
  return { text: `Còn ${days} ngày`, tone: 'muted' }
}

export const BILL_TABS = [
  { value: 'todo', label: 'Cần xử lý', match: (b) => ['draft', 'review', 'overdue'].includes(displayStatus(b)) },
  { value: 'review', label: 'Chờ duyệt', match: (b) => b.status === 'review' && !b.approved },
  { value: 'scheduled', label: 'Đã lên lịch', match: (b) => b.status === 'scheduled' },
  { value: 'paid', label: 'Đã thanh toán', match: (b) => b.status === 'paid' },
  { value: 'all', label: 'Tất cả', match: () => true },
]

/** Tiền trước thuế từ tổng thanh toán đã gồm VAT */
export const preTax = (amount, vat = 0) => Math.round((amount || 0) / (1 + (vat || 0) / 100))

/** Bỏ dấu + viết hoa cho tên chủ tài khoản */
export const toHolder = (name = '') => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toUpperCase().trim()

/** "••8821" từ số tài khoản có dấu cách */
export const maskAccount = (acc = '') => '••' + acc.replace(/\D/g, '').slice(-4)

/** Lịch sử thanh toán + tổng đã trả của người nhận */
export function recipientStats(r, transactions) {
  const name = r.name.toLowerCase()
  const history = transactions.filter((t) => t.amount < 0 && (t.recipient === r.id || (t.method !== 'card' && txName(t).toLowerCase().startsWith(name))))
  const fresh = transactions.filter((t) => t.recipient === r.id && t.amount < 0 && t.status !== 'failed')
  const lastFresh = fresh.reduce((d, t) => (!d || t.date > d ? t.date : d), null)
  const lastPaid = [r.lastPaid, lastFresh].filter(Boolean).sort().pop() || null
  return { history, total: (r.total || 0) + sum(fresh, (t) => -t.amount), lastPaid }
}
