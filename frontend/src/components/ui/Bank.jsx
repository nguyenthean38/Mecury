/* ==========================================================
   Thành phần riêng cho nghiệp vụ ngân hàng
   ========================================================== */
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, CreditCard, Landmark, PiggyBank, Wallet, Receipt, Percent, Wifi, Snowflake } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MERCHANTS, CATEGORIES, txName } from '@/data/transactions'
import { Avatar, DynIcon } from './Display'
import { useUI, useBank } from '@/store'

/** Avatar cho giao dịch: chuyển nội bộ dùng biểu tượng, còn lại dùng chữ cái đầu theo màu đối tác */
export function TxAvatar({ tx, size = 32 }) {
  if (tx.method === 'internal') {
    return <span className="inline-grid place-items-center rounded-full bg-subtle text-muted border border-line shrink-0" style={{ width: size, height: size }}><ArrowLeftRight size={size * 0.45} /></span>
  }
  if (tx.method === 'interest') {
    return <span className="inline-grid place-items-center rounded-full bg-gold-soft text-gold shrink-0" style={{ width: size, height: size }}><Percent size={size * 0.45} /></span>
  }
  return <MerchantAvatar tx={tx} size={size} />
}

function MerchantAvatar({ tx, size }) {
  const rc = useBank((s) => (tx.recipient ? s.recipients.find((r) => r.id === tx.recipient) : null))
  const color = MERCHANTS[tx.merchant]?.color || rc?.color || '#6b7280'
  return <Avatar name={txName(tx)} color={color} size={size} />
}

/** Chip danh mục: biểu tượng + tên */
export function CategoryTag({ id, className, empty = 'Chưa phân loại' }) {
  const c = CATEGORIES[id]
  if (!c) return <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-faint italic', className)}>{empty}</span>
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px] text-dim min-w-0', className)}>
      <span className="size-5 rounded-md grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}>
        <DynIcon name={c.icon} size={12} strokeWidth={2.2} />
      </span>
      <span className="truncate">{c.label}</span>
    </span>
  )
}

/** Biểu tượng loại tài khoản */
export function AccountIcon({ kind, color = '#138f66', size = 34 }) {
  const Icon = { checking: Wallet, savings: PiggyBank, tax: Landmark, payroll: Receipt, credit: CreditCard }[kind] || Wallet
  return (
    <span className="inline-grid place-items-center rounded-[10px] shrink-0" style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 14%, var(--c-surface))`, color }}>
      <Icon size={size * 0.48} strokeWidth={1.9} />
    </span>
  )
}

/** Mũi tên hướng tiền */
export function FlowArrow({ value, size = 14 }) {
  return value >= 0
    ? <ArrowDownLeft size={size} className="text-pos" />
    : <ArrowUpRight size={size} className="text-neg" />
}

const CARD_STYLES = {
  jade: 'from-[#0f6e51] via-[#13916a] to-[#1fae80] text-white',
  ink: 'from-[#121815] via-[#1d2924] to-[#2b3a33] text-white',
  sky: 'from-[#1f4f8f] via-[#3d72c4] to-[#79a6e8] text-white',
  sand: 'from-[#e9dcc4] via-[#f3eadb] to-[#fbf6ec] text-[#3b3226]',
}
export const CARD_STYLE_KEYS = Object.keys(CARD_STYLES)

/**
 * Hình thẻ thanh toán. Hiển thị tên, 4 số cuối, loại thẻ.
 * frozen: phủ lớp băng mờ.
 */
export function PaymentCard({ card, holder, className, size = 'md', showNumber }) {
  const hide = useUI((s) => s.hideBalances)
  const style = CARD_STYLES[card.style] || CARD_STYLES.jade
  const w = size === 'sm' ? 'w-[200px] h-[126px] p-3.5 rounded-xl' : size === 'lg' ? 'w-full max-w-[380px] aspect-[1.586] p-6 rounded-2xl' : 'w-[300px] h-[189px] p-5 rounded-2xl'
  const dim = card.status === 'cancelled'
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br shadow-md select-none', style, w, dim && 'grayscale opacity-60', className)}>
      {/* họa tiết sóng */}
      <svg className="absolute -right-8 -bottom-10 opacity-[.16] w-[85%]" viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1.2">
        {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M0 ${30 + i * 10} C 40 ${10 + i * 10}, 70 ${55 + i * 10}, 110 ${30 + i * 10} S 170 ${5 + i * 10}, 200 ${30 + i * 10}`} />)}
      </svg>
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          {/* thẻ do ngân hàng của doanh nghiệp phát hành — Mạch chỉ quản lý */}
          <div className="flex items-center gap-1.5">
            <Landmark size={size === 'sm' ? 13 : 17} strokeWidth={2.2} className="opacity-90" />
            <span className={cn('font-[700] tracking-tight', size === 'sm' ? 'text-[11.5px]' : 'text-[14px]')}>Thịnh An</span>
            <span className={cn('font-[500] uppercase tracking-[.14em] opacity-70', size === 'sm' ? 'text-[7.5px]' : 'text-[9.5px]')}>Business</span>
          </div>
          <span className={cn('rounded-md px-1.5 py-0.5 font-[600] uppercase tracking-wider', size === 'sm' ? 'text-[8.5px]' : 'text-[10px]', card.style === 'sand' ? 'bg-black/5' : 'bg-white/15')}>
            {card.type === 'virtual' ? 'Thẻ ảo' : 'Thẻ vật lý'}
          </span>
        </div>
        {size !== 'sm' && card.type === 'physical' && (
          <div className="flex items-center gap-2">
            <span className="w-9 h-7 rounded-md bg-gradient-to-br from-[#f3d98b] to-[#c9a24a] opacity-90" />
            <Wifi size={18} className="rotate-90 opacity-70" />
          </div>
        )}
        <div>
          <div className={cn('num font-[550] tracking-[0.12em]', size === 'sm' ? 'text-[12px]' : 'text-[16px]')}>
            {showNumber && !hide ? `5284 61${card.last4.slice(0, 2)} 3307 ${card.last4}` : `•••• ${card.last4}`}
          </div>
          <div className="flex items-end justify-between mt-1.5">
            <span className={cn('truncate opacity-85', size === 'sm' ? 'text-[10.5px]' : 'text-[12.5px]')}>{holder || card.nickname}</span>
            <span className={cn('font-[700] italic tracking-tight', size === 'sm' ? 'text-[12px]' : 'text-[16px]')}>DEBIT</span>
          </div>
        </div>
      </div>
      {card.status === 'frozen' && (
        <div className="absolute inset-0 grid place-items-center bg-[rgba(220,236,250,.38)] backdrop-blur-[2px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 text-[#1f4f8f] px-3 py-1 text-[12px] font-[650]"><Snowflake size={14} /> Đang tạm khoá</span>
        </div>
      )}
    </div>
  )
}
