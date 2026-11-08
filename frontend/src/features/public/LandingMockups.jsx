/* ==========================================================
   Các "ảnh chụp sản phẩm" trên trang giới thiệu —
   dựng bằng chính thành phần giao diện của ứng dụng, có tương tác nhẹ.
   ========================================================== */
import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowRight, Check, Clock, FileText, Sparkles, Send, ScanLine, ShieldCheck, Repeat, CircleDot } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatVND, formatCompact } from '@/lib/format'
import { balanceSeries, totalBalance } from '@/lib/selectors'
import { useBank } from '@/store'
import { ACCOUNTS, AUTO_RULES, COMPANY, TEAM } from '@/data/org'
import { CARDS } from '@/data/spend'
import { BILLS, RECIPIENTS } from '@/data/payments'
import { INVOICES, CUSTOMERS, invoiceTotals, INVOICE_STATUS } from '@/data/invoicing'
import { CATEGORIES } from '@/data/transactions'
import { AccountIcon, Avatar, Badge, CategoryTag, Money, PaymentCard, Progress, QrCode, StatusBadge, Toggle } from '@/components/ui'
import { AreaChart, BarList, Sparkline } from '@/components/charts'

const member = (id) => TEAM.find((m) => m.id === id)

/** Khung mờ phía sau mỗi bản dựng */
export function MockStage({ children, className, tone = 'brand' }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[28px] border border-line p-4 sm:p-8',
      tone === 'brand' ? 'bg-gradient-to-br from-brand-50 via-subtle to-canvas' : 'bg-gradient-to-br from-gold-soft via-subtle to-canvas', className)}>
      <div className="absolute inset-0 dot-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  )
}

/* ---------------- Hero: bảng điều khiển thu nhỏ ---------------- */
export function HeroDashboard() {
  const { accounts, transactions } = useBank()
  const series = useMemo(() => balanceSeries(transactions, accounts, 30), [transactions, accounts])
  const total = totalBalance(accounts)
  const first = series[0]?.value || total
  const change = first ? ((total - first) / first) * 100 : 0
  return (
    <div className="card shadow-lg overflow-hidden text-left">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 sm:px-5 h-12">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name="Sen Việt" color="#138f66" size={24} square />
          <span className="text-[13.5px] font-[600] truncate">{COMPANY.short}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5" aria-hidden>
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-brand-500 text-white dark:text-[#06140f] text-[12px] font-[600]"><Send size={13} /> Tạo lệnh chi</span>
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-subtle text-fg text-[12px] font-[600]"><ArrowDownLeft size={13} /> Thu tiền</span>
        </div>
      </div>
      <div className="grid md:grid-cols-[1.35fr_1fr]">
        <div className="p-4 sm:p-5 md:border-r border-line">
          <div className="text-[12.5px] text-muted">Tổng số dư · {accounts.length} tài khoản ngân hàng đã kết nối</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Money value={total} hideable={false} className="text-[26px] sm:text-[30px] font-[500] tracking-tight" />
            <Badge tone="pos" size="sm">{change >= 0 ? '+' : ''}{change.toFixed(1).replace('.', ',')}% trong 30 ngày</Badge>
          </div>
          <AreaChart data={series} height={128} showAxis={false} className="mt-3" />
          <div className="mt-2 flex justify-between text-[11px] text-faint"><span>09/10</span><span>Hôm nay</span></div>
        </div>
        <div className="p-4 sm:p-5 flex flex-col gap-1 border-t md:border-t-0 border-line">
          <div className="ds-label mb-1">Tài khoản đã kết nối</div>
          {ACCOUNTS.slice(0, 3).map((a) => {
            const live = accounts.find((x) => x.id === a.id) || a
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-lg py-2">
                <AccountIcon kind={a.kind} color={a.color} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-[550] truncate">{a.name}</div>
                  <div className="text-[11.5px] text-faint truncate">{a.bank} ••{a.last4}</div>
                </div>
                <Money value={live.balance} hideable={false} className="text-[13px] font-[550]" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Thông báo nổi cạnh bảng điều khiển */
export function FloatChip({ icon: Icon, tone = 'pos', title, desc, className }) {
  const t = { pos: 'bg-pos-soft text-pos', brand: 'bg-brand-50 text-brand-ink', gold: 'bg-gold-soft text-gold', info: 'bg-info-soft text-info' }[tone]
  return (
    <div className={cn('card shadow-md flex items-center gap-3 px-3.5 py-3 w-[270px]', className)}>
      <span className={cn('size-9 shrink-0 grid place-items-center rounded-full', t)}><Icon size={17} /></span>
      <div className="min-w-0">
        <div className="text-[13px] font-[600] truncate">{title}</div>
        <div className="ds-caption truncate">{desc}</div>
      </div>
    </div>
  )
}

/* ---------------- 1. Tài khoản & quy tắc tự động ---------------- */
export function AccountsMock() {
  const [rules, setRules] = useState(() => Object.fromEntries(AUTO_RULES.map((r) => [r.id, r.active])))
  const spark = (seed) => Array.from({ length: 14 }, (_, i) => 50 + Math.sin(i * 0.7 + seed) * 12 + i * (1.5 + seed * 0.3))
  return (
    <MockStage>
      <div className="grid gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="ds-h3">Tài khoản ngân hàng</span>
            <span className="ds-caption">{ACCOUNTS.length} tài khoản · {new Set(ACCOUNTS.map((a) => a.bank)).size} ngân hàng</span>
          </div>
          {ACCOUNTS.map((a, i) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <AccountIcon kind={a.kind} color={a.color} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-[550] truncate">{a.name} <span className="text-faint font-normal">••{a.last4}</span></div>
                <div className="ds-caption">{a.bank}</div>
              </div>
              <span className="hidden sm:block"><Sparkline values={spark(i)} width={64} height={22} color={a.color} /></span>
              <Money value={a.balance} hideable={false} className="text-[13.5px] font-[550] w-[118px] text-right" />
            </div>
          ))}
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Repeat size={16} className="text-brand-ink" />
            <span className="ds-h3">Quy tắc tự động</span>
            <span className="ml-auto ds-caption hidden sm:inline">Lệnh chuyển gửi qua ngân hàng của bạn</span>
          </div>
          <div className="flex flex-col gap-3">
            {AUTO_RULES.slice(0, 2).map((r) => (
              <div key={r.id} className="rounded-xl border border-line bg-subtle/60 p-3.5">
                <Toggle size="sm" checked={rules[r.id]} onChange={(v) => setRules((s) => ({ ...s, [r.id]: v }))} label={r.title} desc={r.desc} />
                <div className="mt-2.5 flex items-center gap-2 text-[12px] text-muted">
                  <span className="rounded-md bg-surface border border-line px-1.5 py-0.5">{ACCOUNTS.find((a) => a.id === r.from)?.name}</span>
                  <ArrowRight size={13} />
                  <span className="rounded-md bg-surface border border-line px-1.5 py-0.5">{ACCOUNTS.find((a) => a.id === r.to)?.name}</span>
                  <span className="ml-auto hidden sm:inline">{rules[r.id] ? r.freq : 'Đang tắt'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockStage>
  )
}

/* ---------------- 2. Thẻ ---------------- */
export function CardsMock() {
  const front = CARDS.find((c) => c.id === 'c2')
  const back = CARDS.find((c) => c.id === 'c1')
  const [frozen, setFrozen] = useState(false)
  const holder = member(front.member)
  return (
    <MockStage tone="gold">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-[210px] w-full max-w-[360px] mx-auto">
          <PaymentCard card={back} holder={member(back.member).name} className="absolute right-0 top-0 rotate-[7deg] origin-bottom-left scale-[.92] opacity-95" />
          <PaymentCard card={{ ...front, status: frozen ? 'frozen' : 'active' }} holder={holder.name} className="absolute left-0 top-5 -rotate-[3deg] shadow-lg" />
        </div>
        <div className="card w-full p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="ds-h3">{front.nickname}</div>
              <div className="ds-caption">Thẻ ảo •• {front.last4} · {holder.name} · do {COMPANY.partnerBank} phát hành</div>
            </div>
            <Badge tone={frozen ? 'info' : 'pos'} dot>{frozen ? 'Tạm khoá' : 'Đang hoạt động'}</Badge>
          </div>
          <div className="mt-4 flex items-baseline justify-between text-[13px]">
            <span className="text-muted">Đã chi tháng này</span>
            <span><Money value={front.spent} hideable={false} className="font-[600]" /> <span className="text-faint">/ {formatCompact(front.limit)}</span></span>
          </div>
          <Progress value={front.spent} max={front.limit} className="mt-2" />
          <div className="mt-4 flex flex-wrap gap-1.5">
            {['Quảng cáo', 'Phần mềm', 'Thiết kế'].map((g) => <Badge key={g} tone="neutral" size="sm">{g}</Badge>)}
            <Badge tone="neg" size="sm">Chặn: Rút tiền mặt</Badge>
          </div>
          <div className="mt-4 border-t border-line pt-4">
            <Toggle checked={frozen} onChange={setFrozen} label="Tạm khoá thẻ" desc="Gửi yêu cầu khoá tới ngân hàng phát hành; giao dịch mới bị từ chối cho tới khi mở lại." />
          </div>
        </div>
      </div>
    </MockStage>
  )
}

/* ---------------- 3. Thanh toán hoá đơn & duyệt chi ---------------- */
export function BillsMock() {
  const bill = BILLS.find((b) => b.id === 'bl1')
  const vendor = RECIPIENTS.find((r) => r.id === bill.recipient)
  const [state, setState] = useState('review') // review | approved | rejected
  const steps = [
    { who: member(bill.requestedBy), role: 'Người đề nghị', status: 'done', note: 'Đã gửi 28/10' },
    { who: member('u2'), role: 'Kế toán trưởng', status: state === 'review' ? 'current' : state === 'approved' ? 'done' : 'rejected', note: state === 'review' ? 'Đang chờ duyệt' : state === 'approved' ? 'Đã duyệt vừa xong' : 'Đã từ chối' },
    { who: member('u1'), role: 'Giám đốc · khoản trên 30 triệu', status: state === 'approved' ? 'current' : 'waiting', note: state === 'approved' ? 'Đến lượt duyệt' : 'Chờ bước trước' },
  ]
  return (
    <MockStage>
      <div className="grid gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Avatar name={vendor.name} color={vendor.color} size={40} square />
            <div className="min-w-0 flex-1">
              <div className="ds-h3 truncate">{vendor.name}</div>
              <div className="ds-caption">Hoá đơn {bill.number} · {bill.note}</div>
            </div>
            <Badge tone="brand" icon={Sparkles} size="sm" className="hidden sm:inline-flex">Đọc tự động</Badge>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-subtle p-3.5 text-[12.5px]">
            <div><div className="text-faint">Số tiền</div><div className="num text-[15px] font-[600] text-fg mt-0.5">{formatVND(bill.amount)}</div></div>
            <div><div className="text-faint">Hạn thanh toán</div><div className="text-[14px] font-[550] text-fg mt-0.5">{formatDate(bill.due)}</div></div>
            <div><div className="text-faint">Ngân hàng</div><div className="text-fg mt-0.5">{vendor.bank}</div></div>
            <div><div className="text-faint">Số tài khoản</div><div className="num text-fg mt-0.5">{vendor.account}</div></div>
          </div>
          <div className="mt-3 flex items-center gap-2 ds-caption"><FileText size={14} /> {bill.file} · VAT {bill.vat}%</div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="ds-h3 mb-3">Quy trình duyệt</div>
          <ol className="flex flex-col">
            {steps.map((s, i) => (
              <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                {i < steps.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" aria-hidden />}
                <span className="relative">
                  <Avatar name={s.who.name} color={s.who.color} size={30} />
                  <span className={cn('absolute -right-1 -bottom-1 size-4 rounded-full grid place-items-center ring-2 ring-surface',
                    s.status === 'done' ? 'bg-pos text-white' : s.status === 'current' ? 'bg-warn text-white' : s.status === 'rejected' ? 'bg-neg text-white' : 'bg-line-strong text-surface')}>
                    {s.status === 'done' ? <Check size={10} strokeWidth={3.5} /> : s.status === 'current' ? <Clock size={10} strokeWidth={3} /> : <CircleDot size={9} />}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-[550]">{s.who.name}</div>
                  <div className="ds-caption">{s.role} · {s.note}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            {state === 'review' ? (
              <>
                <button onClick={() => setState('approved')} className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-brand-500 px-3 text-[13px] font-[550] text-white dark:text-[#06140f] hover:bg-brand-600">
                  <Check size={15} /> Duyệt
                </button>
                <button onClick={() => setState('rejected')} className="inline-flex h-8 items-center rounded-[9px] bg-subtle px-3 text-[13px] font-[550] text-fg hover:bg-hover">Từ chối</button>
              </>
            ) : (
              <>
                <span className={cn('text-[13px] font-[550]', state === 'approved' ? 'text-pos' : 'text-neg')}>
                  {state === 'approved' ? 'Đã chuyển sang Giám đốc duyệt bước cuối.' : 'Đã trả hoá đơn về cho người đề nghị.'}
                </span>
                <button onClick={() => setState('review')} className="ml-auto text-[12.5px] font-[550] text-brand-ink hover:underline">Thử lại</button>
              </>
            )}
          </div>
        </div>
      </div>
    </MockStage>
  )
}

/* ---------------- 4. Xuất hoá đơn & VietQR ---------------- */
export function InvoiceMock() {
  const inv = INVOICES.find((i) => i.id === 'iv2')
  const cus = CUSTOMERS.find((c) => c.id === inv.customer)
  const t = invoiceTotals(inv)
  const [paid, setPaid] = useState(false)
  return (
    <MockStage tone="gold">
      <div className="card p-5 sm:p-6 [--qr-bg:var(--c-surface)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] tracking-[.14em] uppercase text-muted font-[600]">Hoá đơn</div>
            <div className="num text-[15px] font-[600] mt-0.5">{inv.number}</div>
          </div>
          {paid ? <Badge tone="pos" dot>Đã thanh toán</Badge> : <StatusBadge map={INVOICE_STATUS} value={inv.status} />}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-[12.5px]">
          <div><div className="text-faint">Từ</div><div className="font-[600] text-fg">{COMPANY.short}</div><div className="text-muted">MST {COMPANY.taxCode}</div></div>
          <div><div className="text-faint">Gửi tới</div><div className="font-[600] text-fg">{cus.name}</div><div className="text-muted">MST {cus.taxCode}</div></div>
        </div>
        <div className="mt-4 border-t border-line">
          {inv.items.map((it, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 py-2.5 border-b border-line text-[13px]">
              <span className="min-w-0 truncate">{it.name} <span className="text-faint">× {it.qty}</span></span>
              <Money value={it.qty * it.price} hideable={false} />
            </div>
          ))}
          <div className="flex justify-between py-2 text-[12.5px] text-muted"><span>Thuế GTGT 8%</span><Money value={t.vat} hideable={false} /></div>
        </div>
        <div className="mt-2 flex flex-col sm:flex-row gap-5 items-center rounded-2xl bg-subtle p-4">
          <div className="rounded-xl bg-surface border border-line p-2.5 text-fg shrink-0">
            <QrCode value={inv.number} size={116} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="text-[12.5px] text-muted">Tổng cần thanh toán</div>
            <div className="ds-amount text-[26px] mt-0.5">{formatVND(t.total)}</div>
            <div className="ds-caption mt-1">Quét VietQR bằng mọi ứng dụng ngân hàng</div>
            <button onClick={() => setPaid(!paid)} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-surface border border-line-strong px-3 text-[12.5px] font-[550] hover:bg-hover">
              <ScanLine size={14} /> {paid ? 'Đặt lại' : 'Mô phỏng khách quét mã'}
            </button>
          </div>
        </div>
        {paid && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-pos-soft text-pos px-3.5 py-2.5 text-[13px] font-[550] animate-pop-in">
            <Check size={16} className="shrink-0" /> {formatVND(t.total)} đã về tài khoản ngân hàng của bạn — hoá đơn được đối soát tự động.
          </div>
        )}
      </div>
    </MockStage>
  )
}

/* ---------------- 5. Kế toán & Trợ lý AI ---------------- */
export function AssistantMock() {
  const bars = [
    { key: 'meta', label: 'Meta Ads', value: 32400000, color: CATEGORIES.marketing.color },
    { key: 'gads', label: 'Google Ads', value: 24600000, color: CATEGORIES.marketing.color },
    { key: 'tiktok', label: 'TikTok Ads', value: 14200000, color: CATEGORIES.marketing.color },
  ]
  const rows = [
    { name: 'Highlands Coffee', amount: -486000, cat: 'meals', note: 'Đã khớp hoá đơn VAT' },
    { name: 'VNG Cloud', amount: -7920000, cat: 'software', note: 'Đã khớp hoá đơn VAT' },
    { name: 'Grab', amount: -214000, cat: 'travel', note: 'Thiếu chứng từ · đã nhắc Gia Khang' },
  ]
  return (
    <MockStage>
      <div className="grid gap-4">
        <div className="card p-4 sm:p-5 flex flex-col gap-3">
          <div className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 text-white dark:text-[#06140f] px-3.5 py-2.5 text-[13.5px]">
            Tháng 10 mình chi bao nhiêu cho quảng cáo?
          </div>
          <div className="flex gap-2.5">
            <span className="size-7 shrink-0 grid place-items-center rounded-full bg-brand-50 text-brand-ink"><Sparkles size={14} /></span>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-subtle px-3.5 py-3 text-[13.5px]">
              Tháng 10 bạn chi <b className="font-[650] num">71,2 triệu ₫</b> cho Quảng cáo & Marketing, tăng 12% so với tháng 9. Ba kênh lớn nhất:
              <BarList items={bars} className="mt-2 -mx-1" />
            </div>
          </div>
        </div>
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="ds-h3">Tự phân loại hôm nay</span>
            <Badge tone="brand" icon={Sparkles} size="sm">AI</Badge>
          </div>
          {rows.map((r) => (
            <div key={r.name} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
              <Avatar name={r.name} color={CATEGORIES[r.cat].color} size={30} />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-[550] truncate">{r.name}</div>
                <div className={cn('text-[12px] flex items-center gap-1', r.note.startsWith('Thiếu') ? 'text-warn' : 'text-muted')}>
                  {r.note.startsWith('Thiếu') ? <Clock size={12} /> : <ShieldCheck size={12} />} {r.note}
                </div>
              </div>
              <CategoryTag id={r.cat} className="hidden sm:inline-flex max-w-[150px]" />
              <Money value={r.amount} hideable={false} className="text-[13.5px] font-[550] w-[96px] text-right" />
            </div>
          ))}
        </div>
      </div>
    </MockStage>
  )
}
