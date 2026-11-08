/* ==========================================================
   Hoá đơn bán ra — công nợ phải thu
   ?tao=1 mở luồng tạo hoá đơn (có thể kèm &khach=<id>), ?id=<id> mở chi tiết
   ========================================================== */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Palette, FileText, Repeat, Users, Package } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, daysBetween, TODAY } from '@/lib/format'
import { INVOICE_STATUS, invoiceTotals } from '@/data/invoicing'
import { useBank } from '@/store'
import {
  PageHeader, Button, Card, Stat, Money, Tabs, SearchInput, Select, Table, THead, Th, Tr, Td, Avatar, StatusBadge, EmptyState,
} from '@/components/ui'
import { InvoiceDrawer } from '@/features/invoicing/InvoiceDrawer'
import { CreateInvoice } from '@/features/invoicing/CreateInvoice'
import { TemplateModal } from '@/features/invoicing/TemplateModal'
import { OPEN_STATUSES, displayStatus, isOverdue, receivableStats } from '@/features/invoicing/helpers'

const TABS = [
  { value: 'all', label: 'Tất cả', test: () => true },
  { value: 'draft', label: 'Nháp', test: (i) => i.status === 'draft' },
  { value: 'open', label: 'Đang chờ thanh toán', test: (i) => (OPEN_STATUSES.includes(i.status) || i.status === 'scheduled') && !isOverdue(i) },
  { value: 'overdue', label: 'Quá hạn', test: isOverdue },
  { value: 'paid', label: 'Đã thanh toán', test: (i) => i.status === 'paid' },
]

export default function InvoicesPage() {
  const invoices = useBank((s) => s.invoices)
  const customers = useBank((s) => s.customers)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [cust, setCust] = useState('')
  const [tpl, setTpl] = useState(false)

  const openId = params.get('id')
  const creating = params.get('tao') === '1'
  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)))
    setParams(next, { replace: true })
  }

  const custById = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c])), [customers])
  const stats = useMemo(() => receivableStats(invoices), [invoices])
  const sorted = useMemo(() => [...invoices].sort((a, b) => (b.issued > a.issued ? 1 : b.issued < a.issued ? -1 : b.number.localeCompare(a.number))), [invoices])
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, invoices.filter(t.test).length])), [invoices])
  const rows = sorted.filter((i) => {
    if (!TABS.find((t) => t.value === tab).test(i)) return false
    if (cust && i.customer !== cust) return false
    if (q) {
      const c = custById[i.customer]
      const hay = `${i.number} ${c?.name || ''} ${c?.contact || ''} ${invoiceTotals(i).total}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const filtered = q || cust || tab !== 'all'

  return (
    <div>
      <PageHeader
        title="Hoá đơn bán ra"
        desc="Lập hoá đơn, gửi link thanh toán VietQR và theo dõi công nợ phải thu."
        actions={<>
          <Button variant="outline" icon={Palette} onClick={() => setTpl(true)}>Tuỳ chỉnh mẫu</Button>
          <Button variant="primary" icon={Plus} onClick={() => setParam({ tao: '1' })}>Tạo hoá đơn</Button>
        </>}
      />

      <Card className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x divide-line mb-6">
        <Stat label="Chưa thu" className="sm:pr-6" value={<Money value={stats.openTotal} />} sub={`${stats.openCount} hoá đơn đang mở`} />
        <Stat label="Quá hạn" className="sm:px-6" value={<Money value={stats.overdueTotal} className={stats.overdueTotal ? 'text-neg' : ''} />} sub={stats.overdueCount ? `${stats.overdueCount} hoá đơn cần nhắc khách` : 'Không có hoá đơn quá hạn'} />
        <Stat label="Đã thu 30 ngày" className="sm:pl-6" value={<Money value={stats.collected} />} sub={`Từ ${stats.collectedCount} hoá đơn`} />
      </Card>

      <div className="flex flex-wrap gap-1 mb-3 -ml-2.5">
        <Button size="sm" variant="ghost" icon={Users} to="/hoa-don/khach-hang">Khách hàng</Button>
        <Button size="sm" variant="ghost" icon={Package} to="/hoa-don/danh-muc">Sản phẩm & dịch vụ</Button>
      </div>

      <Tabs value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.value, label: t.label, count: counts[t.value] }))} className="mb-4" />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm số hoá đơn, khách hàng, số tiền" className="sm:max-w-[340px]" />
        <Select size="sm" value={cust} onChange={(e) => setCust(e.target.value)} placeholder="Tất cả khách hàng" aria-label="Lọc theo khách hàng"
          className="sm:w-[240px] [&>div]:h-9" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
      </div>

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          filtered
            ? <EmptyState icon={FileText} title="Không có hoá đơn phù hợp" desc="Thử đổi bộ lọc hoặc từ khoá tìm kiếm."
              action={<Button size="sm" variant="secondary" onClick={() => { setQ(''); setCust(''); setTab('all') }}>Xoá bộ lọc</Button>} />
            : <EmptyState icon={FileText} title="Chưa có hoá đơn nào" desc="Tạo hoá đơn đầu tiên và gửi link thanh toán cho khách chỉ trong một phút."
              action={<Button variant="primary" icon={Plus} onClick={() => setParam({ tao: '1' })}>Tạo hoá đơn</Button>} />
        ) : (
          <Table minWidth={860}>
            <THead>
              <Th>Số hoá đơn</Th>
              <Th>Khách hàng</Th>
              <Th>Ngày lập</Th>
              <Th>Hạn</Th>
              <Th align="right">Tổng tiền</Th>
              <Th align="right">Còn phải thu</Th>
              <Th>Trạng thái</Th>
            </THead>
            <tbody>
              {rows.map((i) => {
                const c = custById[i.customer]
                const { total, due } = invoiceTotals(i)
                const over = isOverdue(i)
                const late = daysBetween(i.due, TODAY)
                const dead = i.status === 'void'
                return (
                  <Tr key={i.id} onClick={() => setParam({ id: i.id })} selected={openId === i.id}>
                    <Td>
                      <button className="font-mono text-[12.5px] font-[550] hover:text-brand-ink inline-flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); setParam({ id: i.id }) }}>
                        {i.number}
                        {i.recurring && <Repeat size={12} className="text-faint" aria-label="Lặp lại hằng tháng" />}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={c?.name || '?'} color={c?.color} size={28} square />
                        <div className="min-w-0">
                          <div className={cn('truncate max-w-[240px] font-[520]', dead && 'text-muted')}>{c?.name || 'Khách hàng đã xoá'}</div>
                          {c?.contact && <div className="ds-caption truncate max-w-[240px]">{c.contact}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-dim whitespace-nowrap num">{formatDate(i.issued)}</Td>
                    <Td className="whitespace-nowrap">
                      <span className={cn('num', over ? 'text-neg font-[550]' : 'text-dim')}>{formatDate(i.due)}</span>
                      {over && <div className="text-[11.5px] text-neg">Quá {late} ngày</div>}
                    </Td>
                    <Td align="right"><Money value={total} strike={dead} className={dead ? 'text-muted' : ''} /></Td>
                    <Td align="right">{dead || i.status === 'paid' ? <span className="text-faint">—</span> : <Money value={due} className={cn('font-[550]', over && 'text-neg')} />}</Td>
                    <Td><StatusBadge map={INVOICE_STATUS} value={displayStatus(i)} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>
      {rows.length > 0 && <p className="ds-caption mt-3">{rows.length} hoá đơn</p>}

      {openId && <InvoiceDrawer id={openId} onClose={() => setParam({ id: null })} onOpen={(id) => setParam({ id })} />}
      {creating && (
        <CreateInvoice
          preset={{ customer: params.get('khach') || undefined }}
          onClose={() => setParam({ tao: null, khach: null })}
          onView={(id) => setParam({ tao: null, khach: null, id })}
        />
      )}
      {tpl && <TemplateModal open onClose={() => setTpl(false)} />}
    </div>
  )
}
