/* ==========================================================
   Tổng quan — màn hình chính sau khi đăng nhập
   ========================================================== */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, ArrowLeftRight, Plus, Download, Upload, FilePlus2, ShieldCheck, ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight,
  MoreHorizontal, X, CreditCard, Sparkles, ListChecks, SlidersHorizontal, LineChart, Table2,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY, formatCompact, formatDay, formatRelative } from '@/lib/format'
import { balanceSeries, flowIn, sum } from '@/lib/selectors'
import { useBank, useUI, toast } from '@/store'
import { ME } from '@/data/org'
import { MERCHANTS, txName } from '@/data/transactions'
import { invoiceTotals } from '@/data/invoicing'
import {
  Button, Card, CardHeader, IconButton, Money, Segmented, Tabs, AccountIcon, Badge, MoreLink, Progress, Popover, Menu, Avatar, Tooltip, Checkbox,
} from '@/components/ui'
import { AreaChart, BarList } from '@/components/charts'
import { TxList } from '@/features/transactions/TxList'
import { TxDrawer } from '@/features/transactions/TxDrawer'

const greet = () => {
  const h = TODAY.getHours()
  return h < 11 ? 'Chào buổi sáng' : h < 14 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
}

const ACTIONS = [
  { id: 'send', label: 'Chuyển tiền', icon: Send },
  { id: 'transfer', label: 'Chuyển nội bộ', icon: ArrowLeftRight },
  { id: 'deposit', label: 'Nhận tiền', icon: Download },
  { id: 'request', label: 'Yêu cầu thanh toán', icon: ArrowDownLeft },
  { id: 'bill', label: 'Tải hoá đơn', icon: Upload },
  { id: 'invoice', label: 'Tạo hoá đơn', icon: FilePlus2 },
]

/* ---------- Số dư + biểu đồ ---------- */
function BalanceCard() {
  const accounts = useBank((s) => s.accounts)
  const transactions = useBank((s) => s.transactions)
  const [range, setRange] = useState(30)
  const [view, setView] = useState('chart')
  const series = useMemo(() => balanceSeries(transactions, accounts, range), [transactions, accounts, range])
  const flow = useMemo(() => flowIn(transactions, range), [transactions, range])
  const total = sum(accounts, (a) => a.balance)
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[13.5px] text-muted">
            Tổng số dư
            <Tooltip content="Đồng bộ từ 4 tài khoản ngân hàng đã kết nối · cập nhật 09:25"><ShieldCheck size={15} className="text-brand-ink" /></Tooltip>
          </div>
          <div className="ds-amount mt-1"><Money value={total} /></div>
        </div>
        <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'chart', icon: LineChart, label: '', title: 'Biểu đồ' }, { value: 'table', icon: Table2, label: '', title: 'Bảng' }]} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
        <Popover trigger={(p) => (
          <button {...p} className="inline-flex items-center gap-1 text-[13px] font-[550] text-dim hover:text-fg">
            {range} ngày qua <ChevronRight size={14} className="rotate-90" />
          </button>
        )}>
          {(close) => <Menu onClose={close} items={[30, 90, 180].map((d) => ({ label: `${d} ngày qua`, checked: d === range, onClick: () => setRange(d) }))} />}
        </Popover>
        <div className="flex items-center gap-3 text-[13px]">
          <span className="inline-flex items-center gap-1" title="Tiền vào"><ArrowDownLeft size={14} className="text-pos" /><Money value={flow.inflow} className="text-dim" /></span>
          <span className="inline-flex items-center gap-1" title="Tiền ra"><ArrowUpRight size={14} className="text-neg" /><Money value={flow.outflow} className="text-dim" /></span>
        </div>
      </div>
      {view === 'chart' ? (
        <AreaChart data={series} height={190} className="mt-4 -mx-1" />
      ) : (
        <div className="mt-4 flex flex-col">
          {series.filter((_, i, a) => i % Math.ceil(a.length / 6) === 0 || i === a.length - 1).reverse().map((p) => (
            <div key={p.date.toISOString()} className="flex items-center justify-between py-2 border-b border-line last:border-0 text-[13.5px]">
              <span className="text-muted">{formatDay(p.date)}</span><Money value={p.value} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------- Danh sách tài khoản ---------- */
function AccountsCard() {
  const navigate = useNavigate()
  const accounts = useBank((s) => s.accounts)
  const credit = useBank((s) => s.credit)
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  return (
    <Card className="flex flex-col">
      <CardHeader title="Tài khoản" action={<>
        <IconButton icon={Plus} label="Nhận tiền" size="sm" variant="secondary" onClick={() => openMoveMoney('deposit')} />
        <Popover align="end" trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thêm" size="sm" />}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Chuyển giữa các tài khoản', icon: ArrowLeftRight, onClick: () => openMoveMoney('transfer') },
            { label: 'Quy tắc tự động', icon: SlidersHorizontal, onClick: () => navigate('/tai-khoan') },
          ]} />}
        </Popover>
      </>} />
      <div className="flex flex-col -mx-2">
        {accounts.map((a) => (
          <button key={a.id} onClick={() => navigate('/tai-khoan/' + a.id)} className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-subtle">
            <AccountIcon kind={a.kind} color={a.color} size={32} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-[520] truncate">{a.name} <span className="text-faint font-normal">••{a.last4}</span></span>
              {a.apy && <span className="block text-[12px] text-pos">Lãi suất {String(a.apy).replace('.', ',')}%/năm</span>}
            </span>
            <Money value={a.balance} className="text-[14px] font-[550]" />
          </button>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-line">
        <button onClick={() => navigate('/tai-khoan')} className="w-full flex items-center gap-3 py-1 text-left">
          <AccountIcon kind="credit" color="#6b7280" size={32} />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-[520]">Thẻ tín dụng doanh nghiệp</span>
            <Progress value={credit.balance} max={credit.limit} height={4} className="mt-1.5 max-w-[180px]" />
          </span>
          <span className="text-right">
            <Money value={credit.balance} className="block text-[14px] font-[550]" />
            <span className="ds-caption">hạn mức {formatCompact(credit.limit)}</span>
          </span>
        </button>
      </div>
    </Card>
  )
}

/* ---------- Thanh toán & Hoá đơn ---------- */
function MiniStat({ label, value, sub, tone }) {
  return (
    <div className="min-w-0">
      <div className="text-[12.5px] text-muted">{label}</div>
      <div className={cn('mt-0.5 text-[15.5px] font-[550] num truncate', tone === 'neg' && 'text-neg')}>{value}</div>
      {sub && <div className="ds-caption">{sub}</div>}
    </div>
  )
}

function PayablesCard() {
  const navigate = useNavigate()
  const bills = useBank((s) => s.bills)
  const review = bills.filter((b) => b.status === 'review')
  const overdue = bills.filter((b) => b.status === 'overdue')
  const soon = bills.filter((b) => ['review', 'draft', 'scheduled'].includes(b.status) && (new Date(b.due) - TODAY) / 864e5 <= 7)
  const inbox = bills.filter((b) => b.status === 'draft')
  return (
    <Card>
      <CardHeader title="Thanh toán" desc="Hoá đơn nhà cung cấp cần trả" action={<IconButton icon={Upload} label="Tải hoá đơn lên" size="sm" variant="secondary" onClick={() => navigate('/thanh-toan?tai-len=1')} />} />
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Chờ duyệt" value={review.length ? <Money value={sum(review, (b) => b.amount)} /> : '—'} sub={`${review.length} hoá đơn`} />
        <MiniStat label="Quá hạn" tone={overdue.length ? 'neg' : null} value={overdue.length ? <Money value={sum(overdue, (b) => b.amount)} /> : '—'} sub={`${overdue.length} hoá đơn`} />
        <MiniStat label="Đến hạn 7 ngày" value={soon.length ? <Money value={sum(soon, (b) => b.amount)} /> : '—'} sub={`${soon.length} hoá đơn`} />
      </div>
      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
        <div className="text-[13px]"><span className="text-muted">Hộp thư hoá đơn · </span><span className="font-[550]">{inbox.length} cần bổ sung</span></div>
        <MoreLink to="/thanh-toan">Xem</MoreLink>
      </div>
    </Card>
  )
}

function ReceivablesCard() {
  const navigate = useNavigate()
  const invoices = useBank((s) => s.invoices)
  const open = invoices.filter((v) => ['sent', 'viewed', 'partial'].includes(v.status))
  const overdue = invoices.filter((v) => v.status === 'overdue')
  const paid = invoices.filter((v) => v.status === 'paid' && v.paidAt && (TODAY - new Date(v.paidAt)) / 864e5 <= 30)
  return (
    <Card>
      <CardHeader title="Hoá đơn bán ra" desc="Tiền khách hàng đang nợ" action={<IconButton icon={Plus} label="Tạo hoá đơn" size="sm" variant="secondary" onClick={() => navigate('/hoa-don?tao=1')} />} />
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Chưa thu" value={<Money value={sum(open, (v) => invoiceTotals(v).due)} />} sub={`${open.length} hoá đơn`} />
        <MiniStat label="Quá hạn" tone={overdue.length ? 'neg' : null} value={overdue.length ? <Money value={sum(overdue, (v) => invoiceTotals(v).due)} /> : '—'} sub={`${overdue.length} hoá đơn`} />
        <MiniStat label="Đã thu 30 ngày" value={<Money value={sum(paid, (v) => v.paid)} />} sub={`${paid.length} hoá đơn`} />
      </div>
      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
        <div className="text-[13px] text-muted">Gần nhất: <span className="text-fg font-[550]">{invoices[0]?.number}</span></div>
        <MoreLink to="/hoa-don">Xem</MoreLink>
      </div>
    </Card>
  )
}

/* ---------- Dòng tiền trong tháng ---------- */
function MoneyMovement() {
  const transactions = useBank((s) => s.transactions)
  const [offset, setOffset] = useState(0)
  const month = new Date(TODAY.getFullYear(), TODAY.getMonth() - offset, 1)
  const { inflow, outflow, ins, outs } = useMemo(() => {
    const list = transactions.filter((t) => {
      const x = new Date(t.date)
      return t.status !== 'failed' && t.category !== 'transfer' && x.getMonth() === month.getMonth() && x.getFullYear() === month.getFullYear()
    })
    const group = (arr) => {
      const m = new Map()
      arr.forEach((t) => { const k = t.merchant || txName(t); m.set(k, (m.get(k) || 0) + Math.abs(t.amount)) })
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({
        key: k, value: v, label: MERCHANTS[k]?.name || k,
        icon: <Avatar name={MERCHANTS[k]?.name || k} color={MERCHANTS[k]?.color || '#6b7280'} size={20} />,
      }))
    }
    const i = list.filter((t) => t.amount > 0), o = list.filter((t) => t.amount < 0)
    return { inflow: sum(i, (t) => t.amount), outflow: sum(o, (t) => t.amount), ins: group(i), outs: group(o) }
  }, [transactions, offset]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="ds-h2">Dòng tiền</h2>
        <div className="flex items-center gap-0.5 ml-2">
          <IconButton icon={ChevronLeft} label="Tháng trước" size="sm" onClick={() => setOffset(offset + 1)} disabled={offset >= 5} />
          <span className="text-[13.5px] font-[550] w-28 text-center">Tháng {month.getMonth() + 1}/{month.getFullYear()}</span>
          <IconButton icon={ChevronRight} label="Tháng sau" size="sm" onClick={() => setOffset(offset - 1)} disabled={offset === 0} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-[13.5px] text-muted"><span className="size-6 grid place-items-center rounded-full bg-pos-soft text-pos"><ArrowDownLeft size={14} /></span>Tiền vào</div>
          <div className="ds-amount !text-[24px] mt-2"><Money value={inflow} /></div>
          {ins.length ? <BarList className="mt-3 -mx-2.5" items={ins} /> : <p className="ds-caption mt-3">Chưa có tiền vào trong tháng này.</p>}
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-[13.5px] text-muted"><span className="size-6 grid place-items-center rounded-full bg-neg-soft text-neg"><ArrowUpRight size={14} /></span>Tiền ra</div>
          <div className="ds-amount !text-[24px] mt-2"><Money value={outflow} /></div>
          <BarList className="mt-3 -mx-2.5" items={outs.map((x) => ({ ...x, color: 'var(--c-neg)' }))} />
        </Card>
      </div>
    </section>
  )
}

/* ---------- Giao dịch gần đây ---------- */
const needsWork = (t) => t.status !== 'failed' && t.category !== 'transfer' && (!t.category || (t.amount < -200000 && !t.receipt))

function RecentTransactions() {
  const transactions = useBank((s) => s.transactions)
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(null)
  const list = transactions.filter((t) => {
    if (tab === 'in') return t.amount > 0 && t.category !== 'transfer'
    if (tab === 'out') return t.amount < 0 && t.category !== 'transfer'
    if (tab === 'todo') return needsWork(t)
    return true
  }).slice(0, 8)
  return (
    <Card padded={false}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <h2 className="ds-h2">Giao dịch</h2>
        <MoreLink to="/giao-dich" />
      </div>
      <Tabs className="px-5 mt-1" value={tab} onChange={setTab} options={[
        { value: 'all', label: 'Gần đây' }, { value: 'in', label: 'Tiền vào' }, { value: 'out', label: 'Tiền ra' },
        { value: 'todo', label: 'Cần bổ sung', count: transactions.filter(needsWork).length },
      ]} />
      <TxList transactions={list} onSelect={(t) => setOpen(t.id)} />
      <TxDrawer id={open} onClose={() => setOpen(null)} />
    </Card>
  )
}

/* ---------- Việc cần làm ---------- */
function TasksCard() {
  const navigate = useNavigate()
  const tasks = useBank((s) => s.tasks)
  return (
    <Card>
      <CardHeader title="Việc cần làm" icon={ListChecks} action={<Badge tone={tasks.length ? 'warn' : 'pos'}>{tasks.length}</Badge>} />
      <div className="flex flex-col -mx-2">
        {tasks.slice(0, 4).map((t) => (
          <button key={t.id} onClick={() => navigate(t.to)} className="group flex items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-subtle">
            <span className={cn('mt-1.5 size-2 rounded-full shrink-0', t.priority === 'high' ? 'bg-neg' : t.priority === 'medium' ? 'bg-warn' : 'bg-faint')} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-[550]">{t.title}</span>
              <span className="block ds-caption line-clamp-1">{t.desc}</span>
            </span>
            {t.due && <span className="text-[12px] text-muted shrink-0 mt-0.5">{formatRelative(t.due)}</span>}
          </button>
        ))}
        {!tasks.length && <p className="ds-caption px-2 py-3">Không còn việc nào. Tuyệt vời!</p>}
      </div>
      <MoreLink to="/viec-can-lam" className="mt-2">Tất cả việc cần làm</MoreLink>
    </Card>
  )
}

/* ---------- Thẻ ---------- */
function CardsSpendCard() {
  const navigate = useNavigate()
  const cards = useBank((s) => s.cards)
  const team = useBank((s) => s.team)
  const active = cards.filter((c) => c.status === 'active')
  return (
    <Card>
      <CardHeader title="Chi tiêu thẻ tháng này" icon={CreditCard} action={<Button size="xs" variant="ghost" onClick={() => navigate('/the')}>Quản lý</Button>} />
      <div className="flex flex-col gap-3.5">
        {active.slice(0, 4).map((c) => {
          const m = team.find((x) => x.id === c.member)
          return (
            <div key={c.id} className="flex items-center gap-3">
              <Avatar name={m?.name} color={m?.color} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="truncate">{c.nickname} <span className="text-faint">••{c.last4}</span></span>
                  <span className="num text-muted shrink-0">{formatCompact(c.spent)} / {formatCompact(c.limit)}</span>
                </div>
                <Progress value={c.spent} max={c.limit} height={5} className="mt-1.5" />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- Banner trợ lý AI ---------- */
function AiBanner({ onClose }) {
  const navigate = useNavigate()
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-brand-50 via-surface to-gold-soft p-5 sm:p-6 mb-7">
      <IconButton icon={X} label="Ẩn thông báo" size="sm" className="absolute top-3 right-3" onClick={onClose} />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pr-8 sm:pr-10">
        <span className="size-11 grid place-items-center rounded-xl bg-brand-500 text-white dark:text-[#06140f] shrink-0"><Sparkles size={20} /></span>
        <div className="min-w-0 flex-1">
          <div className="ds-h3">Trợ lý AI đã phân loại 312 giao dịch giúp bạn</div>
          <p className="text-[13.5px] text-muted mt-0.5">Còn vài giao dịch chưa chắc chắn. Xác nhận nhanh để báo cáo chi phí tháng 11 chính xác.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/giao-dich?loc=chua-phan-loai')}>Xem ngay</Button>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const [banner, setBanner] = useState(() => { try { return localStorage.getItem('mach-banner-ai') !== '0' } catch { return true } })
  const [shown, setShown] = useState(() => ACTIONS.map((a) => a.id))
  const run = (id) => {
    if (['send', 'transfer', 'deposit', 'request'].includes(id)) openMoveMoney(id)
    if (id === 'bill') navigate('/thanh-toan?tai-len=1')
    if (id === 'invoice') navigate('/hoa-don?tao=1')
  }
  const closeBanner = () => { setBanner(false); try { localStorage.setItem('mach-banner-ai', '0') } catch { /* bỏ qua */ } }

  return (
    <div className="animate-fade-in">
      {banner && <AiBanner onClose={closeBanner} />}
      <h1 className="ds-h1 !text-[26px] sm:!text-[30px]">{greet()}, {ME.name.split(' ').slice(-2).join(' ')}</h1>
      <div className="mt-5 mb-7 flex items-center gap-2 flex-wrap">
        {ACTIONS.filter((a) => shown.includes(a.id)).map((a, i) => (
          <Button key={a.id} pill variant={i === 0 ? 'primary' : 'secondary'} icon={a.icon} onClick={() => run(a.id)}>{a.label}</Button>
        ))}
        <div className="flex-1" />
        <Popover align="end" width={250} trigger={(p) => <Button {...p} variant="ghost" size="sm" icon={SlidersHorizontal}>Tuỳ chỉnh</Button>}>
          {() => (
            <div className="p-1.5 flex flex-col gap-2">
              <div className="ds-label px-1">Nút hiển thị</div>
              {ACTIONS.map((a) => (
                <Checkbox key={a.id} label={a.label} checked={shown.includes(a.id)}
                  onChange={(v) => { if (!v && shown.length === 1) return toast({ title: 'Cần giữ ít nhất một nút', tone: 'info' }); setShown(v ? [...shown, a.id] : shown.filter((x) => x !== a.id)) }} />
              ))}
            </div>
          )}
        </Popover>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <BalanceCard />
        <AccountsCard />
        <PayablesCard />
        <ReceivablesCard />
      </div>

      <div className="mt-10"><MoneyMovement /></div>

      <div className="mt-10 grid xl:grid-cols-[1fr_340px] gap-4 items-start">
        <RecentTransactions />
        <div className="grid md:grid-cols-2 xl:grid-cols-1 gap-4">
          <TasksCard />
          <CardsSpendCard />
        </div>
      </div>
    </div>
  )
}
