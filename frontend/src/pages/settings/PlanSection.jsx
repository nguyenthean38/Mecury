/* Gói dịch vụ — /cai-dat/goi-dich-vu */
import { useState } from 'react'
import { Check, Download, Crown, Landmark } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, formatVND, TODAY } from '@/lib/format'
import { COMPANY } from '@/data/org'
import { PLANS } from '@/data/workspace'
import { useBank, toast } from '@/store'
import { Badge, Button, Card, CardHeader, Confirm, IconButton, KeyValue, Progress, Segmented, Table, THead, Th, Tr, Td } from '@/components/ui'
import { SectionHeader } from './shared'

const YEARLY_OFF = 0.2
const priceOf = (p, cycle) => (cycle === 'year' ? Math.round(p.price * (1 - YEARLY_OFF)) : p.price)

/** Lịch sử thanh toán phí 6 tháng gần nhất */
const BILLING = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1)
  const net = 490000
  return { id: `MACH-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-0${42 - i}`, date: d, period: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`, amount: Math.round(net * 1.08) }
})

export function PlanSection() {
  const team = useBank((s) => s.team)
  const cards = useBank((s) => s.cards)
  const invoices = useBank((s) => s.invoices)
  const [plan, setPlan] = useState(COMPANY.plan)
  const [cycle, setCycle] = useState('month')
  const [target, setTarget] = useState(null)
  const current = PLANS.find((p) => p.id === plan)
  const rank = (id) => PLANS.findIndex((p) => p.id === id)

  const usage = [
    { label: 'Thành viên', used: team.length, max: plan === 'free' ? 3 : plan === 'growth' ? 50 : null },
    { label: 'Thẻ đang dùng', used: cards.filter((c) => c.status !== 'cancelled').length, max: plan === 'free' ? 5 : null },
    { label: 'Hoá đơn bán ra tháng này', used: invoices.filter((i) => new Date(i.issued).getMonth() === TODAY.getMonth()).length, max: plan === 'free' ? 20 : null },
    { label: 'Lượt dùng trợ lý AI', used: 1240, max: plan === 'scale' ? null : plan === 'growth' ? 5000 : 200 },
    { label: 'Lưu trữ chứng từ', used: 2.4, max: plan === 'free' ? 2 : plan === 'growth' ? 20 : 200, unit: 'GB' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Gói dịch vụ" desc="Chuyển khoản trong nước và tài khoản thanh toán luôn miễn phí. Gói trả phí mở khoá công cụ cho đội lớn hơn." />

      <Card className="bg-gradient-to-br from-brand-50 to-surface">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="size-11 shrink-0 grid place-items-center rounded-xl bg-brand-500 text-white dark:text-[#06140f]"><Crown size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="ds-caption">Gói hiện tại</div>
            <div className="ds-h2">{current.name}</div>
            <div className="ds-caption mt-0.5">{current.price ? `${formatVND(priceOf(current, cycle))}/tháng · gia hạn ngày 01/12/2026` : 'Miễn phí trọn đời'}</div>
          </div>
          <KeyValue className="sm:w-[300px]" items={[
            { label: 'Thanh toán bằng', value: <span className="inline-flex items-center gap-1.5"><Landmark size={14} className="text-faint" />Thanh toán chính ••2502</span> },
            { label: 'Hoá đơn VAT gửi tới', value: COMPANY.email },
          ]} />
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="ds-h3">So sánh các gói</h3>
        <Segmented size="sm" value={cycle} onChange={setCycle} options={[{ value: 'month', label: 'Theo tháng' }, { value: 'year', label: 'Theo năm · tiết kiệm 20%' }]} />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {PLANS.map((p) => {
          const on = p.id === plan
          const up = rank(p.id) > rank(plan)
          return (
            <Card key={p.id} padded={false} className={cn('p-5 flex flex-col gap-4', on && 'border-brand-400 ring-[3px] ring-brand-100')}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="ds-h3">{p.name}</span>
                  {on && <Badge tone="brand" size="sm">Đang dùng</Badge>}
                  {p.id === 'growth' && !on && <Badge tone="gold" size="sm">Phổ biến</Badge>}
                </div>
                <p className="ds-caption mt-1">{p.tag}</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-[26px] font-[500] tracking-tight num">{p.price ? formatNumber(priceOf(p, cycle)) : '0'}</span>
                <span className="text-muted text-[13px]">₫/tháng</span>
              </div>
              <ul className="flex flex-col gap-2 text-[13.5px] flex-1">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check size={15} className="text-pos mt-0.5 shrink-0" />{f}</li>)}
              </ul>
              <Button variant={on ? 'secondary' : up ? 'primary' : 'outline'} disabled={on} onClick={() => setTarget(p)}>
                {on ? 'Gói hiện tại' : up ? `Nâng lên ${p.name}` : `Chuyển về ${p.name}`}
              </Button>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader title="Mức sử dụng" desc={`Chu kỳ hiện tại: 01/11/2026 – 30/11/2026`} />
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {usage.map((u) => (
            <div key={u.label}>
              <div className="flex items-baseline justify-between gap-2 text-[13.5px]">
                <span className="text-dim">{u.label}</span>
                <span className="num font-[550]">
                  {u.used.toLocaleString('vi-VN')}{u.unit ? ` ${u.unit}` : ''}
                  <span className="text-muted font-normal"> / {u.max ? `${formatNumber(u.max)}${u.unit ? ' ' + u.unit : ''}` : 'Không giới hạn'}</span>
                </span>
              </div>
              <Progress className="mt-2" value={u.max ? u.used : 4} max={u.max || 100} tone={u.max ? undefined : 'brand'} />
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0"><CardHeader title="Lịch sử thanh toán phí" /></div>
        <Table minWidth={560}>
          <THead><Th>Số hoá đơn</Th><Th>Kỳ</Th><Th>Ngày thanh toán</Th><Th align="right">Số tiền (gồm VAT 8%)</Th><Th>Trạng thái</Th><Th width={48}><span className="sr-only">Tải</span></Th></THead>
          <tbody>
            {BILLING.map((b) => (
              <Tr key={b.id}>
                <Td className="font-mono text-[12.5px]">{b.id}</Td>
                <Td>{b.period}</Td>
                <Td className="num text-dim">{formatDate(b.date)}</Td>
                <Td align="right" className="num">{formatVND(b.amount)}</Td>
                <Td><Badge tone="pos" dot>Đã thanh toán</Badge></Td>
                <Td align="right"><IconButton size="sm" icon={Download} label={`Tải hoá đơn ${b.id}`} onClick={() => toast({ title: 'Đã tải hoá đơn', desc: `${b.id}.pdf` })} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Confirm open={!!target} onClose={() => setTarget(null)} danger={target && rank(target.id) < rank(plan)}
        confirmLabel={target && rank(target.id) > rank(plan) ? 'Nâng cấp ngay' : 'Xác nhận chuyển gói'}
        title={target ? `Chuyển sang gói ${target.name}?` : ''}
        desc={target && (rank(target.id) > rank(plan)
          ? `Bạn được dùng ngay các tính năng mới. Phí ${formatVND(priceOf(target, cycle))}/tháng, phần chênh lệch tháng này được tính theo số ngày còn lại.`
          : `Gói mới áp dụng từ 01/12/2026. Một số tính năng như ${current.features[current.features.length - 1].toLowerCase()} sẽ ngừng hoạt động.`)}
        onConfirm={() => { setPlan(target.id); toast({ title: `Đã chuyển sang gói ${target.name}`, desc: 'Hoá đơn phí sẽ gửi tới email kế toán.', tone: 'pos' }) }} />
    </div>
  )
}
