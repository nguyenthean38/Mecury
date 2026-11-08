/* ==========================================================
   Kế toán — Báo cáo kết quả hoạt động kinh doanh (Mẫu B02-DN)
   ========================================================== */
import { Fragment, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { MONTH_SHORT, formatPercent } from '@/lib/format'
import { sum } from '@/lib/selectors'
import { CATEGORIES } from '@/data/transactions'
import { CATEGORY_LEDGER } from '@/data/books'
import { Card, Segmented, Stat, Money } from '@/components/ui'
import { Num, periodOf } from './shared'

const EXPENSE_GROUPS = [
  { key: '641', label: 'Chi phí bán hàng', cats: ['marketing'] },
  { key: '642', label: 'Chi phí quản lý doanh nghiệp', cats: ['payroll', 'rent', 'software', 'utilities', 'contractor', 'office', 'travel', 'meals'] },
]

const stickyCell = 'sticky left-0 z-[1] bg-surface group-hover:bg-subtle transition-colors'

function Row({ label, values, unit, kind = 'normal', code, depth = 0, expandable, open, onToggle, negate }) {
  const strong = kind === 'total' || kind === 'grand'
  const vals = negate ? values.map((v) => -v) : values
  return (
    <tr className={cn('group border-b border-line', kind === 'grand' && 'bg-subtle', expandable && 'cursor-pointer')} onClick={expandable ? onToggle : undefined}>
      <td className={cn(stickyCell, 'h-11 pl-5 pr-3 min-w-[260px] border-r border-line', kind === 'grand' && 'bg-subtle')}>
        <span className="flex items-center gap-1.5" style={{ paddingLeft: depth * 20 }}>
          {expandable ? (
            <button type="button" aria-expanded={open} aria-label={open ? `Thu gọn ${label}` : `Mở rộng ${label}`} onClick={(e) => { e.stopPropagation(); onToggle() }}
              className="size-5 -ml-1 grid place-items-center rounded text-faint hover:text-fg">
              <ChevronRight size={15} className={cn('transition-transform', open && 'rotate-90')} />
            </button>
          ) : depth > 0 ? <span className="w-4" /> : null}
          <span className={cn('text-[13.5px]', strong ? 'font-[600] text-fg' : depth > 1 ? 'text-dim' : 'text-fg')}>{label}</span>
          {code && <span className="font-mono text-[11.5px] text-faint">{code}</span>}
        </span>
      </td>
      {vals.map((v, i) => (
        <td key={i} className={cn('h-11 px-3 text-right text-[13.5px] last:pr-5', strong && 'font-[600]', i === vals.length - 1 && vals.length > 1 && 'bg-subtle/60')}>
          <Num value={v} unit={unit} negTone={!negate} className={negate && kind === 'normal' ? 'text-dim' : ''} />
        </td>
      ))}
    </tr>
  )
}

export function PnLTab({ pnl, period }) {
  const [unit, setUnit] = useState('dong')
  const [open, setOpen] = useState({ '642': true })
  const p = periodOf(period)
  const rows = pnl.filter((r) => p.months.includes(r.month))
  const withTotal = rows.length > 1
  const col = (k) => {
    const vals = rows.map((r) => (typeof k === 'function' ? k(r) : r[k]))
    return withTotal ? [...vals, sum(vals)] : vals
  }
  const groupVal = (g) => (r) => sum(g.cats, (c) => r[c] || 0)

  const revenue = sum(rows, (r) => r.revenue + r.other)
  const ebt = sum(rows, (r) => r.ebt)
  const net = sum(rows, (r) => r.net)
  const opex = sum(rows, (r) => r.opex)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Card className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat label="Tổng doanh thu" value={<Money value={revenue} />} sub={p.caption} />
        <Stat label="Tổng chi phí" value={<Money value={opex} />} sub={`${revenue ? formatPercent((opex / revenue) * 100) : '–'} doanh thu`} />
        <Stat label="Lợi nhuận trước thuế" value={<Money value={ebt} className={ebt < 0 ? 'text-neg' : ''} />} sub={`Biên ${revenue ? formatPercent((ebt / revenue) * 100) : '–'}`} />
        <Stat label="Lợi nhuận sau thuế" value={<Money value={net} className={net < 0 ? 'text-neg' : ''} />} sub="Sau thuế TNDN 20%" />
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="ds-h3">Báo cáo kết quả hoạt động kinh doanh</h3>
            <p className="ds-caption mt-0.5">Mẫu B02-DN · {p.caption} · Đơn vị tính: {unit === 'tr' ? 'triệu đồng' : 'đồng'}</p>
          </div>
          <Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'dong', label: 'Đồng' }, { value: 'tr', label: 'Triệu đồng' }]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 260 + (rows.length + (withTotal ? 1 : 0)) * (unit === 'tr' ? 96 : 140) }}>
            <thead>
              <tr className="border-b border-line">
                <th className={cn(stickyCell, 'h-10 pl-5 pr-3 text-left text-[12.5px] font-[550] text-muted border-r border-line')}>Chỉ tiêu</th>
                {rows.map((r) => <th key={r.month} className="h-10 px-3 text-right text-[12.5px] font-[550] text-muted whitespace-nowrap last:pr-5">{MONTH_SHORT[r.month - 1]}{r.month === 11 && <span className="text-faint font-normal"> (đến 8/11)</span>}</th>)}
                {withTotal && <th className="h-10 px-3 pr-5 text-right text-[12.5px] font-[600] text-fg bg-subtle/60">Tổng</th>}
              </tr>
            </thead>
            <tbody>
              <Row label="Doanh thu thuần về bán hàng và cung cấp dịch vụ" code="511" values={col('revenue')} unit={unit} />
              <Row label="Doanh thu hoạt động tài chính" code="515" values={col('other')} unit={unit} />
              <Row label="Tổng doanh thu" kind="total" values={col((r) => r.revenue + r.other)} unit={unit} />
              <Row label="Chi phí" kind="total" values={col('opex')} unit={unit} negate />
              {EXPENSE_GROUPS.map((g) => (
                <Fragment key={g.key}>
                  <Row label={g.label} code={g.key} depth={1} values={col(groupVal(g))} unit={unit} negate
                    expandable={g.cats.length > 1} open={!!open[g.key]} onToggle={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))} />
                  {g.cats.length > 1 && open[g.key] && g.cats.map((c) => (
                    <Row key={c} label={CATEGORIES[c].label} code={CATEGORY_LEDGER[c]} depth={2} values={col(c)} unit={unit} negate />
                  ))}
                </Fragment>
              ))}
              <Row label="Lợi nhuận kế toán trước thuế" kind="total" values={col('ebt')} unit={unit} />
              <Row label="Chi phí thuế TNDN hiện hành (20%)" code="8211" values={col('cit')} unit={unit} negate />
              <Row label="Lợi nhuận sau thuế thu nhập doanh nghiệp" kind="grand" values={col('net')} unit={unit} />
            </tbody>
          </table>
        </div>
        <p className="ds-caption px-5 py-3 border-t border-line">
          Số trong ngoặc là chi phí hoặc số âm. Doanh thu đã loại thuế GTGT 8%; tháng 11 tạm tính đến ngày 08/11/2026.
        </p>
      </Card>
    </div>
  )
}
