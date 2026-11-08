/* ==========================================================
   Hàm dùng chung cho mô-đun Hoá đơn bán ra
   ========================================================== */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TODAY, addDays, daysBetween, startOfDay } from '@/lib/format'
import { invoiceTotals } from '@/data/invoicing'

/** Ngày dạng yyyy-mm-dd theo giờ địa phương (an toàn cho <input type="date">) */
export function isoDate(d) {
  const x = d instanceof Date ? d : new Date(d)
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
}
export const TODAY_ISO = isoDate(TODAY)
/** "2026-11-08" → Date theo giờ địa phương */
export function fromISO(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** Trạng thái còn phải thu (đã phát hành, chưa thu đủ) */
export const OPEN_STATUSES = ['sent', 'viewed', 'partial', 'overdue']

export function isOverdue(inv) {
  if (!OPEN_STATUSES.includes(inv.status)) return false
  return inv.status === 'overdue' || daysBetween(inv.due, TODAY) > 0
}

/** Trạng thái hiển thị: hoá đơn đã gửi / đã xem mà qua hạn thì coi là quá hạn */
export function displayStatus(inv) {
  if ((inv.status === 'sent' || inv.status === 'viewed') && isOverdue(inv)) return 'overdue'
  return inv.status
}

/** Danh sách các lần thanh toán (dữ liệu mẫu chỉ có `paid`, dữ liệu mới có `payments`) */
export function paymentsOf(inv) {
  if (inv.payments?.length) return inv.payments
  if (inv.paid) return [{ amount: inv.paid, date: inv.paidAt || inv.viewedAt || inv.issued, account: 'acc-main' }]
  return []
}

/** Số hoá đơn tiếp theo: SV-2026-0151… */
export function nextInvoiceNumber(invoices) {
  const year = TODAY.getFullYear()
  const max = invoices.reduce((m, i) => {
    const n = Number(String(i.number).split('-').pop())
    return Number.isFinite(n) ? Math.max(m, n) : m
  }, 0)
  return `SV-${year}-${String(max + 1).padStart(4, '0')}`
}

/** Tổng hợp số liệu phải thu */
export function receivableStats(invoices) {
  const open = invoices.filter((i) => OPEN_STATUSES.includes(i.status))
  const overdue = open.filter(isOverdue)
  const from = startOfDay(addDays(TODAY, -30))
  let collected = 0, collectedCount = 0
  invoices.forEach((i) => {
    if (i.status === 'void') return
    const ps = paymentsOf(i).filter((p) => new Date(p.date) >= from)
    if (ps.length) collectedCount++
    collected += ps.reduce((s, p) => s + p.amount, 0)
  })
  const sumDue = (arr) => arr.reduce((s, i) => s + invoiceTotals(i).due, 0)
  return {
    openTotal: sumDue(open), openCount: open.length,
    overdueTotal: sumDue(overdue), overdueCount: overdue.length,
    collected, collectedCount,
  }
}

/** Nhật ký hoạt động của một hoá đơn, mới nhất ở cuối */
export function invoiceActivity(inv) {
  const ev = [{ key: 'created', label: 'Đã tạo hoá đơn', date: inv.createdAt || inv.issued, tone: 'neutral' }]
  if (inv.status === 'scheduled') ev.push({ key: 'scheduled', label: 'Hẹn gửi tự động', date: inv.scheduledFor || inv.issued, tone: 'info', future: true })
  if (!['draft', 'scheduled'].includes(inv.status)) ev.push({ key: 'sent', label: `Đã gửi đến ${inv.sentTo || 'khách hàng'}`, date: inv.sentAt || inv.issued, tone: 'info' })
  if (inv.viewedAt) ev.push({ key: 'viewed', label: 'Khách đã xem hoá đơn', date: inv.viewedAt, tone: 'info' })
  ;(inv.reminders || []).forEach((d, i) => ev.push({ key: 'rem' + i, label: 'Đã gửi nhắc thanh toán', date: d, tone: 'warn' }))
  paymentsOf(inv).forEach((p, i) => ev.push({ key: 'pay' + i, label: 'Nhận thanh toán', amount: p.amount, date: p.date, tone: 'pos' }))
  if (inv.status === 'paid') ev.push({ key: 'paid', label: 'Đã thanh toán đủ', date: inv.paidAt || paymentsOf(inv).at(-1)?.date || inv.due, tone: 'pos' })
  if (inv.status === 'void') ev.push({ key: 'void', label: 'Đã huỷ hoá đơn', date: inv.voidedAt || TODAY, tone: 'neg' })
  return ev.sort((a, b) => new Date(a.date) - new Date(b.date))
}

export const payLink = (inv) => `https://pay.mach.vn/senviet/${String(inv.number).toLowerCase()}`

/** Nội dung chuyển khoản gợi ý cho khách: "SV20260148" */
export const transferMemo = (inv) => String(inv.number).replace(/-/g, '')

export const VAT_RATES = [0, 5, 8, 10]
export const UNITS = ['Gói', 'Tháng', 'Giờ', 'Năm', 'Lần', 'Bộ', 'Cái', 'Trang']

export const PAY_METHODS = {
  transfer: 'Chuyển khoản',
  vietqr: 'VietQR',
  card: 'Thẻ',
}

/* ---------- Mẫu hoá đơn (lưu trên trình duyệt) ---------- */
export const ACCENTS = ['#138f66', '#0b5f45', '#2f6bd8', '#7a6fd6', '#c2588a', '#d99a2b', '#15181a']

export const useInvoiceTemplate = create(
  persist(
    (set) => ({
      logo: null, // { name, src }
      accent: '#138f66',
      footer: 'Cảm ơn quý khách đã tin tưởng Sen Việt Digital. Mọi thắc mắc về hoá đơn xin liên hệ ketoan@senviet.vn.',
      showBank: true,
      showQr: true,
      save: (patch) => set(patch),
    }),
    { name: 'mach-invoice-template' },
  ),
)
