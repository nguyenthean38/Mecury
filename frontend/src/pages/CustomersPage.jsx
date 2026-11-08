/* ==========================================================
   Khách hàng — danh sách, công nợ theo từng khách
   ========================================================== */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Users, FilePlus2, Pencil, Trash2, Mail, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { INVOICE_STATUS, invoiceTotals } from '@/data/invoicing'
import { useBank, toast } from '@/store'
import {
  PageHeader, Button, Card, Money, SearchInput, Table, THead, Th, Tr, Td, Avatar, EmptyState, Drawer, KeyValue, StatusBadge, Confirm, Callout,
} from '@/components/ui'
import { CustomerModal } from '@/features/invoicing/CustomerForm'
import { OPEN_STATUSES, displayStatus, isOverdue, paymentsOf } from '@/features/invoicing/helpers'

/** Số liệu công nợ của một khách từ danh sách hoá đơn */
function summarize(invoices) {
  const live = invoices.filter((i) => i.status !== 'void')
  const open = live.filter((i) => OPEN_STATUSES.includes(i.status))
  return {
    count: live.length,
    paid: live.reduce((s, i) => s + paymentsOf(i).reduce((a, p) => a + p.amount, 0), 0),
    due: open.reduce((s, i) => s + invoiceTotals(i).due, 0),
    overdue: open.filter(isOverdue).reduce((s, i) => s + invoiceTotals(i).due, 0),
  }
}

function CustomerDrawer({ customer, invoices, onClose, onEdit, onDelete }) {
  const navigate = useNavigate()
  const s = summarize(invoices)
  const list = [...invoices].sort((a, b) => (b.issued > a.issued ? 1 : -1))
  return (
    <Drawer open onClose={onClose} width={520} title={customer.name}
      header={
        <div className="flex items-start gap-3.5">
          <Avatar name={customer.name} color={customer.color} size={44} square />
          <div className="min-w-0">
            <div className="text-[15px] font-[600] leading-snug">{customer.name}</div>
            <div className="ds-caption mt-0.5">Khách hàng từ {formatDate(customer.since)}</div>
          </div>
        </div>
      }
      footer={<>
        <Button variant="primary" icon={FilePlus2} onClick={() => navigate(`/hoa-don?tao=1&khach=${customer.id}`)}>Tạo hoá đơn</Button>
        <Button variant="secondary" icon={Pencil} onClick={onEdit}>Sửa</Button>
        <div className="flex-1" />
        <Button variant="ghost" icon={Trash2} className="text-neg hover:text-neg" onClick={onDelete}>Xoá</Button>
      </>}
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-subtle p-3">
            <div className="ds-caption">Đã thu</div>
            <Money value={s.paid} className="text-[16px] font-[550]" />
          </div>
          <div className="rounded-xl bg-subtle p-3">
            <div className="ds-caption">Còn nợ</div>
            <Money value={s.due} className="text-[16px] font-[550]" />
          </div>
          <div className={cn('rounded-xl p-3', s.overdue ? 'bg-neg-soft' : 'bg-subtle')}>
            <div className={cn('ds-caption', s.overdue && 'text-neg')}>Quá hạn</div>
            <Money value={s.overdue} className={cn('text-[16px] font-[550]', s.overdue && 'text-neg')} />
          </div>
        </div>

        <KeyValue items={[
          { label: 'Người liên hệ', value: customer.contact },
          { label: 'Email', value: customer.email ? <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-ink"><Mail size={13} className="text-faint" />{customer.email}</a> : null },
          { label: 'Mã số thuế', value: customer.taxCode ? <span className="num">{customer.taxCode}</span> : null },
          { label: 'Địa chỉ', value: customer.address },
        ]} />

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="ds-h3">Hoá đơn</h3>
            <span className="ds-caption">{invoices.length} hoá đơn</span>
          </div>
          {list.length === 0 ? (
            <EmptyState compact icon={FilePlus2} title="Chưa có hoá đơn" desc="Tạo hoá đơn đầu tiên cho khách hàng này." />
          ) : (
            <div className="flex flex-col -mx-2">
              {list.map((i) => (
                <button key={i.id} onClick={() => navigate('/hoa-don?id=' + i.id)} className="group flex items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-subtle">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12.5px] font-[550]">{i.number}</div>
                    <div className="ds-caption">Lập {formatDate(i.issued)} · hạn {formatDate(i.due)}</div>
                  </div>
                  <div className="text-right">
                    <Money value={invoiceTotals(i).total} className="text-[13.5px] font-[550]" strike={i.status === 'void'} />
                    <div className="mt-0.5"><StatusBadge map={INVOICE_STATUS} value={displayStatus(i)} /></div>
                  </div>
                  <ChevronRight size={16} className="text-faint group-hover:text-fg shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}

export default function CustomersPage() {
  const customers = useBank((s) => s.customers)
  const invoices = useBank((s) => s.invoices)
  const remove = useBank((s) => s.remove)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [editing, setEditing] = useState(null) // null | {} (thêm) | customer (sửa)
  const [deleting, setDeleting] = useState(null)

  const byCustomer = useMemo(() => {
    const m = {}
    invoices.forEach((i) => { (m[i.customer] ||= []).push(i) })
    return m
  }, [invoices])
  const rows = customers
    .filter((c) => `${c.name} ${c.contact} ${c.email} ${c.taxCode}`.toLowerCase().includes(q.trim().toLowerCase()))
    .map((c) => ({ ...c, s: summarize(byCustomer[c.id] || []) }))
  const totals = useMemo(() => summarize(invoices), [invoices])
  const open = customers.find((c) => c.id === openId)

  const doDelete = () => {
    remove('customers', deleting.id)
    if (openId === deleting.id) setOpenId(null)
    toast({ title: 'Đã xoá khách hàng', desc: deleting.name })
  }

  return (
    <div>
      <PageHeader
        title="Khách hàng"
        desc="Thông tin xuất hoá đơn và công nợ của từng khách hàng."
        actions={<Button variant="primary" icon={UserPlus} onClick={() => setEditing({})}>Thêm khách hàng</Button>}
      />

      <Card className="grid grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-line mb-6">
        <div className="sm:pr-6"><div className="text-[13px] text-muted">Khách hàng</div><div className="mt-1 text-[22px] font-[500] num">{customers.length}</div></div>
        <div className="sm:px-6"><div className="text-[13px] text-muted">Tổng công nợ</div><div className="mt-1 text-[18px] sm:text-[22px] font-[500]"><Money value={totals.due} /></div></div>
        <div className="sm:pl-6"><div className="text-[13px] text-muted">Đã thu</div><div className="mt-1 text-[18px] sm:text-[22px] font-[500]"><Money value={totals.paid} /></div></div>
      </Card>

      <SearchInput value={q} onChange={setQ} placeholder="Tìm tên, người liên hệ, email hoặc MST" className="sm:max-w-[360px] mb-4" />

      <Card padded={false} className="overflow-hidden">
        {rows.length === 0 ? (
          q
            ? <EmptyState icon={Users} title="Không tìm thấy khách hàng" desc={`Không có khách hàng nào khớp với “${q}”.`} action={<Button size="sm" variant="secondary" onClick={() => setQ('')}>Xoá tìm kiếm</Button>} />
            : <EmptyState icon={Users} title="Chưa có khách hàng" desc="Thêm khách hàng để lập hoá đơn nhanh hơn." action={<Button variant="primary" icon={UserPlus} onClick={() => setEditing({})}>Thêm khách hàng</Button>} />
        ) : (
          <Table minWidth={900}>
            <THead>
              <Th>Khách hàng</Th>
              <Th>Liên hệ</Th>
              <Th>Mã số thuế</Th>
              <Th align="right">Số hoá đơn</Th>
              <Th align="right">Đã thu</Th>
              <Th align="right">Còn nợ</Th>
            </THead>
            <tbody>
              {rows.map((c) => (
                <Tr key={c.id} onClick={() => setOpenId(c.id)} selected={openId === c.id}>
                  <Td>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={c.name} color={c.color} size={30} square />
                      <span className="font-[550] truncate max-w-[260px]">{c.name}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="truncate max-w-[220px]">{c.contact || <span className="text-faint">—</span>}</div>
                    <div className="ds-caption truncate max-w-[220px]">{c.email}</div>
                  </Td>
                  <Td className="num text-dim whitespace-nowrap">{c.taxCode || '—'}</Td>
                  <Td align="right" className="num">{c.s.count}</Td>
                  <Td align="right"><Money value={c.s.paid} /></Td>
                  <Td align="right">
                    {c.s.due ? <Money value={c.s.due} className={cn('font-[550]', c.s.overdue && 'text-neg')} /> : <span className="text-faint">—</span>}
                    {c.s.overdue > 0 && <div className="text-[11.5px] text-neg">Có khoản quá hạn</div>}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {open && (
        <CustomerDrawer customer={open} invoices={byCustomer[open.id] || []} onClose={() => setOpenId(null)}
          onEdit={() => setEditing(open)} onDelete={() => setDeleting(open)} />
      )}
      <CustomerModal open={!!editing} initial={editing} onClose={() => setEditing(null)} onSaved={(c) => !editing?.id && setOpenId(c.id)} />
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} onConfirm={doDelete} danger confirmLabel="Xoá khách hàng"
        title={`Xoá ${deleting?.name}?`} desc="Khách hàng sẽ bị xoá khỏi danh sách. Hoá đơn đã lập vẫn được giữ lại trong sổ.">
        {deleting && summarize(byCustomer[deleting.id] || []).due > 0 && (
          <Callout tone="warn">Khách hàng này còn nợ chưa thu. Bạn vẫn theo dõi được các hoá đơn trong trang Hoá đơn bán ra.</Callout>
        )}
      </Confirm>
    </div>
  )
}
