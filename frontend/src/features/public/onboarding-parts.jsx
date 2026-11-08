/* ==========================================================
   Thành phần phụ cho luồng "Thiết lập doanh nghiệp"
   - GroupLabel: nhãn cho một nhóm điều khiển
   - Chips: nhóm lựa chọn dạng viên thuốc (một hoặc nhiều)
   - BankTile: ô chọn ngân hàng để kết nối (mô phỏng)
   ========================================================== */
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar, Badge } from '@/components/ui'

/** Nhãn cho một nhóm điều khiển (không phải ô nhập đơn) */
export function GroupLabel({ id, children, optional, hint }) {
  return (
    <div className="mb-2">
      <div id={id} className="text-[13px] font-[550] text-dim">
        {children} {optional && <span className="font-normal text-faint">(không bắt buộc)</span>}
      </div>
      {hint && <p className="ds-caption mt-0.5">{hint}</p>}
    </div>
  )
}

/** options: [{ value, label }] · multiple: value là mảng */
export function Chips({ options, value, onChange, multiple, labelledBy, className }) {
  const isOn = (v) => (multiple ? value.includes(v) : value === v)
  const toggle = (v) => {
    if (!multiple) return onChange(v)
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  }
  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-labelledby={labelledBy} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((o) => {
        const on = isOn(o.value)
        return (
          <button key={o.value} type="button" onClick={() => toggle(o.value)}
            {...(multiple ? { 'aria-pressed': on } : { role: 'radio', 'aria-checked': on })}
            className={cn('inline-flex items-center gap-1.5 h-9 rounded-full border px-3.5 text-[13.5px] font-[520] transition-[background,border,color]',
              on ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line-strong bg-surface text-dim hover:border-faint hover:text-fg')}>
            {multiple && <span className={cn('size-4 rounded-full grid place-items-center transition-colors', on ? 'bg-brand-500 text-white dark:text-[#06140f]' : 'bg-subtle')}>{on && <Check size={11} strokeWidth={3} />}</span>}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------------- Ngân hàng ---------------- */
const BANK_COLORS = ['#138f66', '#4f7fe0', '#c2588a', '#d99a2b', '#7a6fd6', '#3f8f8a', '#e07a5f', '#59a7b8']
/** Băm chuỗi ổn định — dùng để sinh màu / số mô phỏng theo tên ngân hàng */
export const bankHash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
export const bankColor = (name) => BANK_COLORS[bankHash(name) % BANK_COLORS.length]
/** "Ngân hàng Thịnh An" → "Thịnh An" (để lấy chữ cái đầu) */
export const bankShort = (name) => name.replace(/^Ngân hàng\s+/i, '')

/** status: undefined | 'connecting' | 'connected' */
export function BankTile({ name, selected, status, onToggle }) {
  const busy = status === 'connecting'
  const done = status === 'connected'
  const on = selected || done
  return (
    <button type="button" aria-pressed={on} disabled={busy || done} onClick={onToggle}
      className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[border,background,box-shadow] disabled:cursor-default',
        done ? 'border-transparent bg-pos-soft' : on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
      <Avatar name={bankShort(name)} color={bankColor(name)} size={34} square />
      <span className="min-w-0 flex-1 text-[13.5px] font-[550] text-fg truncate">{name}</span>
      {done ? (
        <Badge tone="pos" size="sm" icon={Check}>Đã kết nối</Badge>
      ) : busy ? (
        <span className="inline-flex items-center gap-1 text-[12px] text-muted shrink-0"><Loader2 size={13} className="animate-spin" /> Đang kết nối…</span>
      ) : (
        <span className={cn('size-[18px] shrink-0 rounded-full border-2 grid place-items-center transition-colors', on ? 'bg-brand-500 border-brand-500 text-white dark:text-[#06140f]' : 'border-line-strong')}>
          {on && <Check size={11} strokeWidth={3} />}
        </span>
      )}
    </button>
  )
}
