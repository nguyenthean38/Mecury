/* ==========================================================
   Tính số liệu cho trang Phân tích dòng tiền.
   Luôn bỏ giao dịch thất bại và chuyển nội bộ.
   ========================================================== */
import { MERCHANTS, CATEGORIES, txName } from '@/data/transactions'
import { formatCompact, TODAY } from '@/lib/format'
import { sum } from '@/lib/selectors'

export const isCounted = (t) => t.status !== 'failed' && t.category !== 'transfer'
export const monthKeyOf = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}` }
export const isCurrentMonth = (m) => m.year === TODAY.getFullYear() && m.month === TODAY.getMonth() + 1

/** 48200000 → "48,2 triệu" */
export const words = (n) => formatCompact(n).replace(/ tr$/, ' triệu').replace(/ N$/, ' nghìn')

/** Gom giao dịch hợp lệ theo tháng: Map<"2026-9", tx[]> */
export function groupByMonth(transactions) {
  const map = new Map()
  transactions.forEach((t) => {
    if (!isCounted(t)) return
    const k = monthKeyOf(t.date)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(t)
  })
  return map
}

/** Chi theo danh mục (chỉ tiền ra) */
export function spendByCategory(list) {
  const map = new Map()
  list.forEach((t) => {
    if (t.amount >= 0) return
    const k = t.category || 'uncategorized'
    map.set(k, (map.get(k) || 0) + -t.amount)
  })
  return [...map.entries()]
    .map(([key, value]) => ({
      key, value,
      label: CATEGORIES[key]?.label || 'Chưa phân loại',
      color: CATEGORIES[key]?.color || 'var(--c-line-strong)',
    }))
    .sort((a, b) => b.value - a.value)
}

/** Đối tác theo chiều tiền: 'out' (nhà cung cấp) | 'in' (khách hàng) */
export function byCounterparty(list, dir = 'out') {
  const map = new Map()
  list.forEach((t) => {
    if (dir === 'out' ? t.amount >= 0 : t.amount <= 0) return
    const key = t.merchant || txName(t)
    const cur = map.get(key) || { key, label: MERCHANTS[key]?.name || txName(t), color: MERCHANTS[key]?.color || '#6b7280', value: 0, count: 0 }
    cur.value += Math.abs(t.amount)
    cur.count++
    map.set(key, cur)
  })
  return [...map.values()].sort((a, b) => b.value - a.value)
}

/** Chi tiêu thẻ theo thành viên */
export function spendByMember(list) {
  const map = new Map()
  list.forEach((t) => {
    if (!t.member || t.amount >= 0) return
    const cur = map.get(t.member) || { member: t.member, value: 0, count: 0, cats: new Map() }
    cur.value += -t.amount
    cur.count++
    if (t.category) cur.cats.set(t.category, (cur.cats.get(t.category) || 0) + -t.amount)
    map.set(t.member, cur)
  })
  return [...map.values()]
    .map((m) => ({ ...m, topCategory: [...m.cats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Sinh các nhận định cho tháng đang chọn.
 * Trả về mảng { id, tone, icon, parts, action } — parts là chuỗi hoặc { chip, tone, color } / { money } / { strong }.
 */
export function buildInsights({ byMonth, allMonths, selKey, transactions, totalBalance }) {
  const out = []
  const idx = allMonths.findIndex((m) => m.key === selKey)
  const sel = allMonths[idx]
  if (!sel) return out
  const label = `tháng ${sel.month}`
  const cur = byMonth.get(selKey) || []
  const prevKeys = allMonths.slice(Math.max(0, idx - 3), idx).map((m) => m.key).filter((k) => (byMonth.get(k) || []).length)
  const curCats = spendByCategory(cur)
  const totalOut = sum(curCats, (c) => c.value)

  // 1) Danh mục tăng mạnh nhất so với trung bình 3 tháng trước
  if (prevKeys.length) {
    const avgOf = (cat) => sum(prevKeys, (k) => sum((byMonth.get(k) || []).filter((t) => t.amount < 0 && (t.category || 'uncategorized') === cat), (t) => -t.amount)) / prevKeys.length
    const ranked = curCats
      .filter((c) => c.key !== 'uncategorized')
      .map((c) => { const avg = avgOf(c.key); return { ...c, avg, diff: c.value - avg, pct: avg ? ((c.value - avg) / avg) * 100 : null } })
      .filter((c) => c.diff > 0 && c.value > 2e6)
      .sort((a, b) => b.diff - a.diff)
    const top = ranked[0]
    if (top) {
      const merchant = byCounterparty(cur.filter((t) => t.category === top.key), 'out')[0]
      out.push({
        id: 'increase', tone: 'warn', icon: 'TrendingUp',
        parts: [
          'Chi cho ', { chip: top.label, color: top.color },
          top.pct != null ? ' tăng ' : ' mới phát sinh ',
          ...(top.pct != null
            ? [
                { chip: top.pct >= 200 ? `gấp ${(top.value / top.avg).toFixed(1).replace('.', ',')} lần` : `+${Math.round(top.pct)}%`, tone: 'neg' },
                ` so với trung bình ${prevKeys.length} tháng trước (`, { money: top.avg }, ' → ', { money: top.value }, ')',
              ]
            : [{ money: top.value }]),
          merchant ? ', phần lớn trả cho ' : '', merchant ? { strong: merchant.label } : '', '.',
        ],
      })
    } else {
      out.push({ id: 'increase', tone: 'pos', icon: 'TrendingUp', parts: ['Không danh mục nào chi vượt mức trung bình ', `${prevKeys.length} tháng trước — chi tiêu ${label} đang được kiểm soát tốt.`] })
    }
  }

  // 2) Tỷ trọng marketing
  const mk = curCats.find((c) => c.key === 'marketing')
  if (totalOut > 0) {
    const share = ((mk?.value || 0) / totalOut) * 100
    const prevShares = prevKeys.map((k) => {
      const cats = spendByCategory(byMonth.get(k) || [])
      const t = sum(cats, (c) => c.value)
      return t ? ((cats.find((c) => c.key === 'marketing')?.value || 0) / t) * 100 : 0
    })
    const avgShare = prevShares.length ? sum(prevShares) / prevShares.length : null
    out.push(!mk ? {
      id: 'marketing', tone: 'info', icon: 'Megaphone',
      parts: ['Chưa có khoản chi ', { chip: CATEGORIES.marketing.label, color: CATEGORIES.marketing.color }, ` nào trong ${label}`, avgShare ? ` — các tháng trước, hạng mục này chiếm trung bình ${avgShare.toFixed(1).replace('.', ',')}% tổng chi.` : '.'],
    } : {
      id: 'marketing', tone: 'info', icon: 'Megaphone',
      parts: [
        { chip: CATEGORIES.marketing.label, color: CATEGORIES.marketing.color }, ' chiếm ', { chip: `${share.toFixed(1).replace('.', ',')}%`, tone: 'brand' },
        ` tổng chi ${label} (`, { money: mk?.value || 0 }, ')',
        avgShare != null ? `, ${share >= avgShare ? 'cao hơn' : 'thấp hơn'} mức trung bình ${avgShare.toFixed(1).replace('.', ',')}% của các tháng trước.` : '.',
      ],
    })
  }

  // 3) Số tháng hoạt động với số dư hiện tại
  const recent = allMonths.slice(0, -1).slice(-3).map((m) => -m.outflow).filter((v) => v > 0)
  if (recent.length) {
    const burn = sum(recent) / recent.length
    const runway = totalBalance / burn
    out.push({
      id: 'runway', tone: 'pos', icon: 'PiggyBank',
      parts: ['Với mức chi trung bình ', { money: burn, suffix: '/tháng' }, ` trong ${recent.length} tháng gần nhất, số dư hiện tại đủ cho khoảng `, { chip: `${Math.floor(runway)} tháng`, tone: 'pos' }, ' hoạt động.'],
    })
  }

  // 4) Giao dịch chưa phân loại
  const unc = transactions.filter((t) => t.amount < 0 && !t.category && t.status !== 'failed')
  out.push(unc.length
    ? {
        id: 'uncategorized', tone: 'warn', icon: 'Tag',
        parts: ['Có ', { chip: `${unc.length} giao dịch`, tone: 'warn' }, ' chưa phân loại, tổng ', { money: sum(unc, (t) => -t.amount) }, '. Phân loại để báo cáo chi phí chính xác hơn.'],
        action: { label: 'Phân loại ngay', to: '/giao-dich?loc=chua-phan-loai' },
      }
    : { id: 'uncategorized', tone: 'pos', icon: 'Tag', parts: ['Mọi giao dịch đều đã được phân loại — báo cáo chi phí của bạn đã đầy đủ.'] })

  return out
}
