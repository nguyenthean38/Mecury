/* ==========================================================
   Thành phần nhỏ dùng chung cho ngân sách nhóm
   ========================================================== */
import { Check, Receipt, CreditCard, Tag } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND } from '@/lib/format'
import { CATEGORIES } from '@/data/transactions'
import { DynIcon, PICKABLE_ICONS, AvatarStack, Progress, Money, Badge } from '@/components/ui'
import { BUDGET_COLORS, PERIOD_LABEL, usagePct } from './budgetUtils'

/** Ô biểu tượng ngân sách tô theo màu ngân sách */
export function BudgetIcon({ icon, color = '#138f66', size = 40, className }) {
  return (
    <span className={cn('inline-grid place-items-center rounded-xl shrink-0', className)}
      style={{ width: size, height: size, background: `color-mix(in srgb, ${color} 15%, var(--c-surface))`, color }}>
      <DynIcon name={icon} size={Math.round(size * 0.48)} strokeWidth={1.9} />
    </span>
  )
}

/** Chọn biểu tượng + màu cho ngân sách */
export function IconColorPicker({ icon, color, onIcon, onColor }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] font-[550] text-dim">Biểu tượng & màu</div>
      <div className="grid grid-cols-8 gap-1.5" role="radiogroup" aria-label="Biểu tượng">
        {PICKABLE_ICONS.map((name) => {
          const on = name === icon
          return (
            <button key={name} type="button" role="radio" aria-checked={on} aria-label={name} onClick={() => onIcon(name)}
              className={cn('aspect-square rounded-[10px] grid place-items-center border transition-[border,background,box-shadow]',
                on ? 'border-transparent ring-2' : 'border-line hover:bg-subtle text-muted')}
              style={on ? { background: `color-mix(in srgb, ${color} 15%, var(--c-surface))`, color, '--tw-ring-color': color } : undefined}>
              <DynIcon name={name} size={17} strokeWidth={1.9} />
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu">
        {BUDGET_COLORS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={c === color} aria-label={`Màu ${c}`} onClick={() => onColor(c)}
            className={cn('size-7 rounded-full grid place-items-center ring-offset-2 ring-offset-surface transition-shadow', c === color && 'ring-2')}
            style={{ background: c, '--tw-ring-color': c }}>
            {c === color && <Check size={14} strokeWidth={3} className="text-white" />}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Thẻ xem trước ngân sách (cột phải của luồng tạo) */
export function BudgetPreview({ f, team }) {
  const people = team.filter((m) => f.members.includes(m.id))
  const b = { ...f, spent: 0 }
  return (
    <div className="p-10 pt-14">
      <div className="ds-label mb-3">Xem trước</div>
      <div className="card p-6 shadow-md">
        <div className="flex items-start gap-3.5">
          <BudgetIcon icon={f.icon} color={f.color} size={46} />
          <div className="min-w-0 flex-1">
            <div className="ds-h2 truncate">{f.name || <span className="text-faint">Tên ngân sách</span>}</div>
            <div className="ds-caption mt-0.5">{PERIOD_LABEL[f.period]} · {people.length} thành viên</div>
          </div>
          <Badge tone="pos" dot>Đang hoạt động</Badge>
        </div>
        {f.desc && <p className="text-[13.5px] text-muted mt-4">{f.desc}</p>}
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-muted">Đã chi</span>
            <span className="text-[13px] text-muted">Hạn mức</span>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <Money value={0} className="text-[22px] font-[500]" hideable={false} />
            <Money value={f.limit} className="text-[15px] font-[550]" hideable={false} />
          </div>
          <Progress value={usagePct(b)} className="mt-3" height={8} />
        </div>
        <div className="mt-6 pt-5 border-t border-line flex items-center justify-between gap-3">
          {people.length ? <AvatarStack people={people} max={5} /> : <span className="ds-caption">Chưa chọn thành viên</span>}
          {people.some((p) => f.memberLimits?.[p.id]) && <span className="ds-caption">Có hạn mức riêng</span>}
        </div>
        <div className="mt-5 flex flex-wrap gap-1.5">
          {f.receiptRequired && <Badge icon={Receipt}>Bắt buộc chứng từ</Badge>}
          {f.autoCard && <Badge tone="brand" icon={CreditCard}>Tự cấp thẻ ảo</Badge>}
          {f.categories?.length
            ? f.categories.slice(0, 3).map((c) => <Badge key={c} icon={Tag}>{CATEGORIES[c]?.label}</Badge>)
            : <Badge icon={Tag}>Mọi danh mục</Badge>}
          {f.categories?.length > 3 && <Badge>+{f.categories.length - 3}</Badge>}
        </div>
      </div>
      <p className="ds-caption mt-4 text-center">
        {f.limit ? `Thành viên có thể chi tối đa ${formatVND(f.limit)} ${f.period === 'Trọn đời' ? 'trong suốt ngân sách' : 'mỗi ' + f.period.toLowerCase()}.` : 'Đặt hạn mức để giới hạn tổng chi của nhóm.'}
      </p>
    </div>
  )
}
