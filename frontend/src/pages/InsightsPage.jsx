import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileSpreadsheet, FileText, Send, Lightbulb, PieChart } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMonth, formatPercent, formatCompact, TODAY } from '@/lib/format'
import { cashflowByMonth, sum, totalBalance } from '@/lib/selectors'
import { useBank, toast } from '@/store'
import {
  PageHeader, Button, Card, CardHeader, Segmented, Select, Money, Popover, Menu, Avatar, EmptyState, Table, THead, Th, Tr, Td, CategoryTag, Progress,
} from '@/components/ui'
import { CashflowChart, Donut, BarList } from '@/components/charts'
import { groupByMonth, spendByCategory, byCounterparty, spendByMember, buildInsights, isCurrentMonth } from '@/features/insights/compute'
import { InsightList, Delta } from '@/features/insights/InsightParts'

const RANGES = [{ value: 3, label: '3 tháng' }, { value: 6, label: '6 tháng' }, { value: 7, label: '7 tháng' }]
const FLOWS = [{ value: 'all', label: 'Tất cả' }, { value: 'in', label: 'Tiền vào' }, { value: 'out', label: 'Tiền ra' }]

const monthName = (m) => formatMonth(new Date(m.year, m.month - 1, 1)) + (isCurrentMonth(m) ? ` (đến ${TODAY.getDate()}/${TODAY.getMonth() + 1})` : '')
const compactVND = (v) => formatCompact(v) + ' ₫'

function SummaryStat({ label, value, prev, goodWhenUp, tone }) {
  return (
    <div className="min-w-0 px-5 py-4 sm:py-5 border-b sm:border-b-0 sm:border-r border-line last:border-0">
      <div className="text-[13px] text-muted">{label}</div>
      <Money value={value} sign={tone === 'net'} className={cn('block mt-1 text-[24px] font-[500] tracking-tight', tone === 'net' && value < 0 && 'text-neg')} />
      <div className="mt-1.5"><Delta cur={value} prev={prev} goodWhenUp={goodWhenUp} /></div>
    </div>
  )
}

function CategoryBreakdown({ cats, month }) {
  const [active, setActive] = useState(null)
  const total = sum(cats, (c) => c.value)
  const act = cats.find((c) => c.key === active)
  return (
    <Card className="h-full">
      <CardHeader icon={PieChart} title="Chi tiêu theo danh mục" desc={monthName(month)} />
      {cats.length === 0 ? <EmptyState compact title="Không có khoản chi nào" desc="Tháng này chưa phát sinh chi tiêu." /> : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Donut segments={cats} size={172} active={active} onHover={setActive}>
            <div className="px-6">
              <div className="ds-caption truncate max-w-[110px]">{act ? act.label : 'Tổng chi'}</div>
              <Money value={act ? act.value : total} className="block text-[17px] font-[600] mt-0.5" />
              {act && <div className="ds-caption num">{formatPercent((act.value / total) * 100)}</div>}
            </div>
          </Donut>
          <ul className="flex-1 w-full min-w-0 flex flex-col">
            {cats.slice(0, 8).map((c) => (
              <li key={c.key} onMouseEnter={() => setActive(c.key)} onMouseLeave={() => setActive(null)}
                className={cn('flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] transition-colors', active === c.key && 'bg-subtle')}>
                <span className="size-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="truncate text-dim flex-1">{c.label}</span>
                <span className="num text-muted w-11 text-right">{Math.round((c.value / total) * 100)}%</span>
                <Money value={c.value} className="font-[550] w-[112px] text-right" />
              </li>
            ))}
            {cats.length > 8 && <li className="ds-caption px-2 pt-1">+{cats.length - 8} danh mục khác</li>}
          </ul>
        </div>
      )}
    </Card>
  )
}

function PartyList({ title, desc, items, empty }) {
  return (
    <Card padded={false} className="p-5 pb-3">
      <CardHeader title={title} desc={desc} className="mb-2" />
      {items.length === 0 ? <EmptyState compact title={empty} /> : (
        <BarList format={compactVND} className="-mx-2.5"
          items={items.slice(0, 6).map((it) => ({ ...it, icon: <Avatar name={it.label} color={it.color} size={22} /> }))} />
      )}
    </Card>
  )
}

function MemberTable({ rows, prevRows, team, month }) {
  const total = sum(rows, (r) => r.value)
  return (
    <Card padded={false}>
      <div className="px-5 pt-5 pb-3">
        <h3 className="ds-h3">Chi tiêu theo thành viên</h3>
        <p className="ds-caption mt-0.5">Giao dịch thẻ · {monthName(month)}</p>
      </div>
      {rows.length === 0 ? <EmptyState compact title="Chưa có giao dịch thẻ" desc="Chi tiêu thẻ của thành viên sẽ hiện ở đây." /> : (
        <Table minWidth={680}>
          <THead>
            <Th>Thành viên</Th>
            <Th>Danh mục chính</Th>
            <Th align="right">Số giao dịch</Th>
            <Th align="right">So với tháng trước</Th>
            <Th align="right" width={220}>Tổng chi</Th>
          </THead>
          <tbody>
            {rows.map((r) => {
              const m = team.find((x) => x.id === r.member)
              const prev = prevRows.find((p) => p.member === r.member)?.value || 0
              const pct = prev ? ((r.value - prev) / prev) * 100 : null
              return (
                <Tr key={r.member}>
                  <Td>
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={m?.name || '?'} color={m?.color} size={30} />
                      <span className="min-w-0">
                        <span className="block font-[550] truncate">{m?.name || 'Thành viên'}</span>
                        <span className="block ds-caption truncate">{m?.title}</span>
                      </span>
                    </span>
                  </Td>
                  <Td><CategoryTag id={r.topCategory} /></Td>
                  <Td align="right" className="num text-dim">{r.count}</Td>
                  <Td align="right">
                    {pct == null ? <span className="ds-caption">—</span> : (
                      <span className={cn('num text-[13px] font-[550]', pct > 0 ? 'text-neg' : 'text-pos')}>{pct > 0 ? '+' : '−'}{formatPercent(Math.abs(pct), 0)}</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex flex-col items-end gap-1.5">
                      <Money value={r.value} className="font-[550]" />
                      <Progress value={r.value} max={total} auto={false} height={4} className="w-32" />
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </Card>
  )
}

export default function InsightsPage() {
  const transactions = useBank((s) => s.transactions)
  const accounts = useBank((s) => s.accounts)
  const team = useBank((s) => s.team)
  const [range, setRange] = useState(3)
  const [flow, setFlow] = useState('all')
  const [selKey, setSelKey] = useState(null)

  const byMonth = useMemo(() => groupByMonth(transactions), [transactions])
  const allMonths = useMemo(() => cashflowByMonth(transactions, 12), [transactions])
  const months = allMonths.slice(-range)
  const prevMonths = allMonths.slice(-range * 2, -range)

  // mặc định chọn tháng trọn vẹn gần nhất
  const selIdx = Math.max(0, months.findIndex((m) => m.key === selKey) >= 0 ? months.findIndex((m) => m.key === selKey) : months.length - 2)
  const sel = months[selIdx]
  const selAllIdx = allMonths.findIndex((m) => m.key === sel.key)
  const prevMonth = allMonths[selAllIdx - 1]

  // chỉ so sánh khi kỳ trước có đủ dữ liệu từng tháng
  const prevOk = prevMonths.length === range && prevMonths.every((m) => m.inflow || m.outflow)
  const totals = {
    inflow: sum(months, (m) => m.inflow), outflow: -sum(months, (m) => m.outflow),
    pIn: prevOk ? sum(prevMonths, (m) => m.inflow) : 0, pOut: prevOk ? -sum(prevMonths, (m) => m.outflow) : 0,
  }
  const chartData = months.map((m) => {
    const tip = monthName(m)
    if (flow === 'in') return { ...m, tip, outflow: 0, net: m.inflow }
    if (flow === 'out') return { ...m, tip, inflow: 0, net: m.outflow }
    return { ...m, tip }
  })

  const selTx = byMonth.get(sel.key) || []
  const cats = useMemo(() => spendByCategory(selTx), [selTx])
  const suppliers = useMemo(() => byCounterparty(selTx, 'out'), [selTx])
  const customers = useMemo(() => byCounterparty(selTx, 'in'), [selTx])
  const members = useMemo(() => spendByMember(selTx), [selTx])
  const prevMembers = useMemo(() => spendByMember((prevMonth && byMonth.get(prevMonth.key)) || []), [prevMonth, byMonth])
  const insights = useMemo(
    () => buildInsights({ byMonth, allMonths, selKey: sel.key, transactions, totalBalance: totalBalance(accounts) }),
    [byMonth, allMonths, sel.key, transactions, accounts],
  )

  const exportAs = (fmt) => toast({ title: `Đang xuất báo cáo ${fmt}`, desc: `bao-cao-dong-tien-${range}-thang.${fmt === 'Excel' ? 'xlsx' : 'pdf'} sẽ tải xuống trong giây lát.` })

  return (
    <div>
      <PageHeader title="Phân tích dòng tiền" desc="Tiền vào, tiền ra và những thay đổi đáng chú ý — tính từ mọi tài khoản, không gồm chuyển nội bộ."
        actions={
          <Popover align="end" width={240} trigger={(p) => <Button {...p} variant="outline" icon={Download}>Xuất báo cáo</Button>}>
            {(close) => <Menu onClose={close} items={[
              { label: 'Excel (.xlsx)', icon: FileSpreadsheet, onClick: () => exportAs('Excel') },
              { label: 'PDF', icon: FileText, onClick: () => exportAs('PDF') },
              { divider: true },
              { label: 'Gửi cho kế toán', desc: 'bao.tran@senviet.vn', icon: Send, onClick: () => toast({ title: 'Đã gửi báo cáo', desc: 'Trần Quốc Bảo sẽ nhận email trong vài phút.', tone: 'pos' }) },
            ]} />}
          </Popover>
        } />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Segmented value={range} onChange={setRange} options={RANGES} />
        <Segmented value={flow} onChange={setFlow} options={FLOWS} />
      </div>

      <Card padded={false} className="grid sm:grid-cols-3 mb-5">
        <SummaryStat label="Dòng tiền ròng" tone="net" value={totals.inflow - totals.outflow} prev={prevOk ? totals.pIn - totals.pOut : 0} goodWhenUp />
        <SummaryStat label="Tiền vào" value={totals.inflow} prev={totals.pIn} goodWhenUp />
        <SummaryStat label="Tiền ra" value={totals.outflow} prev={totals.pOut} goodWhenUp={false} />
      </Card>

      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="ds-h3">Dòng tiền theo tháng</h3>
            <p className="ds-caption mt-0.5">Bấm vào một tháng để xem chi tiết bên dưới.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-[12.5px] text-muted">
              {flow !== 'out' && <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand-400" />Tiền vào</span>}
              {flow !== 'in' && <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-neg opacity-70" />Tiền ra</span>}
              {flow === 'all' && <span className="inline-flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed border-fg opacity-70" />Ròng</span>}
            </div>
            <Select size="sm" aria-label="Chọn tháng" value={sel.key} onChange={(e) => setSelKey(e.target.value)}
              options={months.map((m) => ({ value: m.key, label: monthName(m) }))} className="w-[200px]" />
          </div>
        </div>
        <CashflowChart data={chartData} height={280} active={selIdx} onSelect={(i) => setSelKey(months[i].key)} showNet={flow === 'all'} />
      </Card>

      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5 mb-5">
        <Card>
          <CardHeader icon={Lightbulb} title="Nhận định" desc={monthName(sel)} />
          <InsightList items={insights} />
        </Card>
        {flow === 'in'
          ? <PartyList title="Khách hàng trả nhiều nhất" desc={monthName(sel)} items={customers} empty="Chưa có tiền vào trong tháng" />
          : <CategoryBreakdown cats={cats} month={sel} />}
      </div>

      {flow === 'all' && (
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <PartyList title="Chi nhiều nhất cho" desc={`Nhà cung cấp & đối tác · ${monthName(sel)}`} items={suppliers} empty="Chưa có khoản chi" />
          <PartyList title="Khách hàng trả nhiều nhất" desc={monthName(sel)} items={customers} empty="Chưa có tiền vào trong tháng" />
        </div>
      )}
      {flow === 'out' && (
        <div className="mb-5">
          <PartyList title="Chi nhiều nhất cho" desc={`Nhà cung cấp & đối tác · ${monthName(sel)}`} items={suppliers} empty="Chưa có khoản chi" />
        </div>
      )}

      {flow !== 'in' && <MemberTable rows={members} prevRows={prevMembers} team={team} month={sel} />}

      <p className="ds-caption mt-6 text-center">
        Số liệu cập nhật lúc 09:30 · {TODAY.getDate()}/{TODAY.getMonth() + 1}/{TODAY.getFullYear()}. Xem từng giao dịch trong <Link to="/giao-dich" className="text-brand-ink hover:underline underline-offset-4">Giao dịch</Link>.
      </p>
    </div>
  )
}
