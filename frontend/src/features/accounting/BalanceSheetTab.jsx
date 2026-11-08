/* ==========================================================
   Kế toán — Bảng cân đối kế toán (Mẫu B01-DN, rút gọn)
   ========================================================== */
import { Fragment, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { BALANCE_SHEET } from '@/data/books'
import { Card, Segmented, Stat, Money, Badge } from '@/components/ui'
import { Num } from './shared'

const add = (a, b) => a.map((v, i) => v + b[i])
const zero = () => BALANCE_SHEET.months.map(() => 0)
const sectionTotal = (s) => s.rows.reduce((acc, r) => add(acc, r.values), zero())

const sticky = 'sticky left-0 z-[1] bg-surface border-r border-line'

function Line({ label, code, values, unit, kind = 'row' }) {
  const strong = kind !== 'row'
  const bg = kind === 'grand' ? 'bg-subtle' : ''
  return (
    <tr className={cn('border-b border-line', bg)}>
      <td className={cn(sticky, bg, 'h-11 pl-5 pr-3 min-w-[280px]')}>
        <span className={cn('flex items-center gap-2', kind === 'row' && 'pl-5')}>
          <span className={cn('text-[13.5px]', strong ? 'font-[600]' : 'text-fg', kind === 'grand' && 'uppercase tracking-wide text-[12.5px]')}>{label}</span>
          {code && <span className="font-mono text-[11.5px] text-faint">{code}</span>}
        </span>
      </td>
      {values.map((v, i) => (
        <td key={i} className={cn('h-11 px-3 last:pr-5 text-right text-[13.5px]', strong && 'font-[600]', i === values.length - 1 && 'text-fg')}>
          <Num value={v} unit={unit} />
        </td>
      ))}
    </tr>
  )
}

export function BalanceSheetTab() {
  const [unit, setUnit] = useState('dong')
  const { months, sections } = BALANCE_SHEET
  const [stA, ltA, liab, eq] = sections
  const totals = sections.map(sectionTotal)
  const assets = add(totals[0], totals[1])
  const sources = add(totals[2], totals[3])
  const diffs = assets.map((v, i) => v - sources[i])
  const last = months.length - 1
  const debtRatio = totals[3][last] ? totals[2][last] / totals[3][last] : 0

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Card className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Stat label="Tổng tài sản" value={<Money value={assets[last]} />} sub={`Tại ngày ${months[last]}/2026`} />
        <Stat label="Nợ phải trả" value={<Money value={totals[2][last]} />} sub="Ngắn hạn" />
        <Stat label="Vốn chủ sở hữu" value={<Money value={totals[3][last]} />} sub="Gồm lợi nhuận chưa phân phối" />
        <Stat label="Hệ số nợ / vốn chủ" value={<span className="num">{debtRatio.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}</span>} sub="Dưới 1 là an toàn" />
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-line">
          <div>
            <h3 className="ds-h3">Bảng cân đối kế toán</h3>
            <p className="ds-caption mt-0.5">Mẫu B01-DN rút gọn · số dư cuối kỳ · Đơn vị tính: {unit === 'tr' ? 'triệu đồng' : 'đồng'}</p>
          </div>
          <Segmented size="sm" value={unit} onChange={setUnit} options={[{ value: 'dong', label: 'Đồng' }, { value: 'tr', label: 'Triệu đồng' }]} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: 280 + months.length * (unit === 'tr' ? 100 : 140) }}>
            <thead>
              <tr className="border-b border-line">
                <th className={cn(sticky, 'h-10 pl-5 pr-3 text-left text-[12.5px] font-[550] text-muted')}>Chỉ tiêu</th>
                {months.map((m, i) => (
                  <th key={m} className={cn('h-10 px-3 last:pr-5 text-right text-[12.5px] font-[550] whitespace-nowrap', i === last ? 'text-fg' : 'text-muted')}>{m}/2026</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[stA, ltA].map((s, si) => (
                <Fragment key={s.title}>
                  <Line kind="section" label={`${si === 0 ? 'A' : 'B'}. ${s.title}`} values={totals[si]} unit={unit} />
                  {s.rows.map((r) => <Line key={r.code} label={r.name} code={r.code} values={r.values} unit={unit} />)}
                </Fragment>
              ))}
              <Line kind="grand" label="Tổng cộng tài sản" code="270" values={assets} unit={unit} />
              {[liab, eq].map((s, k) => (
                <Fragment key={s.title}>
                  <Line kind="section" label={`${k === 0 ? 'C' : 'D'}. ${s.title}`} values={totals[k + 2]} unit={unit} />
                  {s.rows.map((r) => <Line key={r.code} label={r.name} code={r.code} values={r.values} unit={unit} />)}
                </Fragment>
              ))}
              <Line kind="grand" label="Tổng cộng nguồn vốn" code="440" values={sources} unit={unit} />
              <tr>
                <td className={cn(sticky, 'h-12 pl-5 pr-3 text-[13px] text-muted')}>Kiểm tra: Tổng tài sản = Tổng nguồn vốn</td>
                {diffs.map((d, i) => (
                  <td key={i} className="h-12 px-3 last:pr-5 text-right">
                    {Math.round(d) === 0
                      ? <Badge tone="pos" icon={CheckCircle2}>Khớp</Badge>
                      : <Badge tone="warn" icon={AlertTriangle}><span title={`Chênh lệch ${formatNumber(d)} ₫`}>Lệch {formatNumber(Math.abs(d))}</span></Badge>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="ds-caption px-5 py-3 border-t border-line">
          Số liệu cuối tháng lấy sau khi khoá sổ; cột 08/11 là số tạm tính. Chênh lệch (nếu có) thường do bút toán khoá sổ chưa ghi — kiểm tra ở tab Bút toán.
        </p>
      </Card>
    </div>
  )
}
