import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Send, ArrowLeftRight, Download, Copy, Pencil, Check, X, Landmark, ArrowDownLeft, ArrowUpRight, Share2 } from 'lucide-react'
import { addDays, formatPercent, startOfDay, TODAY } from '@/lib/format'
import { balanceSeries } from '@/lib/selectors'
import { useBank, useUI, toast } from '@/store'
import { ACCOUNT_KIND } from '@/data/org'
import { Card, CardHeader, Button, IconButton, Money, Badge, AccountIcon, Segmented, Stat, EmptyState, QrCode, MoreLink, Callout } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { TxList } from '@/features/transactions/TxList'
import { TxDrawer } from '@/features/transactions/TxDrawer'

const HOLDER = 'CONG TY CO PHAN SEN VIET DIGITAL'
const RANGES = [{ value: 30, label: '30N' }, { value: 90, label: '90N' }, { value: 180, label: '180N' }]

/** Tên tài khoản sửa trực tiếp */
function InlineName({ account }) {
  const update = useBank((s) => s.update)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(account.name)
  const ref = useRef(null)
  const start = () => { setVal(account.name); setEditing(true); setTimeout(() => ref.current?.select(), 0) }
  const save = () => {
    const v = val.trim()
    setEditing(false)
    if (v.length >= 2 && v !== account.name) { update('accounts', account.id, { name: v }); toast({ title: 'Đã đổi tên tài khoản', desc: v }) }
  }
  if (editing) {
    return (
      <form className="flex items-center gap-1.5 min-w-0" onSubmit={(e) => { e.preventDefault(); save() }}>
        <input ref={ref} value={val} maxLength={40} aria-label="Tên tài khoản" onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(false) } }}
          className="ds-h1 min-w-0 w-full max-w-[420px] bg-surface border border-brand-400 ring-[3px] ring-brand-100 rounded-[10px] px-2 -mx-2 outline-none" />
        <IconButton type="submit" icon={Check} size="sm" label="Lưu tên" variant="secondary" />
        <IconButton icon={X} size="sm" label="Huỷ đổi tên" onClick={() => setEditing(false)} />
      </form>
    )
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0 group">
      <h1 className="ds-h1 truncate">{account.name}</h1>
      <IconButton icon={Pencil} size="sm" label="Đổi tên tài khoản" onClick={start} className="opacity-60 group-hover:opacity-100" />
    </div>
  )
}

function CopyRow({ label, value, copy = true }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
      <span className="text-[13px] text-muted shrink-0">{label}</span>
      {copy ? (
        <button type="button" onClick={() => { navigator.clipboard?.writeText(value); toast({ title: 'Đã sao chép', desc: `${label}: ${value}` }) }}
          className="group inline-flex items-center gap-2 text-[13.5px] font-[550] text-right min-w-0" aria-label={`Sao chép ${label.toLowerCase()}`}>
          <span className="truncate num">{value}</span><Copy size={13} className="text-faint group-hover:text-fg shrink-0" />
        </button>
      ) : <span className="text-[13.5px] font-[550] text-right">{value}</span>}
    </div>
  )
}

export default function AccountDetailPage() {
  const { id } = useParams()
  const accounts = useBank((s) => s.accounts)
  const transactions = useBank((s) => s.transactions)
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const [range, setRange] = useState(90)
  const [txId, setTxId] = useState(null)
  const a = accounts.find((x) => x.id === id)

  const series = useMemo(() => (a ? balanceSeries(transactions, accounts, range, [a.id]) : []), [transactions, accounts, range, a])
  const mine = useMemo(() => transactions.filter((t) => t.account === id), [transactions, id])
  const stats = useMemo(() => {
    const from = startOfDay(addDays(TODAY, -range))
    let inflow = 0, outflow = 0, count = 0
    mine.forEach((t) => {
      if (t.status === 'failed' || new Date(t.date) < from) return
      count++
      if (t.amount > 0) inflow += t.amount
      else outflow += t.amount
    })
    return { inflow, outflow, net: inflow + outflow, count }
  }, [mine, range])

  if (!a) {
    return (
      <div>
        <Link to="/tai-khoan" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg mb-4"><ChevronLeft size={16} />Tài khoản</Link>
        <Card>
          <EmptyState icon={Landmark} title="Không tìm thấy tài khoản" desc="Tài khoản này không tồn tại hoặc đã bị đóng. Hãy kiểm tra lại đường dẫn."
            action={<Button variant="primary" to="/tai-khoan">Về danh sách tài khoản</Button>} />
        </Card>
      </div>
    )
  }

  const other = accounts.find((x) => x.id !== a.id && (a.id === 'acc-main' ? x.id === 'acc-reserve' : x.id === 'acc-main')) || accounts.find((x) => x.id !== a.id)
  const monthlyInterest = a.apy ? Math.round((a.balance * a.apy) / 100 / 12) : 0

  return (
    <div>
      <Link to="/tai-khoan" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg mb-4"><ChevronLeft size={16} />Tài khoản</Link>

      {/* ---- Đầu trang ---- */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <AccountIcon kind={a.kind} color={a.color} size={48} />
          <div className="min-w-0 flex-1">
            <InlineName account={a} />
            <div className="flex items-center gap-2 flex-wrap mt-0.5 text-[13px] text-muted">
              <span>{ACCOUNT_KIND[a.kind]} ••{a.last4}</span>
              {a.primary && <Badge size="sm" tone="brand">Tài khoản chính</Badge>}
              {a.apy && <Badge size="sm" tone="gold">Lãi {formatPercent(a.apy)}/năm</Badge>}
            </div>
            <Money value={a.balance} className="block mt-3 text-[36px] sm:text-[40px] font-[480] tracking-tight leading-none" />
            <div className="ds-caption mt-1.5">Số dư khả dụng</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="primary" icon={Send} onClick={() => openMoveMoney('send', { from: a.id })}>Chuyển tiền</Button>
          <Button variant="outline" icon={ArrowLeftRight} disabled={!other} onClick={() => openMoveMoney('transfer', { from: a.id, to: other?.id })}>Chuyển nội bộ</Button>
          <Button variant="outline" icon={Download} onClick={() => openMoveMoney('deposit')}>Nhận tiền</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          {/* ---- Biểu đồ số dư ---- */}
          <Card>
            <CardHeader title="Số dư theo thời gian" desc={`${stats.count} giao dịch trong ${range} ngày qua`}
              action={<Segmented size="sm" value={range} onChange={setRange} options={RANGES} />} />
            <AreaChart data={series} height={220} color={a.color} />
            <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4 mt-5 pt-5 border-t border-line">
              <Stat label={<span className="inline-flex items-center gap-1"><ArrowDownLeft size={14} className="text-pos" />Tiền vào</span>} value={<Money value={stats.inflow} />} />
              <Stat label={<span className="inline-flex items-center gap-1"><ArrowUpRight size={14} className="text-neg" />Tiền ra</span>} value={<Money value={Math.abs(stats.outflow)} />} />
              <Stat label="Thay đổi ròng" value={<Money value={stats.net} sign className={stats.net >= 0 ? 'text-pos' : 'text-fg'} />} sub="Bao gồm chuyển nội bộ" />
            </div>
          </Card>

          {/* ---- Giao dịch gần đây ---- */}
          <Card padded={false}>
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
              <div>
                <h3 className="ds-h3">Giao dịch gần đây</h3>
                <p className="ds-caption mt-0.5">{mine.length} giao dịch trên tài khoản này</p>
              </div>
              <MoreLink to={`/giao-dich?tai-khoan=${a.id}`}>Xem tất cả</MoreLink>
            </div>
            <div className="border-t border-line">
              <TxList transactions={mine.slice(0, 8)} showAccount={false} onSelect={(t) => setTxId(t.id)} empty="Tài khoản chưa có giao dịch" />
            </div>
          </Card>
        </div>

        {/* ---- Thông tin tài khoản ---- */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Thông tin tài khoản" desc="Dùng để nhận chuyển khoản từ mọi ngân hàng"
              action={<IconButton icon={Share2} size="sm" label="Chia sẻ thông tin tài khoản"
                onClick={() => { navigator.clipboard?.writeText(`${a.bank}\n${a.number}\n${HOLDER}`); toast({ title: 'Đã sao chép thông tin tài khoản', desc: 'Dán vào email hoặc Zalo để gửi cho khách.' }) }} />} />
            <div>
              <CopyRow label="Số tài khoản" value={a.number} />
              <CopyRow label="Chủ tài khoản" value={HOLDER} />
              <CopyRow label="Ngân hàng" value={a.bank} copy={false} />
              <CopyRow label="Chi nhánh" value="Hội sở TP. Hồ Chí Minh" copy={false} />
              {a.apy && <CopyRow label="Lãi suất" value={`${formatPercent(a.apy)}/năm · không kỳ hạn`} copy={false} />}
            </div>
            <div className="mt-5 flex flex-col items-center rounded-2xl border border-line p-4 bg-white text-[#0c120f] [--qr-bg:#fff]">
              <QrCode value={a.number} size={156} />
              <div className="text-[11.5px] font-[650] mt-2 tracking-wide">VietQR · NAPAS 247</div>
              <div className="text-[11px] mt-0.5 opacity-60">Quét bằng ứng dụng ngân hàng bất kỳ</div>
            </div>
          </Card>
          {a.apy ? (
            <Callout tone="brand" title="Lãi dự kiến tháng này">
              Khoảng <Money value={monthlyInterest} className="font-[600]" />, được cộng vào ngày 1 tháng sau.
            </Callout>
          ) : a.kind === 'tax' ? (
            <Callout tone="info" title="Tài khoản dành nộp thuế">Quy tắc “Trích thuế tự động” đang chuyển 10% mỗi khoản tiền vào sang đây. <Link to="/tai-khoan?tab=quy-tac" className="underline underline-offset-2">Xem quy tắc</Link></Callout>
          ) : null}
        </div>
      </div>

      <TxDrawer id={txId} onClose={() => setTxId(null)} />
    </div>
  )
}
