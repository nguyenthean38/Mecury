/* ==========================================================
   Kế toán — Tổng quan: chỉ số chính, doanh thu/chi phí, việc cần làm
   ========================================================== */
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ChevronRight, FilePen, Scale, Tags, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatPercent, MONTH_SHORT } from '@/lib/format'
import { balanceSeries, sum } from '@/lib/selectors'
import { useBank } from '@/store'
import { CATEGORIES } from '@/data/transactions'
import { Card, CardHeader, Money, Badge, MoreLink, StatusBadge } from '@/components/ui'
import { CashflowChart, Sparkline, BarList } from '@/components/charts'
import { periodOf, JOURNAL_STATUS } from './shared'

const EXPENSE_KEYS = ['payroll', 'rent', 'marketing', 'software', 'contractor', 'office', 'travel', 'meals', 'utilities']

function Delta({ value, inverse }) {
  if (value == null || !isFinite(value)) return null
  const up = value >= 0
  const good = inverse ? !up : up
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return <Badge size="sm" tone={good ? 'pos' : 'neg'} icon={Icon}>{formatPercent(Math.abs(value), 1)}</Badge>
}

function Kpi({ label, value, sub, delta, inverse, spark, color }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] text-muted">{label}</span>
        <Delta value={delta} inverse={inverse} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Money value={value} className={cn('text-[22px] font-[500] tracking-tight', value < 0 && 'text-neg')} />
          {sub && <div className="ds-caption mt-0.5">{sub}</div>}
        </div>
        {spark && <div className="shrink-0 hidden sm:block"><Sparkline values={spark} width={84} height={30} color={color} /></div>}
      </div>
    </Card>
  )
}

export function Overview({ pnl, period, remaining, onTab }) {
  const navigate = useNavigate()
  const accounts = useBank((s) => s.accounts)
  const transactions = useBank((s) => s.transactions)
  const journal = useBank((s) => s.journal)
  const p = periodOf(period)

  const rows = pnl.filter((r) => p.months.includes(r.month))
  const total = (k) => sum(rows, (r) => r[k])
  const cur = pnl[pnl.length - 1]
  const prev = pnl[pnl.length - 2]
  const pct = (k) => (period === 'month' && prev[k] ? ((cur[k] - prev[k]) / Math.abs(prev[k])) * 100 : null)

  const cash = sum(accounts, (a) => a.balance)
  const cashSpark = useMemo(() => balanceSeries(transactions, accounts, 30).map((d) => d.value), [transactions, accounts])
  const revenue = total('revenue') + total('other')
  const opex = total('opex')
  const ebt = total('ebt')
  const margin = revenue ? (ebt / revenue) * 100 : 0
  const isMonth = period === 'month'

  const chart = pnl.map((r) => ({ label: MONTH_SHORT[r.month - 1], tip: `Tháng ${r.month}/2026`, inflow: r.revenue + r.other, outflow: -r.opex, net: r.ebt }))

  const drafts = journal.filter((j) => j.status === 'draft')
  const uncategorized = transactions.filter((t) => !t.category && t.status !== 'failed').length
  const todos = [
    drafts.length > 0 && { key: 'draft', icon: FilePen, tone: 'bg-subtle text-dim', title: `${drafts.length} bút toán nháp chờ ghi sổ`, desc: drafts[0].desc, onClick: () => onTab('but-toan') },
    remaining > 0 && { key: 'recon', icon: Scale, tone: 'bg-warn-soft text-warn', title: `Đối soát tháng 11 còn ${remaining} giao dịch`, desc: 'Tài khoản Thanh toán chính ••2502', onClick: () => onTab('doi-soat') },
    uncategorized > 0 && { key: 'cat', icon: Tags, tone: 'bg-info-soft text-info', title: `${uncategorized} giao dịch chưa phân loại`, desc: 'Chưa phân loại thì chưa hạch toán được vào chi phí.', onClick: () => navigate('/giao-dich?loc=chua-phan-loai') },
    { key: 'vat', icon: CalendarClock, tone: 'bg-gold-soft text-gold', title: 'Nộp tờ khai thuế GTGT quý 4', desc: 'Hạn chót 30/01/2027 · Mạch tự lập tờ khai 01/GTGT từ hoá đơn', onClick: () => onTab('ket-qua') },
  ].filter(Boolean)

  const expenses = EXPENSE_KEYS
    .map((k) => ({ key: k, label: CATEGORIES[k].label, value: total(k), color: CATEGORIES[k].color }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const recent = [...journal].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.no.localeCompare(a.no))).slice(0, 4)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Tiền mặt & tiền gửi" value={cash} sub={`${accounts.length} tài khoản · TK 111, 112`} spark={cashSpark} />
        <Kpi label={isMonth ? 'Doanh thu tháng' : 'Doanh thu'} value={revenue} sub={isMonth ? 'So với tháng 10' : p.caption} delta={pct('revenue')} spark={pnl.map((r) => r.revenue + r.other)} color="var(--c-chart-1)" />
        <Kpi label={isMonth ? 'Chi phí tháng' : 'Chi phí'} value={opex} sub={isMonth ? 'So với tháng 10' : p.caption} delta={pct('opex')} inverse spark={pnl.map((r) => r.opex)} color="var(--c-neg)" />
        <Kpi label="Lợi nhuận trước thuế" value={ebt} sub={`Biên lợi nhuận ${formatPercent(margin, 1)}`} delta={pct('ebt')} spark={pnl.map((r) => r.ebt)} color="var(--c-chart-3)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader title="Doanh thu và chi phí" desc="7 tháng gần nhất · từ bút toán đã ghi sổ, chưa gồm thuế GTGT" />
          <CashflowChart data={chart} height={260} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-400" />Doanh thu</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-neg opacity-70" />Chi phí</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-[1.6px] border-dashed border-fg opacity-70" />Lợi nhuận trước thuế</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cần làm" desc="Giữ sổ sách luôn sạch trước kỳ khoá sổ" />
          <div className="flex flex-col -mx-2">
            {todos.map((t) => (
              <button key={t.key} onClick={t.onClick} className="group flex items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-subtle transition-colors">
                <span className={cn('size-8 shrink-0 grid place-items-center rounded-lg', t.tone)}><t.icon size={16} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-[550] leading-snug">{t.title}</span>
                  <span className="block ds-caption mt-0.5 truncate">{t.desc}</span>
                </span>
                <ChevronRight size={16} className="mt-1.5 text-faint group-hover:text-fg shrink-0" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cơ cấu chi phí" desc={p.caption} action={<button onClick={() => onTab('ket-qua')} className="text-[13px] font-[550] text-brand-ink hover:underline underline-offset-4">Xem báo cáo</button>} />
          <BarList items={expenses} className="-mx-2.5" />
        </Card>
        <Card>
          <CardHeader title="Bút toán gần đây" action={<MoreLink to="/ke-toan?tab=but-toan" />} />
          <div className="flex flex-col">
            {recent.map((j) => (
              <button key={j.id} onClick={() => onTab('but-toan')} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-left hover:bg-subtle -mx-2 px-2 rounded-lg">
                <span className="w-[74px] shrink-0">
                  <span className="block font-mono text-[12px] text-dim">{j.no}</span>
                  <span className="block ds-caption">{formatDate(j.date).slice(0, 5)}</span>
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] truncate">{j.desc}</span>
                <Money value={sum(j.lines, (l) => l.debit || 0)} className="text-[13.5px] font-[550] hidden sm:inline" />
                <StatusBadge map={JOURNAL_STATUS} value={j.status} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
