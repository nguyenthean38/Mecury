/* ==========================================================
   Ngăn kéo chi tiết hoàn ứng + hộp thoại từ chối
   ========================================================== */
import { useState } from 'react'
import { Check, X, Banknote, Trash2, Download, Paperclip, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatVND, readVND, TODAY } from '@/lib/format'
import { useBank, toast } from '@/store'
import { REIMB_STATUS } from '@/data/spend'
import { Drawer, Modal, Confirm, Button, Textarea, KeyValue, Avatar, StatusBadge, Money, CategoryTag, Callout } from '@/components/ui'
import { ReceiptPreview } from './ReceiptPreview'

const todayISO = () => TODAY.toISOString().slice(0, 10)
const QUICK_REASONS = ['Thiếu chứng từ hợp lệ', 'Không thuộc danh mục được hoàn', 'Vượt hạn mức cho phép', 'Trùng với yêu cầu khác']

/** Hộp thoại nhập lý do từ chối (dùng cho một hoặc nhiều yêu cầu) */
export function RejectModal({ open, onClose, onConfirm, count = 1 }) {
  const [reason, setReason] = useState('')
  const close = () => { setReason(''); onClose() }
  return (
    <Modal open={open} onClose={close} size="sm" title={count > 1 ? `Từ chối ${count} yêu cầu` : 'Từ chối hoàn ứng'}
      desc="Người nộp sẽ nhận được lý do qua email và thông báo trong ứng dụng."
      footer={<><Button variant="secondary" onClick={close}>Huỷ</Button><Button variant="danger" disabled={reason.trim().length < 4} onClick={() => { onConfirm(reason.trim()); close() }}>Từ chối</Button></>}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((r) => (
            <button key={r} type="button" onClick={() => setReason(r)}
              className={cn('h-7 rounded-full border px-2.5 text-[12.5px] transition-colors', reason === r ? 'border-neg bg-neg-soft text-neg' : 'border-line text-dim hover:bg-subtle')}>{r}</button>
          ))}
        </div>
        <Textarea label="Lý do" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="VD: Vui lòng bổ sung hoá đơn VAT" rows={3} />
      </div>
    </Modal>
  )
}

/** Dòng thời gian trạng thái */
function Timeline({ rb, member, approver }) {
  const steps = [
    { label: 'Đã nộp', who: member?.name, date: rb.submitted, done: true },
    rb.status === 'rejected'
      ? { label: 'Từ chối', who: approver?.name, date: rb.rejectedAt || rb.submitted, done: true, tone: 'neg', note: rb.reason }
      : { label: 'Đã duyệt', who: approver?.name, date: rb.approvedAt || (rb.status !== 'pending' ? rb.submitted : null), done: rb.status !== 'pending' },
    rb.status !== 'rejected' && { label: 'Đã hoàn tiền', who: rb.status === 'paid' ? 'Thanh toán chính ••2502' : null, date: rb.paidAt, done: rb.status === 'paid' },
  ].filter(Boolean)
  return (
    <ol className="relative flex flex-col gap-4">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex gap-3">
          {i < steps.length - 1 && <span className={cn('absolute left-[11px] top-6 bottom-[-16px] w-px', steps[i + 1].done ? 'bg-brand-300' : 'bg-line')} />}
          <span className={cn('relative z-[1] size-6 shrink-0 rounded-full grid place-items-center border',
            s.done ? (s.tone === 'neg' ? 'bg-neg text-white border-neg' : 'bg-brand-500 text-white border-brand-500 dark:text-[#06140f]') : 'bg-surface border-line-strong text-faint')}>
            {s.done ? (s.tone === 'neg' ? <X size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />) : <Clock size={12} />}
          </span>
          <div className="min-w-0 pt-0.5">
            <div className={cn('text-[13.5px] font-[550]', !s.done && 'text-muted')}>{s.label}</div>
            <div className="ds-caption">{s.done ? [s.who, s.date && formatDate(s.date)].filter(Boolean).join(' · ') : 'Đang chờ'}</div>
            {s.note && <div className="mt-1 text-[13px] text-neg">“{s.note}”</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function ReimbursementDrawer({ id, onClose }) {
  const rb = useBank((s) => s.reimbursements.find((r) => r.id === id))
  const team = useBank((s) => s.team)
  const { update, remove, transfer } = useBank()
  const [rejecting, setRejecting] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'pay' | 'cancel'
  if (!rb) return <Drawer open={!!id} onClose={onClose} title="Không tìm thấy yêu cầu" />
  const member = team.find((m) => m.id === rb.member)
  const approver = team.find((m) => m.id === rb.approver)

  const approve = () => {
    update('reimbursements', rb.id, { status: 'approved', approver: 'u1', approvedAt: todayISO() })
    toast({ title: 'Đã duyệt hoàn ứng', desc: `${member?.name} · ${formatVND(rb.amount)}` })
  }
  const reject = (reason) => {
    update('reimbursements', rb.id, { status: 'rejected', approver: 'u1', reason, rejectedAt: todayISO() })
    toast({ title: 'Đã từ chối yêu cầu', desc: `Đã gửi lý do cho ${member?.name}.` })
  }
  const pay = () => {
    if (rb.member === 'u3') {
      const tx = transfer({ from: 'acc-main', recipient: 'p7', amount: rb.amount, note: `HOAN UNG ${rb.id.toUpperCase()}`, category: rb.category })
      update('reimbursements', rb.id, { status: 'paid', paidAt: todayISO(), tx: tx.id })
      toast({ title: 'Đã hoàn tiền', desc: `${formatVND(rb.amount)} đã chuyển đến ${member?.name} · Techcombank` })
    } else {
      update('reimbursements', rb.id, { status: 'paid', paidAt: todayISO() })
      toast({ title: 'Đã đánh dấu hoàn tiền', desc: `${member?.name} sẽ nhận khoản này cùng kỳ lương tới.` })
    }
  }
  const cancel = () => {
    remove('reimbursements', rb.id)
    toast({ title: 'Đã huỷ yêu cầu hoàn ứng', desc: rb.merchant })
    onClose()
  }

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={500}
      header={
        <div className="flex items-start gap-3.5">
          <Avatar name={member?.name} color={member?.color} size={44} />
          <div className="min-w-0">
            <div className="text-[15px] font-[600] leading-snug truncate">{rb.merchant}</div>
            <div className="ds-caption mt-0.5">{member?.name} · nộp {formatDate(rb.submitted)}</div>
          </div>
        </div>
      }
      footer={
        rb.status === 'pending' ? <>
          {rb.member === 'u1' && <Button variant="ghost" icon={Trash2} onClick={() => setConfirm('cancel')}>Huỷ yêu cầu</Button>}
          <div className="flex-1" />
          <Button variant="danger-soft" icon={X} onClick={() => setRejecting(true)}>Từ chối</Button>
          <Button variant="primary" icon={Check} onClick={approve}>Duyệt</Button>
        </> : rb.status === 'approved' ? <>
          <Button variant="ghost" icon={X} onClick={() => setRejecting(true)}>Từ chối</Button>
          <div className="flex-1" />
          <Button variant="primary" icon={Banknote} onClick={() => setConfirm('pay')}>Hoàn tiền ngay</Button>
        </> : <>
          <div className="flex-1" />
          <Button variant="ghost" icon={Download} disabled={!rb.receipt} onClick={() => toast({ title: 'Đã tải chứng từ', desc: rb.receipt })}>Tải chứng từ</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <StatusBadge map={REIMB_STATUS} value={rb.status} />
          <div className="mt-3 text-[34px] font-[480] tracking-tight leading-none"><Money value={rb.amount} /></div>
          <p className="ds-caption mt-2 italic">{readVND(rb.amount)}</p>
        </div>

        {rb.status === 'rejected' && rb.reason && <Callout tone="neg" title="Lý do từ chối">{rb.reason}</Callout>}

        <div>
          <div className="flex items-center gap-1.5 text-[13px] font-[550] text-dim mb-2"><Paperclip size={14} />Chứng từ</div>
          <ReceiptPreview merchant={rb.merchant} amount={rb.amount} date={rb.date} category={rb.category} file={rb.receipt} />
        </div>

        <KeyValue items={[
          { label: 'Nơi chi tiêu', value: rb.merchant },
          { label: 'Ngày chi', value: formatDate(rb.date) },
          { label: 'Danh mục', value: <CategoryTag id={rb.category} /> },
          { label: 'Người nộp', value: <span className="inline-flex items-center gap-2"><Avatar name={member?.name} color={member?.color} size={20} />{member?.name}</span> },
          { label: 'Ghi chú', value: rb.note || <span className="text-faint">—</span> },
          { label: 'Hoàn vào', value: rb.member === 'u3' ? 'Techcombank ••0098 31' : 'Cộng vào kỳ lương' },
        ]} />

        <div className="rounded-xl border border-line p-4">
          <div className="text-[13px] font-[550] text-dim mb-3">Tiến trình</div>
          <Timeline rb={rb} member={member} approver={approver} />
        </div>
      </div>

      <RejectModal open={rejecting} onClose={() => setRejecting(false)} onConfirm={reject} />
      <Confirm open={confirm === 'pay'} onClose={() => setConfirm(null)} onConfirm={pay} confirmLabel={`Hoàn ${formatVND(rb.amount)}`}
        title="Hoàn tiền ngay?" desc={rb.member === 'u3'
          ? `Mạch sẽ chuyển ${formatVND(rb.amount)} từ Thanh toán chính ••2502 đến tài khoản Techcombank của ${member?.name}.`
          : `${member?.name} chưa có tài khoản nhận tiền đã xác minh. Khoản này sẽ được ghi nhận và cộng vào kỳ lương tới.`} />
      <Confirm open={confirm === 'cancel'} onClose={() => setConfirm(null)} onConfirm={cancel} danger confirmLabel="Huỷ yêu cầu"
        title="Huỷ yêu cầu hoàn ứng?" desc="Yêu cầu sẽ bị xoá khỏi danh sách chờ duyệt. Bạn có thể nộp lại sau." cancelLabel="Giữ lại" />
    </Drawer>
  )
}
