import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Upload, Mail, Copy, FileText, Paperclip } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { sum } from '@/lib/selectors'
import { useBank, useUI, toast } from '@/store'
import { PageHeader, Button, Card, Tabs, Table, THead, Th, Tr, Td, Avatar, Money, EmptyState } from '@/components/ui'
import { BillDrawer, BillStatus } from '@/features/payments/BillDrawer'
import { UploadBillFlow } from '@/features/payments/UploadBillFlow'
import { BILL_TABS, FORWARD_EMAIL, billState, dueText } from '@/features/payments/billUtils'

function StatCard({ label, value, sub, tone }) {
  return (
    <Card>
      <div className="text-[13px] text-muted">{label}</div>
      <Money value={value} className={cn('block mt-1 text-[24px] font-[500] tracking-tight', tone === 'neg' && value > 0 && 'text-neg')} />
      <div className="ds-caption mt-0.5">{sub}</div>
    </Card>
  )
}

export default function PaymentsPage() {
  const [params, setParams] = useSearchParams()
  const { bills, recipients, team } = useBank()
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const [tab, setTab] = useState('todo')

  const openId = params.get('id')
  const uploading = params.get('tai-len') === '1'
  const setParam = (k, v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set(k, v); else n.delete(k); return n }, { replace: true })

  const stats = useMemo(() => {
    const open = bills.filter((b) => b.status !== 'paid')
    const overdue = open.filter((b) => billState(b).overdue)
    const soon = open.filter((b) => { const { days, overdue: o } = billState(b); return !o && days >= 0 && days <= 7 })
    return { open, overdue, soon }
  }, [bills])

  const current = BILL_TABS.find((t) => t.value === tab)
  const rows = useMemo(() => {
    const list = bills.filter(current.match)
    return tab === 'paid' || tab === 'all'
      ? [...list].sort((a, b) => (a.due < b.due ? 1 : -1))
      : [...list].sort((a, b) => (a.due > b.due ? 1 : -1))
  }, [bills, current, tab])

  const copy = () => { navigator.clipboard?.writeText(FORWARD_EMAIL); toast({ title: 'Đã sao chép địa chỉ email', desc: FORWARD_EMAIL }) }

  return (
    <div>
      <PageHeader
        title="Thanh toán"
        desc="Nhận, duyệt và thanh toán hoá đơn nhà cung cấp ở cùng một nơi."
        actions={<>
          <Button variant="secondary" icon={ArrowLeftRight} onClick={() => openMoveMoney('send')}>Chuyển tiền</Button>
          <Button variant="primary" icon={Upload} onClick={() => setParam('tai-len', '1')}>Tải hoá đơn lên</Button>
        </>}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Tổng phải trả" value={sum(stats.open, (b) => b.amount)} sub={`${stats.open.length} hoá đơn chưa thanh toán`} />
        <StatCard label="Quá hạn" value={sum(stats.overdue, (b) => b.amount)} sub={stats.overdue.length ? `${stats.overdue.length} hoá đơn cần trả ngay` : 'Không có hoá đơn quá hạn'} tone="neg" />
        <StatCard label="Đến hạn trong 7 ngày" value={sum(stats.soon, (b) => b.amount)} sub={`${stats.soon.length} hoá đơn`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-surface px-4 py-2.5">
        <span className="size-7 grid place-items-center rounded-lg bg-brand-50 text-brand-ink shrink-0"><Mail size={15} /></span>
        <span className="text-[13.5px] text-dim">Gửi hoá đơn vào email này để tự động nhập</span>
        <button onClick={copy} className="group inline-flex items-center gap-2 h-7 rounded-lg bg-subtle hover:bg-hover px-2.5 font-mono text-[12.5px] text-fg transition-colors" aria-label={`Sao chép ${FORWARD_EMAIL}`}>
          {FORWARD_EMAIL}<Copy size={13} className="text-faint group-hover:text-fg" />
        </button>
      </div>

      <Tabs value={tab} onChange={setTab} className="mt-6 mb-4"
        options={BILL_TABS.map((t) => ({ value: t.value, label: t.label, count: ['todo', 'review'].includes(t.value) ? bills.filter(t.match).length : undefined }))} />

      <Card padded={false}>
        {rows.length ? (
          <Table minWidth={860}>
            <THead>
              <Th>Người nhận</Th>
              <Th>Số hoá đơn</Th>
              <Th>Hạn thanh toán</Th>
              <Th align="right">Số tiền</Th>
              <Th>Trạng thái</Th>
              <Th>Người yêu cầu</Th>
            </THead>
            <tbody>
              {rows.map((b) => {
                const rc = recipients.find((r) => r.id === b.recipient)
                const req = team.find((m) => m.id === b.requestedBy)
                const due = dueText(b)
                return (
                  <Tr key={b.id} onClick={() => setParam('id', b.id)}>
                    <Td>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={rc?.name} color={rc?.color} size={32} square={rc?.type === 'business'} />
                        <div className="min-w-0 max-w-[260px]">
                          <button type="button" className="block max-w-full font-[550] truncate rounded-md text-left">{rc?.name || 'Người nhận đã xoá'}</button>
                          {b.note && <div className="ds-caption truncate">{b.note}</div>}
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-dim">
                        {b.file ? <Paperclip size={13} className="text-faint" /> : <FileText size={13} className="text-faint" />}{b.number}
                      </span>
                    </Td>
                    <Td>
                      <div className="whitespace-nowrap">{formatDate(b.due)}</div>
                      <div className={cn('text-[12.5px]', due.tone === 'neg' ? 'text-neg font-[550]' : due.tone === 'warn' ? 'text-warn' : due.tone === 'info' ? 'text-info' : 'text-muted')}>{due.text}</div>
                    </Td>
                    <Td align="right"><Money value={b.amount} className="font-[550]" /></Td>
                    <Td><BillStatus bill={b} /></Td>
                    <Td>
                      {req
                        ? <span className="inline-flex items-center gap-2 text-dim"><Avatar name={req.name} color={req.color} size={22} /><span className="truncate">{req.name}</span></span>
                        : <span className="inline-flex items-center gap-1.5 text-faint"><Mail size={13} />Email</span>}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={FileText} title={tab === 'todo' ? 'Không còn hoá đơn cần xử lý' : 'Chưa có hoá đơn'}
            desc={tab === 'todo' ? 'Tuyệt vời — mọi hoá đơn đã được duyệt hoặc lên lịch.' : 'Tải hoá đơn lên hoặc chuyển tiếp email để bắt đầu.'}
            action={<Button variant="primary" icon={Upload} onClick={() => setParam('tai-len', '1')}>Tải hoá đơn lên</Button>} />
        )}
      </Card>

      <BillDrawer id={openId} onClose={() => setParam('id', null)} />
      {uploading && (
        <UploadBillFlow
          onClose={() => setParam('tai-len', null)}
          onCreated={(id) => setParams((p) => { const n = new URLSearchParams(p); n.delete('tai-len'); n.set('id', id); return n }, { replace: true })}
        />
      )}
    </div>
  )
}
