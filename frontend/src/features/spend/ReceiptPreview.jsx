/* ==========================================================
   Hoá đơn / biên lai giả lập để xem trước chứng từ
   (không có ảnh thật trong bản demo nên vẽ lại dạng giấy in nhiệt)
   ========================================================== */
import { FileQuestion, ScanLine } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber } from '@/lib/format'
import { CATEGORIES } from '@/data/transactions'

/** Mép răng cưa của giấy in */
function Zigzag({ flip }) {
  return (
    <svg viewBox="0 0 120 6" preserveAspectRatio="none" className={cn('block w-full h-[7px] text-surface', flip && 'rotate-180')} aria-hidden>
      <path d={`M0 6 ${Array.from({ length: 20 }, (_, i) => `L${i * 6 + 3} 0 L${i * 6 + 6} 6`).join(' ')} Z`} fill="currentColor" />
    </svg>
  )
}

export function ReceiptPreview({ merchant, amount = 0, date, category, file, scanning, className, emptyTitle = 'Chưa có chứng từ', emptyDesc = 'Yêu cầu này được nộp không kèm hoá đơn.' }) {
  if (!file && !scanning) {
    return (
      <div className={cn('rounded-xl border border-dashed border-line-strong bg-subtle grid place-items-center text-center px-6 py-10', className)}>
        <div>
          <span className="mx-auto size-11 rounded-full bg-surface border border-line grid place-items-center text-muted"><FileQuestion size={20} /></span>
          <div className="mt-3 text-[13.5px] font-[550]">{emptyTitle}</div>
          <div className="ds-caption mt-0.5">{emptyDesc}</div>
        </div>
      </div>
    )
  }
  const vat = Math.round(amount - amount / 1.08)
  const lines = [
    { name: CATEGORIES[category]?.label || 'Hàng hoá, dịch vụ', qty: 1, price: amount - vat },
  ]
  const code = (merchant || 'MACH').normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'HD'
  return (
    <div className={cn('rounded-xl bg-subtle border border-line px-6 py-6 sm:px-10 dot-grid', className)}>
      <div className="relative mx-auto max-w-[300px] drop-shadow-[0_8px_18px_rgba(20,24,22,.12)]">
        <Zigzag flip />
        <div className="bg-surface px-5 py-4 font-mono text-[11.5px] leading-relaxed text-dim">
          <div className="text-center">
            <div className="text-[13px] font-[700] text-fg uppercase tracking-wide break-words">{merchant || <span className="skeleton inline-block h-3.5 w-36 align-middle" />}</div>
            <div className="text-faint">MST 03•• ••• •••</div>
            <div className="text-faint">TP. Hồ Chí Minh</div>
          </div>
          <div className="my-3 border-t border-dashed border-line-strong" />
          <div className="flex justify-between"><span>HOÁ ĐƠN BÁN LẺ</span><span>#{code}-{String(amount % 10000).padStart(4, '0')}</span></div>
          <div className="flex justify-between"><span>Ngày</span><span>{date ? formatDate(date) : '—'}</span></div>
          <div className="my-3 border-t border-dashed border-line-strong" />
          {lines.map((l) => (
            <div key={l.name}>
              <div className="truncate">{l.name}</div>
              <div className="flex justify-between text-faint"><span>{l.qty} x {formatNumber(l.price)}</span><span className="text-dim">{formatNumber(l.price)}</span></div>
            </div>
          ))}
          <div className="flex justify-between mt-1.5"><span>Thuế GTGT 8%</span><span>{formatNumber(vat)}</span></div>
          <div className="my-3 border-t border-dashed border-line-strong" />
          <div className="flex justify-between text-[13px] font-[700] text-fg"><span>TỔNG CỘNG</span><span>{formatNumber(amount)} ₫</span></div>
          <div className="mt-4 text-center text-faint">Cảm ơn quý khách!</div>
          <div className="mt-2 flex justify-center gap-[2px]" aria-hidden>
            {Array.from({ length: 34 }).map((_, i) => <span key={i} className="h-6 bg-fg/70" style={{ width: (i * 7) % 3 === 0 ? 2 : 1 }} />)}
          </div>
        </div>
        <Zigzag />
        {scanning && (
          <div className="absolute inset-0 overflow-hidden rounded-sm" aria-hidden>
            <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-brand-300/35 to-transparent animate-[scan_1.2s_ease-in-out_infinite]" />
            <style>{'@keyframes scan{0%{top:-15%}100%{top:100%}}'}</style>
          </div>
        )}
      </div>
      {file && (
        <div className="mt-4 flex items-center justify-center gap-1.5 ds-caption">
          <ScanLine size={13} />{typeof file === 'string' ? file : file.name}
        </div>
      )}
    </div>
  )
}
