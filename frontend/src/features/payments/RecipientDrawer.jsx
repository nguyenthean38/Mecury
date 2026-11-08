/* ==========================================================
   Ngăn kéo chi tiết người nhận: thông tin, hoá đơn đang mở, lịch sử thanh toán
   ========================================================== */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, MailQuestion, Pencil, Trash2, MoreHorizontal, Copy, Building2, User, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useBank, useUI, toast } from '@/store'
import { Drawer, Button, IconButton, Popover, Menu, Confirm, KeyValue, Avatar, Badge, Money } from '@/components/ui'
import { TxList } from '@/features/transactions/TxList'
import { TxDrawer } from '@/features/transactions/TxDrawer'
import { RecipientFormModal } from './RecipientFormModal'
import { BillStatus } from './BillDrawer'
import { dueText, recipientStats } from './billUtils'

export function RecipientDrawer({ id, onClose }) {
  const navigate = useNavigate()
  const r = useBank((s) => s.recipients.find((x) => x.id === id))
  const { transactions, bills, remove } = useBank()
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [txId, setTxId] = useState(null)
  const stats = useMemo(() => (r ? recipientStats(r, transactions) : null), [r, transactions])
  if (!r) return <Drawer open={!!id} onClose={onClose} title="Không tìm thấy người nhận" />
  const openBills = bills.filter((b) => b.recipient === r.id && b.status !== 'paid')

  const copy = (t) => { navigator.clipboard?.writeText(t); toast('Đã sao chép số tài khoản') }
  const del = () => {
    remove('recipients', r.id)
    toast({ title: 'Đã xoá người nhận', desc: r.name })
    onClose()
  }

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={520}
      header={
        <div className="flex items-start gap-3.5">
          <Avatar name={r.name} color={r.color} size={44} square={r.type === 'business'} />
          <div className="min-w-0">
            <div className="text-[15px] font-[600] leading-snug truncate">{r.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge size="sm" icon={r.type === 'business' ? Building2 : User}>{r.type === 'business' ? 'Doanh nghiệp' : 'Cá nhân'}</Badge>
              {r.employee && <Badge size="sm" tone="brand">Nhân viên</Badge>}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" icon={Send} onClick={() => openMoveMoney('send', { recipient: r.id })}>Chuyển tiền</Button>
          <Button variant="secondary" icon={MailQuestion} onClick={() => toast({ title: 'Đã gửi yêu cầu cập nhật', desc: r.email ? `Đường dẫn cập nhật đã gửi tới ${r.email}.` : 'Người nhận chưa có email — hãy thêm email trước.', tone: r.email ? undefined : 'info' })}>
            Yêu cầu cập nhật thông tin
          </Button>
          <Popover align="end" width={200} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác khác" variant="secondary" />}>
            {(close) => <Menu onClose={close} items={[
              { label: 'Sửa thông tin', icon: Pencil, onClick: () => setEditing(true) },
              { divider: true },
              { label: 'Xoá người nhận', icon: Trash2, danger: true, onClick: () => setDeleting(true) },
            ]} />}
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-subtle px-4 py-3">
            <div className="text-[12.5px] text-muted">Tổng đã trả</div>
            <Money value={stats.total} className="block mt-0.5 text-[18px] font-[550]" />
          </div>
          <div className="rounded-xl bg-subtle px-4 py-3">
            <div className="text-[12.5px] text-muted">Lần thanh toán cuối</div>
            <div className="mt-0.5 text-[18px] font-[550]">{stats.lastPaid ? formatDate(stats.lastPaid) : <span className="text-faint">Chưa có</span>}</div>
          </div>
        </div>

        <KeyValue items={[
          { label: 'Ngân hàng', value: r.bank },
          { label: 'Số tài khoản', value: <button onClick={() => copy(r.account)} className="inline-flex items-center gap-1.5 font-mono text-[12.5px] hover:text-brand-ink">{r.account}<Copy size={12} /></button> },
          { label: 'Chủ tài khoản', value: r.holder || '—' },
          r.type === 'business' && { label: 'Mã số thuế', value: r.taxCode || '—' },
          { label: 'Email', value: r.email || <span className="text-faint">Chưa có</span> },
        ]} />

        {openBills.length > 0 && (
          <div>
            <div className="ds-label mb-2">Hoá đơn đang mở</div>
            <div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
              {openBills.map((b) => {
                const due = dueText(b)
                return (
                  <button key={b.id} onClick={() => navigate('/thanh-toan?id=' + b.id)} className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-subtle">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[12.5px]">{b.number}</div>
                      <div className={cn('text-[12.5px]', due.tone === 'neg' ? 'text-neg' : due.tone === 'warn' ? 'text-warn' : 'text-muted')}>{due.text}</div>
                    </div>
                    <BillStatus bill={b} />
                    <Money value={b.amount} className="text-[13.5px] font-[550] w-32 text-right" />
                    <ChevronRight size={16} className="text-faint group-hover:text-fg" />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="ds-label mb-2">Lịch sử thanh toán</div>
          <div className="rounded-xl border border-line overflow-hidden">
            <TxList transactions={stats.history.slice(0, 12)} onSelect={(t) => setTxId(t.id)} showCategory={false} showAccount={false} empty="Chưa thanh toán lần nào" />
          </div>
          {stats.history.length > 12 && (
            <p className="ds-caption mt-2">Đang hiện 12 giao dịch gần nhất trong tổng số {stats.history.length}.</p>
          )}
        </div>
      </div>

      {editing && <RecipientFormModal open initial={r} onClose={() => setEditing(false)} />}
      <Confirm open={deleting} onClose={() => setDeleting(false)} onConfirm={del} danger confirmLabel="Xoá người nhận"
        title={`Xoá ${r.name}?`} desc={openBills.length ? `Người nhận còn ${openBills.length} hoá đơn chưa thanh toán. Lịch sử giao dịch vẫn được giữ lại.` : 'Lịch sử giao dịch vẫn được giữ lại. Bạn có thể thêm lại người nhận bất cứ lúc nào.'} />
      <TxDrawer id={txId} onClose={() => setTxId(null)} />
    </Drawer>
  )
}
