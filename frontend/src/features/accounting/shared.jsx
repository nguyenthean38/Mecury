/* ==========================================================
   Kế toán — hằng số & tiện ích dùng chung giữa các tab
   ========================================================== */
import { useMemo } from 'react'
import { cn } from '@/lib/cn'
import { useBank, useUI } from '@/store'
import { LEDGER_ACCOUNTS } from '@/data/books'
import { txName } from '@/data/transactions'
import { addDays } from '@/lib/format'

/* ---------- Hệ thống tài khoản (bổ sung các TK có trong dữ liệu nhưng chưa khai báo) ---------- */
const EXTRA_ACCOUNTS = [
  { code: '112', name: 'Tiền gửi ngân hàng', type: 'Tài sản', parent: true },
  { code: '211', name: 'Tài sản cố định hữu hình', type: 'Tài sản' },
  { code: '214', name: 'Hao mòn tài sản cố định', type: 'Tài sản', contra: true },
  { code: '341', name: 'Vay và nợ thuê tài chính', type: 'Nợ phải trả' },
]
const byCode = (a, b) => a.code.localeCompare(b.code)
export const ALL_LEDGER = [...EXTRA_ACCOUNTS, ...LEDGER_ACCOUNTS].sort(byCode)
const LEDGER_MAP = Object.fromEntries(ALL_LEDGER.map((a) => [a.code, a]))
export const ledgerName = (code) => LEDGER_MAP[code]?.name || `Tài khoản ${code}`
/** Tài khoản có thể hạch toán (bỏ tài khoản tổng hợp cấp 1 đã có cấp 2) */
export const POSTABLE_LEDGER = ALL_LEDGER.filter((a) => !a.parent)
export const LEDGER_TYPES = ['Tài sản', 'Nợ phải trả', 'Vốn chủ sở hữu', 'Doanh thu', 'Chi phí']

/** Tính chất số dư: TK tài sản & chi phí dư Nợ, còn lại dư Có (TK giảm trừ ngược lại) */
export function balanceSide(acc) {
  const debit = ['Tài sản', 'Chi phí'].includes(acc.type)
  return (acc.contra ? !debit : debit) ? 'Dư Nợ' : 'Dư Có'
}

/* ---------- Kỳ báo cáo ---------- */
export const PERIODS = [
  { value: 'month', label: 'Tháng 11', months: [11], caption: 'Tháng 11/2026 (đến 08/11)' },
  { value: 'quarter', label: 'Quý 4', months: [10, 11], caption: 'Quý 4/2026 (đến 08/11)' },
  { value: 'ytd', label: '7 tháng', months: [5, 6, 7, 8, 9, 10, 11], caption: '01/05 – 08/11/2026' },
]
export const periodOf = (v) => PERIODS.find((p) => p.value === v) || PERIODS[0]

/* ---------- Định dạng số trong báo cáo ---------- */
const nf = new Intl.NumberFormat('vi-VN')
const nf1 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Số kế toán: số âm trong ngoặc. unit: 'dong' | 'tr' */
export function fmtAcc(v, unit = 'dong') {
  const r = Math.round(v || 0)
  if (r === 0) return '–'
  const abs = unit === 'tr' ? nf1.format(Math.abs(r) / 1e6) : nf.format(Math.abs(r))
  return r < 0 ? `(${abs})` : abs
}

/** Ô số trong bảng báo cáo — tự che khi bật "Ẩn số dư" */
export function Num({ value, unit, className, negTone = true }) {
  const hide = useUI((s) => s.hideBalances)
  const neg = Math.round(value || 0) < 0
  return <span className={cn('num whitespace-nowrap', negTone && neg && !hide && 'text-neg', className)}>{hide ? '••••••' : fmtAcc(value, unit)}</span>
}

export const JOURNAL_STATUS = { posted: { label: 'Đã ghi sổ', tone: 'pos' }, draft: { label: 'Nháp', tone: 'neutral' } }

export const sumLines = (lines, k) => lines.reduce((s, l) => s + (l[k] || 0), 0)

/* ---------- Đối soát tháng 11: các dòng sao kê chưa khớp ---------- */
export const RECON_BASE = { matched: 41, total: 48 }
const NO_BOOK = [2, 5] // hai giao dịch chưa có bút toán tương ứng

export function useReconLines() {
  const txs = useBank((s) => s.transactions)
  return useMemo(() => {
    const list = txs
      .filter((t) => {
        const d = new Date(t.date)
        return t.account === 'acc-main' && t.status === 'posted' && t.method !== 'internal' && d.getFullYear() === 2026 && d.getMonth() === 10
      })
      .slice(0, RECON_BASE.total - RECON_BASE.matched)
    return list.map((t, i) => {
      const name = txName(t)
      const inflow = t.amount > 0
      const no = `${inflow ? 'PT' : 'PC'}-11${String(40 + i).padStart(2, '0')}`
      return {
        id: t.id,
        tx: t,
        name,
        date: t.date,
        amount: t.amount,
        book: NO_BOOK.includes(i) ? null : {
          no,
          desc: inflow ? `Thu tiền khách hàng — ${name}` : `Chi ${t.method === 'card' ? 'thẻ' : 'chuyển khoản'} — ${name}`,
          date: addDays(t.date, i % 3 === 0 ? -1 : 0),
          amount: t.amount,
          score: i % 3 === 0 ? 92 : 99,
        },
      }
    })
  }, [txs])
}
