/* Thành phần hiển thị cho trang Phân tích: nhận định, chênh lệch kỳ trước */
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPercent } from '@/lib/format'
import { useUI } from '@/store'
import { DynIcon } from '@/components/ui'
import { words } from './compute'

const CHIP_TONE = {
  brand: 'bg-brand-50 text-brand-ink',
  pos: 'bg-pos-soft text-pos',
  neg: 'bg-neg-soft text-neg',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
}
const ICON_TONE = { pos: 'bg-pos-soft text-pos', warn: 'bg-warn-soft text-warn', info: 'bg-info-soft text-info', neg: 'bg-neg-soft text-neg' }

function Part({ p, hide }) {
  if (typeof p === 'string') return p
  if (p.chip) {
    if (p.color) {
      return <span className="inline-flex items-center rounded-md px-1.5 py-px text-[12.5px] font-[600] whitespace-nowrap" style={{ background: `color-mix(in srgb, ${p.color} 14%, transparent)`, color: `color-mix(in srgb, ${p.color} 78%, var(--c-fg))` }}>{p.chip}</span>
    }
    return <span className={cn('inline-flex items-center rounded-md px-1.5 py-px text-[12.5px] font-[650] num whitespace-nowrap', CHIP_TONE[p.tone] || CHIP_TONE.brand)}>{p.chip}</span>
  }
  if (p.money != null) return <span className="num font-[600] text-fg whitespace-nowrap">{hide ? '••••' : words(p.money)}{p.suffix || ''}</span>
  if (p.strong) return <b className="font-[600] text-fg">{p.strong}</b>
  return null
}

export function InsightList({ items }) {
  const hide = useUI((s) => s.hideBalances)
  return (
    <div className="flex flex-col">
      {items.map((it) => (
        <div key={it.id} className="flex gap-3 py-3.5 border-b border-line last:border-0 first:pt-0 animate-fade-in">
          <span className={cn('size-8 shrink-0 grid place-items-center rounded-lg', ICON_TONE[it.tone] || ICON_TONE.info)}>
            <DynIcon name={it.icon} size={16} />
          </span>
          <div className="min-w-0 text-[13.5px] leading-[1.7] text-dim">
            {it.parts.map((p, i) => <Part key={i} p={p} hide={hide} />)}
            {it.action && (
              <Link to={it.action.to} className="mt-1 flex items-center gap-0.5 w-fit text-[13px] font-[550] text-brand-ink hover:underline underline-offset-4">
                {it.action.label}<ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      ))}
      <p className="mt-3 flex items-center gap-1.5 ds-caption"><Sparkles size={13} className="text-brand-ink" />Nhận định được tạo tự động, có thể chưa chính xác.</p>
    </div>
  )
}

/** Chênh lệch so với kỳ trước. goodWhenUp = false cho tiền ra (tăng là xấu). */
export function Delta({ cur, prev, goodWhenUp = true }) {
  if (!prev) return <span className="ds-caption">Chưa có dữ liệu kỳ trước</span>
  const pct = ((cur - prev) / Math.abs(prev)) * 100
  const up = pct >= 0
  const good = up === goodWhenUp
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px]">
      <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 h-5 font-[600] num', good ? 'bg-pos-soft text-pos' : 'bg-neg-soft text-neg')}>
        <Icon size={12} strokeWidth={2.4} />{formatPercent(Math.abs(pct))}
      </span>
      <span className="text-muted">so với kỳ trước</span>
    </span>
  )
}
