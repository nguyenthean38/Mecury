/* ==========================================================
   Hàm tính số liệu từ dữ liệu mô phỏng (dùng chung cho nhiều trang)
   ========================================================== */
import { TODAY, addDays, startOfDay, MONTH_SHORT } from './format'
import { txName } from '@/data/transactions'

export const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0)
export const totalBalance = (accounts) => sum(accounts, (a) => a.balance)

/** Chuỗi số dư theo ngày, lùi từ số dư hiện tại. accountIds = null → tất cả tài khoản */
export function balanceSeries(transactions, accounts, days = 30, accountIds = null) {
  const ids = accountIds || accounts.map((a) => a.id)
  let bal = sum(accounts.filter((a) => ids.includes(a.id)), (a) => a.balance)
  const byDay = new Map()
  transactions.forEach((t) => {
    if (t.status !== 'posted' || !ids.includes(t.account)) return
    const k = startOfDay(t.date).getTime()
    byDay.set(k, (byDay.get(k) || 0) + t.amount)
  })
  const out = []
  for (let i = 0; i <= days; i++) {
    const d = startOfDay(addDays(TODAY, -i))
    out.push({ date: d, value: bal })
    bal -= byDay.get(d.getTime()) || 0
  }
  return out.reverse()
}

/** Tiền vào / tiền ra trong khoảng ngày (bỏ chuyển nội bộ) */
export function flowIn(transactions, days = 30, accountIds = null) {
  const from = startOfDay(addDays(TODAY, -days))
  let inflow = 0, outflow = 0
  transactions.forEach((t) => {
    if (t.status === 'failed' || t.category === 'transfer') return
    if (accountIds && !accountIds.includes(t.account)) return
    if (new Date(t.date) < from) return
    if (t.amount > 0) inflow += t.amount
    else outflow += t.amount
  })
  return { inflow, outflow, net: inflow + outflow }
}

/** Dòng tiền theo tháng: [{ key, label, inflow, outflow, net }] */
export function cashflowByMonth(transactions, months = 7) {
  const res = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1)
    res.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()], month: d.getMonth() + 1, year: d.getFullYear(), inflow: 0, outflow: 0, net: 0 })
  }
  const idx = new Map(res.map((r, i) => [r.key, i]))
  transactions.forEach((t) => {
    if (t.status === 'failed' || t.category === 'transfer') return
    const d = new Date(t.date)
    const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`)
    if (i === undefined) return
    if (t.amount > 0) res[i].inflow += t.amount
    else res[i].outflow += t.amount
  })
  res.forEach((r) => (r.net = r.inflow + r.outflow))
  return res
}

/** Chi tiêu theo danh mục / đối tác trong khoảng ngày */
export function groupSpend(transactions, { days = 30, by = 'category', direction = 'out' } = {}) {
  const from = startOfDay(addDays(TODAY, -days))
  const map = new Map()
  transactions.forEach((t) => {
    if (t.status === 'failed' || t.category === 'transfer') return
    if (new Date(t.date) < from) return
    if (direction === 'out' && t.amount >= 0) return
    if (direction === 'in' && t.amount <= 0) return
    const k = (by === 'category' ? t.category : t.merchant || t.counterparty) || 'uncategorized'
    map.set(k, (map.get(k) || 0) + Math.abs(t.amount))
  })
  return [...map.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value)
}

/** Lọc giao dịch theo bộ lọc của trang Giao dịch */
export function filterTransactions(list, f = {}) {
  const q = (f.q || '').trim().toLowerCase()
  const from = f.from ? startOfDay(f.from) : null
  const to = f.to ? addDays(startOfDay(f.to), 1) : null
  return list.filter((t) => {
    if (f.account?.length && !f.account.includes(t.account)) return false
    if (f.category?.length && !f.category.includes(t.category || 'uncategorized')) return false
    if (f.method?.length && !f.method.includes(t.method)) return false
    if (f.status?.length && !f.status.includes(t.status)) return false
    if (f.member?.length && !f.member.includes(t.member)) return false
    if (f.direction === 'in' && t.amount <= 0) return false
    if (f.direction === 'out' && t.amount >= 0) return false
    if (f.receipt === 'missing' && (t.receipt || t.amount > 0 || t.category === 'transfer')) return false
    if (f.receipt === 'attached' && !t.receipt) return false
    if (f.min != null && f.min !== '' && Math.abs(t.amount) < Number(f.min)) return false
    if (f.max != null && f.max !== '' && Math.abs(t.amount) > Number(f.max)) return false
    const d = new Date(t.date)
    if (from && d < from) return false
    if (to && d >= to) return false
    if (q) {
      const hay = `${txName(t)} ${t.note || ''} ${t.ref || ''} ${Math.abs(t.amount)}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
