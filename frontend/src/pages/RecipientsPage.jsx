import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Users, SearchX } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { useBank } from '@/store'
import { PageHeader, Button, Card, Tabs, SearchInput, Table, THead, Th, Tr, Td, Avatar, Money, Badge, EmptyState } from '@/components/ui'
import { RecipientDrawer } from '@/features/payments/RecipientDrawer'
import { RecipientFormModal } from '@/features/payments/RecipientFormModal'
import { maskAccount, recipientStats } from '@/features/payments/billUtils'

const TABS = [
  { value: 'all', label: 'Tất cả', match: () => true },
  { value: 'business', label: 'Doanh nghiệp', match: (r) => r.type === 'business' },
  { value: 'person', label: 'Cá nhân', match: (r) => r.type === 'person' },
]

export default function RecipientsPage() {
  const [params, setParams] = useSearchParams()
  const { recipients, transactions } = useBank()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const openId = params.get('id')
  const setOpen = (id) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('id', id); else n.delete('id'); return n }, { replace: true })

  const rows = useMemo(() => {
    const t = TABS.find((x) => x.value === tab)
    const s = q.trim().toLowerCase()
    return recipients
      .filter(t.match)
      .filter((r) => !s || `${r.name} ${r.bank} ${r.account} ${r.taxCode || ''} ${r.email || ''}`.toLowerCase().includes(s))
      .map((r) => ({ r, ...recipientStats(r, transactions) }))
      .sort((a, b) => (b.lastPaid || '').localeCompare(a.lastPaid || '') || a.r.name.localeCompare(b.r.name, 'vi'))
  }, [recipients, transactions, tab, q])

  return (
    <div>
      <PageHeader
        title="Người nhận"
        desc="Nhà cung cấp, đối tác và cá nhân bạn thường chuyển tiền."
        actions={<Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Thêm người nhận</Button>}
      />

      <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <Tabs value={tab} onChange={setTab} className="flex-1"
          options={TABS.map((t) => ({ value: t.value, label: t.label, count: recipients.filter(t.match).length }))} />
        <SearchInput value={q} onChange={setQ} placeholder="Tìm tên, số tài khoản, MST" className="sm:w-72" />
      </div>

      <Card padded={false}>
        {rows.length ? (
          <Table minWidth={820}>
            <THead>
              <Th>Người nhận</Th>
              <Th>Ngân hàng</Th>
              <Th>Mã số thuế</Th>
              <Th>Lần thanh toán cuối</Th>
              <Th align="right">Tổng đã trả</Th>
            </THead>
            <tbody>
              {rows.map(({ r, total, lastPaid }) => (
                <Tr key={r.id} onClick={() => setOpen(r.id)} selected={r.id === openId}>
                  <Td>
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={r.name} color={r.color} size={32} square={r.type === 'business'} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button type="button" className="font-[550] truncate rounded-md text-left">{r.name}</button>
                          {r.employee && <Badge size="sm" tone="brand">Nhân viên</Badge>}
                        </div>
                        <div className="ds-caption truncate">{r.email || (r.type === 'business' ? 'Doanh nghiệp' : 'Cá nhân')}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="whitespace-nowrap">{r.bank}</div>
                    <div className="ds-caption num">{maskAccount(r.account)}</div>
                  </Td>
                  <Td className="num text-dim whitespace-nowrap">{r.taxCode || <span className="text-faint">—</span>}</Td>
                  <Td className="whitespace-nowrap">{lastPaid ? formatDate(lastPaid) : <span className="text-faint">Chưa thanh toán</span>}</Td>
                  <Td align="right"><Money value={total} className={total ? 'font-[550]' : 'text-faint'} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : q ? (
          <EmptyState icon={SearchX} title="Không tìm thấy người nhận" desc={`Không có kết quả cho “${q}”. Thử tìm theo số tài khoản hoặc mã số thuế.`}
            action={<Button variant="secondary" onClick={() => setQ('')}>Xoá tìm kiếm</Button>} />
        ) : (
          <EmptyState icon={Users} title="Chưa có người nhận" desc="Thêm nhà cung cấp hoặc đối tác để chuyển tiền nhanh hơn."
            action={<Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>Thêm người nhận</Button>} />
        )}
      </Card>

      <RecipientDrawer id={openId} onClose={() => setOpen(null)} />
      {adding && <RecipientFormModal open onClose={() => setAdding(false)} onSaved={(r) => setOpen(r.id)} />}
    </div>
  )
}
