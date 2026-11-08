/* ==========================================================
   Hộp thoại thanh toán hoá đơn: chọn tài khoản, trả ngay / hẹn ngày, hình thức
   ========================================================== */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Zap, Clock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY, addDays, formatDate, formatVND } from '@/lib/format'
import { useBank, toast } from '@/store'
import { Modal, Button, Segmented, Input, RadioCards, AccountIcon, Money, KeyValue, Callout } from '@/components/ui'

const iso = (d) => new Date(d).toISOString().slice(0, 10)

export function PayBillModal({ bill, recipient, open, onClose, mode = 'now' }) {
  const navigate = useNavigate()
  const { accounts, transfer, update } = useBank()
  const tomorrow = iso(addDays(TODAY, 1))
  const [f, setF] = useState(() => ({
    from: bill.fromAccount || accounts.find((a) => a.primary)?.id,
    when: mode,
    date: bill.due && bill.due > tomorrow ? bill.due : tomorrow,
    method: bill.amount > 500000000 ? 'interbank' : 'napas',
  }))
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const src = accounts.find((a) => a.id === f.from)
  const short = f.when === 'now' && (src?.balance || 0) < bill.amount
  const napasOver = f.method === 'napas' && bill.amount > 500000000
  const ok = !!src && !short && !napasOver && (f.when === 'now' || f.date >= tomorrow)

  const confirm = () => {
    if (f.when === 'now') {
      const tx = transfer({ from: f.from, recipient: bill.recipient, amount: bill.amount, note: bill.number, category: bill.category })
      update('bills', bill.id, { status: 'paid', paidAt: iso(TODAY), fromAccount: f.from, approved: true, tx: tx.id, scheduledFor: null })
      toast({ title: 'Đã thanh toán hoá đơn', desc: `${formatVND(bill.amount)} đến ${recipient?.name}`, action: { label: 'Xem giao dịch', onClick: () => navigate('/giao-dich?id=' + tx.id) } })
    } else {
      update('bills', bill.id, { status: 'scheduled', scheduledFor: f.date, fromAccount: f.from, approved: true })
      toast({ title: 'Đã lên lịch thanh toán', desc: `Mạch sẽ chuyển ${formatVND(bill.amount)} vào ngày ${formatDate(f.date)}.` })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Thanh toán ${bill.number}`} desc={`Đến ${recipient?.name} · ${recipient?.bank} ${recipient?.account || ''}`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" icon={f.when === 'now' ? ShieldCheck : CalendarClock} disabled={!ok} onClick={confirm}>
          {f.when === 'now' ? `Thanh toán ${formatVND(bill.amount)}` : 'Lên lịch thanh toán'}
        </Button>
      </>}>
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-subtle px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-[13px] text-muted">Số tiền</span>
          <Money value={bill.amount} className="text-[22px] font-[500]" hideable={false} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-[550] text-dim">Từ tài khoản</span>
          <div role="radiogroup" className="grid sm:grid-cols-2 gap-2">
            {accounts.map((a) => {
              const on = a.id === f.from
              return (
                <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => set('from')(a.id)}
                  className={cn('flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-[border,background,box-shadow]',
                    on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
                  <AccountIcon kind={a.kind} color={a.color} size={30} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-[550] truncate">{a.name} <span className="text-muted font-normal">••{a.last4}</span></span>
                    <Money value={a.balance} className="block ds-caption" />
                  </span>
                </button>
              )
            })}
          </div>
          {short && <p className="text-[13px] text-neg">Số dư tài khoản này không đủ để thanh toán ngay.</p>}
        </div>

        <div className="flex flex-col gap-3">
          <Segmented value={f.when} onChange={set('when')} options={[{ value: 'now', label: 'Trả ngay' }, { value: 'later', label: 'Hẹn ngày trả', icon: CalendarClock }]} className="self-start" />
          {f.when === 'later' && (
            <div className="grid sm:grid-cols-2 gap-3 animate-fade-in">
              <Input type="date" label="Ngày thanh toán" value={f.date} min={tomorrow} onChange={set('date')}
                hint={bill.due ? `Hạn trên hoá đơn: ${formatDate(bill.due)}` : undefined}
                error={f.date < tomorrow ? 'Chọn từ ngày mai trở đi' : undefined} />
            </div>
          )}
          {f.when === 'later' && f.date > bill.due && <Callout tone="warn">Ngày bạn chọn sau hạn thanh toán — nhà cung cấp có thể tính phí trễ hạn.</Callout>}
        </div>

        <RadioCards value={f.method} onChange={set('method')} columns={2} options={[
          { value: 'napas', label: 'Chuyển nhanh 24/7', desc: 'Đến trong vài giây · tối đa 500 triệu', icon: Zap },
          { value: 'interbank', label: 'Chuyển thường', desc: 'Trong ngày làm việc · không giới hạn', icon: Clock },
        ]} />
        {napasOver && <p className="text-[13px] text-warn -mt-2">Khoản trên 500 triệu cần chọn Chuyển thường.</p>}

        <KeyValue items={[
          { label: 'Nội dung chuyển khoản', value: <span className="font-mono text-[12.5px]">{`TT HOA DON ${bill.number}`.toUpperCase()}</span> },
          { label: 'Phí', value: 'Miễn phí' },
        ]} />
      </div>
    </Modal>
  )
}
