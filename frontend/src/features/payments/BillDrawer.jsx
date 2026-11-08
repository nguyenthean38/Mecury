/* ==========================================================
   Ngăn kéo chi tiết hoá đơn phải trả: bản hoá đơn + thông tin + duyệt + hành động
   ========================================================== */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Clock, Send, Banknote, CalendarX, MoreHorizontal, CircleCheck, Trash2, Download, ExternalLink, Mail, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY, formatDate, readVND } from '@/lib/format'
import { useBank, toast } from '@/store'
import { BILL_STATUS } from '@/data/payments'
import { Drawer, Button, IconButton, Popover, Menu, Confirm, KeyValue, Avatar, Badge, StatusBadge, Money, CategoryTag, Callout } from '@/components/ui'
import { InvoicePaper } from './InvoicePaper'
import { PayBillModal } from './PayBillModal'
import { FORWARD_EMAIL, billState, displayStatus, dueText } from './billUtils'

const todayISO = () => TODAY.toISOString().slice(0, 10)

export function BillStatus({ bill }) {
  if (bill.status === 'review' && bill.approved) return <Badge tone="brand" dot>Đã duyệt</Badge>
  return <StatusBadge map={BILL_STATUS} value={displayStatus(bill)} />
}

function Timeline({ bill, team }) {
  const who = (id) => team.find((m) => m.id === id)?.name
  const approved = bill.approved || ['scheduled', 'paid'].includes(bill.status)
  const steps = [
    { label: 'Đã nhận hoá đơn', sub: bill.requestedBy ? `${who(bill.requestedBy)} tải lên · ${formatDate(bill.issued)}` : `Nhận qua ${FORWARD_EMAIL}`, state: 'done' },
    bill.status === 'draft'
      ? { label: 'Cần bổ sung thông tin', sub: 'Kiểm tra lại rồi gửi duyệt', state: 'current' }
      : { label: approved ? 'Đã duyệt' : 'Chờ duyệt', sub: approved ? `${who(bill.approvedBy) || 'Nguyễn Minh Anh'}${bill.approvedAt ? ' · ' + formatDate(bill.approvedAt) : ''}` : 'Nguyễn Minh Anh hoặc Trần Quốc Bảo (cần 1 người)', state: approved ? 'done' : 'current' },
    bill.status === 'scheduled'
      ? { label: 'Đã lên lịch', sub: `Mạch tự chuyển ngày ${formatDate(bill.scheduledFor)}${bill.recurring ? ' · ' + bill.recurring.toLowerCase() : ''}`, state: 'current' }
      : { label: 'Đã thanh toán', sub: bill.status === 'paid' ? (bill.paidAt ? formatDate(bill.paidAt) : '') : 'Chưa thanh toán', state: bill.status === 'paid' ? 'done' : 'todo' },
  ]
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3">
          {i < steps.length - 1 && <span className={cn('absolute left-[11px] top-6 bottom-[-16px] w-px', steps[i + 1].state === 'done' ? 'bg-brand-300' : 'bg-line')} />}
          <span className={cn('relative z-[1] size-6 shrink-0 rounded-full grid place-items-center border',
            s.state === 'done' ? 'bg-brand-500 border-brand-500 text-white dark:text-[#06140f]' : s.state === 'current' ? 'bg-warn-soft border-warn text-warn' : 'bg-surface border-line-strong text-faint')}>
            {s.state === 'done' ? <Check size={13} strokeWidth={3} /> : <Clock size={12} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <div className={cn('text-[13.5px] font-[550]', s.state === 'todo' && 'text-muted')}>{s.label}</div>
            <div className="ds-caption">{s.sub}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function BillDrawer({ id, onClose }) {
  const navigate = useNavigate()
  const bill = useBank((s) => s.bills.find((b) => b.id === id))
  const { recipients, team, accounts, update, remove } = useBank()
  const [pay, setPay] = useState(null) // 'now' | 'later'
  const [confirm, setConfirm] = useState(null) // 'delete' | 'unschedule'
  if (!bill) return <Drawer open={!!id} onClose={onClose} title="Không tìm thấy hoá đơn" />
  const rc = recipients.find((r) => r.id === bill.recipient)
  const requester = team.find((m) => m.id === bill.requestedBy)
  const fromAcc = accounts.find((a) => a.id === bill.fromAccount)
  const due = dueText(bill)
  const { overdue } = billState(bill)
  const canPay = bill.status !== 'paid' && bill.status !== 'draft'

  const approve = () => {
    update('bills', bill.id, { approved: true, approvedBy: 'u1', approvedAt: todayISO() })
    toast({ title: 'Đã duyệt hoá đơn', desc: `${bill.number} sẵn sàng thanh toán.` })
  }
  const submit = () => {
    update('bills', bill.id, { status: 'review', requestedBy: bill.requestedBy || 'u1' })
    toast({ title: 'Đã gửi duyệt', desc: 'Người duyệt đã nhận được thông báo.' })
  }
  const unschedule = () => {
    update('bills', bill.id, { status: 'review', approved: true, scheduledFor: null })
    toast({ title: 'Đã huỷ lịch thanh toán', desc: bill.number })
  }
  const markPaid = () => {
    const prev = { status: bill.status, paidAt: bill.paidAt || null }
    update('bills', bill.id, { status: 'paid', paidAt: todayISO(), approved: true })
    toast({ title: 'Đã đánh dấu đã trả', desc: 'Không tạo giao dịch chuyển tiền.', action: { label: 'Hoàn tác', onClick: () => update('bills', bill.id, prev) } })
  }
  const del = () => {
    remove('bills', bill.id)
    toast({ title: 'Đã xoá hoá đơn', desc: bill.number })
    onClose()
  }

  const more = [
    bill.status !== 'paid' && { label: 'Đánh dấu đã trả', icon: CircleCheck, desc: 'Đã trả bên ngoài Mạch', onClick: markPaid },
    { label: 'Tải hoá đơn gốc', icon: Download, onClick: () => toast({ title: 'Đã tải hoá đơn', desc: bill.file || `${bill.number}.pdf` }) },
    bill.status !== 'paid' && { divider: true },
    bill.status !== 'paid' && { label: 'Xoá hoá đơn', icon: Trash2, danger: true, onClick: () => setConfirm('delete') },
  ]

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={980}
      header={
        <div className="flex items-start gap-3.5">
          <Avatar name={rc?.name} color={rc?.color} size={44} square={rc?.type === 'business'} />
          <div className="min-w-0">
            <div className="text-[15px] font-[600] leading-snug truncate">{rc?.name || 'Người nhận đã xoá'}</div>
            <div className="ds-caption mt-0.5">Hoá đơn {bill.number} · phát hành {formatDate(bill.issued)}</div>
          </div>
        </div>
      }
      footer={<>
        <Popover align="start" width={240} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác khác" variant="secondary" />}>
          {(close) => <Menu onClose={close} items={more} />}
        </Popover>
        <div className="flex-1" />
        {bill.status === 'draft' && <Button variant="primary" icon={Send} onClick={submit}>Gửi duyệt</Button>}
        {bill.status === 'review' && !bill.approved && <>
          <Button variant="secondary" icon={Banknote} onClick={() => setPay('now')}>Thanh toán</Button>
          <Button variant="primary" icon={Check} onClick={approve}>Duyệt</Button>
        </>}
        {((bill.status === 'review' && bill.approved) || bill.status === 'overdue') && <>
          <Button variant="secondary" icon={CalendarClock} onClick={() => setPay('later')} className="hidden sm:inline-flex">Hẹn ngày trả</Button>
          <Button variant="primary" icon={Banknote} onClick={() => setPay('now')}>Thanh toán</Button>
        </>}
        {bill.status === 'scheduled' && <>
          <Button variant="secondary" icon={CalendarX} onClick={() => setConfirm('unschedule')}>Huỷ lịch</Button>
          <Button variant="primary" icon={Banknote} onClick={() => setPay('now')}>Thanh toán ngay</Button>
        </>}
        {bill.status === 'paid' && (bill.tx
          ? <Button variant="secondary" iconRight={ExternalLink} onClick={() => navigate('/giao-dich?id=' + bill.tx)}>Xem giao dịch</Button>
          : <Button variant="secondary" icon={Download} onClick={() => toast({ title: 'Đã tải uỷ nhiệm chi', desc: `unc-${bill.number}.pdf` })}>Uỷ nhiệm chi</Button>)}
      </>}
    >
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-6 lg:gap-8">
        <div className="rounded-2xl bg-subtle border border-line p-4 sm:p-6 self-start">
          <InvoicePaper bill={bill} recipient={rc} />
          {bill.file && <div className="ds-caption text-center mt-3">{bill.file}</div>}
        </div>

        <div className="flex flex-col gap-6 min-w-0">
          <div>
            <BillStatus bill={bill} />
            <div className="mt-3 text-[34px] font-[480] tracking-tight leading-none"><Money value={bill.amount} /></div>
            <p className="ds-caption mt-2 italic">{readVND(bill.amount)}</p>
            <p className={cn('mt-2 text-[13.5px] font-[550]', due.tone === 'neg' ? 'text-neg' : due.tone === 'warn' ? 'text-warn' : due.tone === 'info' ? 'text-info' : 'text-muted')}>{due.text}</p>
          </div>

          {overdue && <Callout tone="neg" title="Hoá đơn đã quá hạn">Thanh toán sớm để tránh phí trễ hạn và giữ quan hệ tốt với {rc?.name}.</Callout>}
          {bill.status === 'draft' && <Callout tone="neutral" icon={Mail}>Hoá đơn được nhập tự động. Kiểm tra lại số tiền và hạn thanh toán trước khi gửi duyệt.</Callout>}

          <KeyValue items={[
            { label: 'Số hoá đơn', value: <span className="font-mono text-[12.5px]">{bill.number}</span> },
            { label: 'Ngày phát hành', value: formatDate(bill.issued) },
            { label: 'Hạn thanh toán', value: formatDate(bill.due) },
            bill.scheduledFor && bill.status === 'scheduled' && { label: 'Ngày chuyển', value: formatDate(bill.scheduledFor) },
            { label: 'Danh mục', value: <CategoryTag id={bill.category} /> },
            { label: 'Thuế GTGT', value: `${bill.vat || 0}%` },
            requester && { label: 'Người yêu cầu', value: <span className="inline-flex items-center gap-2"><Avatar name={requester.name} color={requester.color} size={20} />{requester.name}</span> },
            fromAcc && { label: 'Tài khoản trả', value: `${fromAcc.name} ••${fromAcc.last4}` },
            bill.recurring && { label: 'Lặp lại', value: bill.recurring },
            { label: 'Ghi chú', value: bill.note || '—' },
          ]} />

          <div className="rounded-xl border border-line p-4">
            <div className="text-[13px] font-[550] text-dim mb-3">Phê duyệt</div>
            <Timeline bill={bill} team={team} />
          </div>
          {!canPay && bill.status === 'draft' && <p className="ds-caption -mt-2">Gửi duyệt để có thể thanh toán hoá đơn này.</p>}
        </div>
      </div>

      {pay && <PayBillModal bill={bill} recipient={rc} open mode={pay} onClose={() => setPay(null)} />}
      <Confirm open={confirm === 'delete'} onClose={() => setConfirm(null)} onConfirm={del} danger confirmLabel="Xoá hoá đơn"
        title="Xoá hoá đơn này?" desc={`Hoá đơn ${bill.number} sẽ bị xoá khỏi danh sách phải trả. Thao tác không thể hoàn tác.`} />
      <Confirm open={confirm === 'unschedule'} onClose={() => setConfirm(null)} onConfirm={unschedule} confirmLabel="Huỷ lịch" cancelLabel="Giữ lịch"
        title="Huỷ lịch thanh toán?" desc={`Mạch sẽ không tự chuyển tiền vào ngày ${formatDate(bill.scheduledFor || bill.due)}. Hoá đơn trở lại trạng thái chờ thanh toán.`} />
    </Drawer>
  )
}

