import { cn } from '@/lib/cn'
import { PaymentCard } from '@/components/ui'

/** Hình thẻ thu nhỏ (dùng PaymentCard size sm rồi thu nhỏ) cho bảng và bộ chọn màu */
export function CardThumb({ card, scale = 0.24, className }) {
  const w = Math.round(200 * scale), h = Math.round(126 * scale)
  return (
    <span aria-hidden className={cn('relative block shrink-0 overflow-hidden rounded-[5px] shadow-xs', className)} style={{ width: w, height: h }}>
      <span className="absolute left-0 top-0 origin-top-left pointer-events-none" style={{ transform: `scale(${scale})` }}>
        <PaymentCard card={card} size="sm" className="shadow-none" />
      </span>
    </span>
  )
}
