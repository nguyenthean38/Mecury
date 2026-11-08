/* ==========================================================
   Ngăn kéo chi tiết hoá đơn bán ra
   <InvoiceDrawer id onClose onOpen={(id) => …} />
   ========================================================== */
import { useState } from 'react'
import { Send, BellRing, Wallet, MoreHorizontal, Link2, Download, CopyPlus, Ban, Mail, Repeat, FileCheck2, CalendarClock, Circle, CheckCircle2, Eye, FilePlus2, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime, formatVND, formatRelative, daysBetween, TODAY, addDays } from '@/lib/format'
import { INVOICE_STATUS, invoiceTotals } from '@/data/invoicing'
import { COMPANY } from '@/data/org'
import { useBank, toast, newId } from '@/store'
import {
  Drawer, Button, Popover, Menu, StatusBadge, Avatar, Money, Progress, Modal, Confirm, Input, Textarea, MoneyInput, Select, Callout, Badge,
} from '@/components/ui'
import { InvoicePaper } from './InvoicePaper'
import { OPEN_STATUSES, TODAY_ISO, displayStatus, invoiceActivity, isOverdue, isoDate, nextInvoiceNumber, payLink, paymentsOf } from './helpers'

const EV_ICON = { created: FilePlus2, scheduled: CalendarClock, sent: Send, viewed: Eye, paid: CheckCircle2, void: XCircle }

/* ---------- Gửi hoá đơn / nhắc thanh toán ---------- */
function SendModal({ inv, customer, mode, onClose }) {
  const update = useBank((s) => s.update)
  const { total, due } = invoiceTotals(inv)
  const remind = mode === 'remind'
  const late = daysBetween(inv.due, TODAY)
  const name = customer?.contact || customer?.name || 'quý khách'
  const [to, setTo] = useState(customer?.email || '')
  const [msg, setMsg] = useState(remind
    ? `Kính gửi ${name},\n\n${COMPANY.short} xin nhắc quý khách hoá đơn ${inv.number} còn ${formatVND(due)} chưa thanh toán${late > 0 ? `, đã quá hạn ${late} ngày (hạn ${formatDate(inv.due)})` : `, hạn thanh toán ${formatDate(inv.due)}`}.\n\nNếu quý khách đã chuyển khoản, vui lòng bỏ qua email này.\n\nTrân trọng,\n${COMPANY.short}`
    : `Kính gửi ${name},\n\n${COMPANY.short} gửi quý khách hoá đơn ${inv.number} với tổng số tiền ${formatVND(total)}, hạn thanh toán ${formatDate(inv.due)}.\n\nQuý khách có thể xem và thanh toán trực tuyến qua link bên dưới.\n\nTrân trọng,\n${COMPANY.short}`)
  const subject = remind ? `Nhắc thanh toán hoá đơn ${inv.number}` : `Hoá đơn ${inv.number} từ ${COMPANY.short}`
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)

  const send = () => {
    if (remind) {
      update('invoices', inv.id, (x) => ({ reminders: [...(x.reminders || []), TODAY.toISOString()] }))
      toast({ title: 'Đã gửi nhắc thanh toán', desc: `Đến ${to}` })
    } else {
      update('invoices', inv.id, {
        status: 'sent', sentAt: TODAY.toISOString(), sentTo: to, scheduledFor: undefined,
        cqtCode: inv.einvoice ? inv.cqtCode || '00' + Math.random().toString(16).slice(2, 12).toUpperCase() + 'C26TSV' : undefined,
      })
      toast({ title: 'Đã gửi hoá đơn', desc: `${inv.number} đến ${to}`, tone: 'pos' })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="lg" title={remind ? 'Gửi nhắc thanh toán' : 'Gửi hoá đơn'} desc={remind ? 'Email nhắc nhẹ nhàng kèm link thanh toán.' : 'Khách hàng nhận email kèm bản PDF và link thanh toán.'}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" icon={Send} disabled={!ok} onClick={send}>{remind ? 'Gửi nhắc' : 'Gửi hoá đơn'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Gửi đến" type="email" value={to} onChange={(e) => setTo(e.target.value)} error={to && !ok ? 'Email chưa đúng định dạng' : null} />
        <Textarea label="Nội dung" rows={7} value={msg} onChange={(e) => setMsg(e.target.value)} />
        <div>
          <div className="ds-label mb-2">Xem trước email</div>
          <div className="rounded-xl border border-line bg-subtle overflow-hidden">
            <div className="px-4 py-3 border-b border-line text-[12.5px] flex flex-col gap-0.5">
              <div><span className="text-muted">Từ:</span> {COMPANY.short} &lt;hoadon@senviet.vn&gt;</div>
              <div><span className="text-muted">Đến:</span> {to || '—'}</div>
              <div><span className="text-muted">Tiêu đề:</span> <b className="font-[600]">{subject}</b></div>
            </div>
            <div className="p-4 bg-surface">
              <p className="text-[13px] whitespace-pre-line text-dim leading-relaxed">{msg}</p>
              <div className="mt-4 rounded-xl border border-line p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="ds-caption">{inv.number} · hạn {formatDate(inv.due)}</div>
                  <div className="text-[20px] font-[500] num tracking-tight">{formatVND(remind ? due : total)}</div>
                </div>
                <span className="inline-flex h-9 items-center rounded-[10px] bg-brand-500 px-4 text-[13px] font-[600] text-white dark:text-[#06140f]">Xem & thanh toán</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Ghi nhận thanh toán ---------- */
function PaymentModal({ inv, onClose }) {
  const update = useBank((s) => s.update)
  const accounts = useBank((s) => s.accounts)
  const { due } = invoiceTotals(inv)
  const [f, setF] = useState({ amount: due, date: TODAY_ISO, account: inv.account || 'acc-main', note: '' })
  const over = f.amount > due
  const ok = f.amount > 0 && !over && f.date

  const save = () => {
    const payments = [...paymentsOf(inv), { amount: f.amount, date: f.date, account: f.account, note: f.note }]
    const paid = (inv.paid || 0) + f.amount
    const full = paid >= invoiceTotals(inv).total
    update('invoices', inv.id, { payments, paid, status: full ? 'paid' : 'partial', paidAt: full ? f.date : inv.paidAt })
    toast({ title: full ? 'Hoá đơn đã thanh toán đủ' : 'Đã ghi nhận thanh toán một phần', desc: `${formatVND(f.amount)} · ${inv.number}`, tone: 'pos' })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Ghi nhận thanh toán" desc={`Còn phải thu ${formatVND(due)} cho hoá đơn ${inv.number}.`}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>Ghi nhận</Button></>}>
      <div className="flex flex-col gap-4">
        <MoneyInput label="Số tiền nhận" value={f.amount} onChange={(amount) => setF({ ...f, amount })} autoFocus error={over ? 'Số tiền vượt quá số còn phải thu' : null} />
        <div className="flex gap-2 -mt-2">
          <button onClick={() => setF({ ...f, amount: due })} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-dim hover:bg-subtle">Toàn bộ</button>
          <button onClick={() => setF({ ...f, amount: Math.round(due / 2) })} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-dim hover:bg-subtle">50%</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input type="date" label="Ngày nhận" value={f.date} max={TODAY_ISO} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <Select label="Vào tài khoản" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} options={[...accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` })), { value: 'cash', label: 'Tiền mặt' }]} />
        </div>
        <Input label="Ghi chú" optional value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="VD: Khách chuyển khoản qua Vietcombank" />
        {f.amount > 0 && f.amount < due && <Callout tone="warn">Hoá đơn sẽ chuyển sang trạng thái Trả một phần, còn {formatVND(due - f.amount)}.</Callout>}
      </div>
    </Modal>
  )
}

/* ---------- Dòng thời gian ---------- */
function Timeline({ inv }) {
  const events = invoiceActivity(inv)
  const tone = { neutral: 'bg-subtle text-muted', info: 'bg-info-soft text-info', warn: 'bg-warn-soft text-warn', pos: 'bg-pos-soft text-pos', neg: 'bg-neg-soft text-neg' }
  return (
    <ol className="relative flex flex-col gap-4">
      <span className="absolute left-[13px] top-2 bottom-2 w-px bg-line" aria-hidden />
      {events.map((e) => {
        const I = EV_ICON[e.key] || (e.key.startsWith('pay') ? Wallet : e.key.startsWith('rem') ? BellRing : Circle)
        return (
          <li key={e.key} className="relative flex items-start gap-3">
            <span className={cn('relative size-7 shrink-0 rounded-full grid place-items-center ring-4 ring-surface', tone[e.tone])}><I size={13} /></span>
            <div className="min-w-0 pt-0.5">
              <div className="text-[13.5px] font-[550]">{e.label}{e.amount ? <> · <Money value={e.amount} className="font-[600]" /></> : null}</div>
              <div className="ds-caption">{e.future ? 'Dự kiến ' : ''}{String(e.date).length > 10 ? formatDateTime(e.date) : formatDate(e.date)}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function InvoiceDrawer({ id, onClose, onOpen }) {
  const inv = useBank((s) => s.invoices.find((i) => i.id === id))
  const customer = useBank((s) => s.customers.find((c) => c.id === inv?.customer))
  const { invoices, update, add } = useBank()
  const [modal, setModal] = useState(null) // send | remind | pay | void

  if (!inv) return <Drawer open={!!id} onClose={onClose} title="Không tìm thấy hoá đơn"><p className="text-muted">Hoá đơn có thể đã bị xoá.</p></Drawer>

  const { total, due } = invoiceTotals(inv)
  const status = displayStatus(inv)
  const open = OPEN_STATUSES.includes(inv.status)
  const overdue = isOverdue(inv)
  const late = daysBetween(inv.due, TODAY)
  const link = payLink(inv)

  const copyLink = () => { navigator.clipboard?.writeText(link); toast({ title: 'Đã sao chép link thanh toán', desc: link }) }
  const pdf = () => toast({ title: 'Đã tải hoá đơn PDF', desc: `${inv.number.toLowerCase()}.pdf` })
  const duplicate = () => {
    const copy = {
      ...inv, id: newId('iv'), number: nextInvoiceNumber(invoices), status: 'draft', issued: TODAY_ISO, due: isoDate(addDays(TODAY, 14)),
      paid: 0, payments: [], paidAt: undefined, viewedAt: null, sentAt: undefined, sentTo: undefined, reminders: [], voidedAt: undefined, cqtCode: undefined, scheduledFor: undefined, createdAt: TODAY_ISO,
    }
    add('invoices', copy)
    toast({ title: 'Đã nhân bản hoá đơn', desc: `Bản nháp ${copy.number}` })
    onOpen?.(copy.id)
  }
  const voidIt = () => {
    update('invoices', inv.id, { status: 'void', voidedAt: TODAY.toISOString() })
    toast({ title: 'Đã huỷ hoá đơn', desc: inv.number })
  }

  const primary = {
    draft: <Button variant="primary" icon={Send} onClick={() => setModal('send')}>Gửi hoá đơn</Button>,
    scheduled: <Button variant="primary" icon={Send} onClick={() => setModal('send')}>Gửi ngay</Button>,
    paid: <Button variant="primary" icon={Download} onClick={pdf}>Tải PDF</Button>,
    void: <Button variant="secondary" icon={CopyPlus} onClick={duplicate}>Nhân bản</Button>,
  }[inv.status] || <Button variant="primary" icon={Wallet} onClick={() => setModal('pay')}>Ghi nhận thanh toán</Button>

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={780}
      title={inv.number}
      header={
        <div className="flex items-start gap-3.5">
          <Avatar name={customer?.name || '?'} color={customer?.color} size={44} square />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-[600]">{inv.number}</span>
              <StatusBadge map={INVOICE_STATUS} value={status} />
              {inv.recurring && <Badge tone="brand" icon={Repeat}>{inv.recurring}</Badge>}
            </div>
            <div className="ds-caption mt-0.5 truncate">{customer?.name || 'Khách hàng đã xoá'} · lập ngày {formatDate(inv.issued)}</div>
          </div>
        </div>
      }
      footer={<>
        {primary}
        {open && <Button variant="secondary" icon={BellRing} onClick={() => setModal('remind')}>Gửi nhắc<span className="hidden sm:inline">&nbsp;thanh toán</span></Button>}
        <div className="flex-1" />
        <Popover align="end" width={240} trigger={(p) => <Button {...p} variant="ghost" icon={MoreHorizontal} aria-label="Thao tác khác">Khác</Button>}>
          {(close) => <Menu onClose={close} items={[
            inv.status !== 'void' && { label: 'Sao chép link thanh toán', icon: Link2, onClick: copyLink },
            { label: 'Tải PDF', icon: Download, onClick: pdf },
            inv.status !== 'void' && { label: 'Nhân bản', icon: CopyPlus, onClick: duplicate },
            !['paid', 'void'].includes(inv.status) && { divider: true },
            !['paid', 'void'].includes(inv.status) && { label: 'Huỷ hoá đơn', icon: Ban, danger: true, onClick: () => setModal('void') },
          ]} />}
        </Popover>
      </>}
    >
      <div className="flex flex-col gap-6">
        {/* Tóm tắt */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="ds-caption">Tổng tiền</div>
            <Money value={total} className="text-[22px] font-[500] tracking-tight" />
          </div>
          <div>
            <div className="ds-caption">Còn phải thu</div>
            <Money value={inv.status === 'void' ? 0 : due} className={cn('text-[22px] font-[500] tracking-tight', overdue && 'text-neg')} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <div className="ds-caption">Hạn thanh toán</div>
            <div className={cn('text-[15px] font-[550] mt-1', overdue && 'text-neg')}>
              {formatDate(inv.due)}
              <span className="ds-caption font-normal ml-1.5">{inv.status === 'paid' ? 'đã thu đủ' : overdue ? `quá hạn ${late} ngày` : open ? formatRelative(inv.due) : ''}</span>
            </div>
          </div>
        </div>

        {overdue && <Callout tone="neg" title={`Quá hạn ${late} ngày`} action={<Button size="sm" variant="danger-soft" icon={BellRing} onClick={() => setModal('remind')}>Nhắc ngay</Button>}>
          {customer?.name} chưa thanh toán {formatVND(due)}. {inv.reminders?.length ? `Đã nhắc ${inv.reminders.length} lần.` : 'Chưa gửi nhắc lần nào.'}
        </Callout>}
        {inv.status === 'scheduled' && <Callout tone="info" icon={CalendarClock}>Hoá đơn sẽ tự gửi vào ngày {formatDate(inv.scheduledFor || inv.issued)}{inv.recurring ? ' và lặp lại hằng tháng' : ''}.</Callout>}
        {inv.status === 'draft' && <Callout tone="neutral" icon={Mail}>Đây là bản nháp — khách hàng chưa nhìn thấy hoá đơn này.</Callout>}

        {(inv.paid > 0) && inv.status !== 'void' && (
          <div className="card p-4">
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span className="font-[550]">Đã thu <Money value={inv.paid} /> / <Money value={total} /></span>
              <span className="num text-muted">{Math.round((inv.paid / total) * 100)}%</span>
            </div>
            <Progress value={inv.paid} max={total} tone={inv.status === 'paid' ? 'pos' : 'warn'} height={8} />
          </div>
        )}

        {inv.einvoice && !['draft', 'scheduled'].includes(inv.status) && (
          <div className="flex items-center gap-2 text-[13px] text-dim"><FileCheck2 size={15} className="text-pos" />Hoá đơn điện tử đã được cơ quan thuế cấp mã</div>
        )}

        <div className="rounded-2xl bg-subtle border border-line p-3 sm:p-5">
          <InvoicePaper invoice={inv} customer={customer} />
        </div>

        <div>
          <h3 className="ds-h3 mb-4">Hoạt động</h3>
          <Timeline inv={inv} />
        </div>
      </div>

      {(modal === 'send' || modal === 'remind') && <SendModal inv={inv} customer={customer} mode={modal} onClose={() => setModal(null)} />}
      {modal === 'pay' && <PaymentModal inv={inv} onClose={() => setModal(null)} />}
      <Confirm open={modal === 'void'} onClose={() => setModal(null)} onConfirm={voidIt} danger confirmLabel="Huỷ hoá đơn" cancelLabel="Giữ lại"
        title={`Huỷ hoá đơn ${inv.number}?`}
        desc={inv.einvoice && !['draft', 'scheduled'].includes(inv.status)
          ? 'Mạch sẽ gửi thông báo huỷ hoá đơn điện tử (mẫu 04/SS-HĐĐT) lên cơ quan thuế. Không thể hoàn tác.'
          : 'Link thanh toán sẽ ngừng hoạt động. Không thể hoàn tác.'} />
    </Drawer>
  )
}
