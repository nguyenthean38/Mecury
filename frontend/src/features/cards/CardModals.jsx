/* ==========================================================
   Hộp thoại thao tác trên thẻ: hạn mức, chặn ngành hàng, đổi tên, đặt lại PIN
   ========================================================== */
import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND } from '@/lib/format'
import { useBank, toast } from '@/store'
import { MERCHANT_GROUPS } from '@/data/spend'
import { Modal, Button, MoneyInput, Select, Input, Checkbox, OtpInput, Callout } from '@/components/ui'

export const PERIODS = ['Ngày', 'Tuần', 'Tháng', 'Quý', 'Mỗi giao dịch', 'Trọn đời']
export const periodLabel = (p) => (p === 'Mỗi giao dịch' ? 'mỗi giao dịch' : p === 'Trọn đời' ? 'trọn đời' : `mỗi ${p.toLowerCase()}`)

/** Đổi hạn mức + chu kỳ */
export function LimitModal({ card, open, onClose }) {
  const update = useBank((s) => s.update)
  const [limit, setLimit] = useState(card.limit)
  const [period, setPeriod] = useState(card.period)
  useEffect(() => { if (open) { setLimit(card.limit); setPeriod(card.period) } }, [open, card])
  const below = period !== 'Mỗi giao dịch' && limit > 0 && limit < card.spent
  const save = () => {
    update('cards', card.id, { limit, period })
    toast({ title: 'Đã cập nhật hạn mức', desc: `${formatVND(limit)} ${periodLabel(period)} · ${card.nickname}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Đổi hạn mức" desc={`Thẻ ${card.nickname} ••${card.last4}`} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={limit < 100000} onClick={save}>Lưu hạn mức</Button></>}>
      <div className="flex flex-col gap-4">
        <MoneyInput label="Hạn mức chi tiêu" value={limit} onChange={setLimit} autoFocus />
        <div className="flex flex-wrap gap-2 -mt-1">
          {[10e6, 20e6, 50e6, 100e6].map((v) => (
            <button key={v} type="button" onClick={() => setLimit(v)}
              className={cn('h-7 rounded-full border px-3 text-[12.5px] num', limit === v ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line text-dim hover:bg-subtle')}>
              {formatVND(v)}
            </button>
          ))}
        </div>
        <Select label="Chu kỳ đặt lại" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} />
        {below && <Callout tone="warn">Hạn mức mới thấp hơn số đã chi kỳ này ({formatVND(card.spent)}). Thẻ sẽ bị từ chối cho đến kỳ sau.</Callout>}
      </div>
    </Modal>
  )
}

/** Chặn nhóm ngành hàng */
export function BlockModal({ card, open, onClose }) {
  const update = useBank((s) => s.update)
  const [sel, setSel] = useState(card.blocked || [])
  useEffect(() => { if (open) setSel(card.blocked || ['Cờ bạc']) }, [open, card])
  const toggle = (g) => setSel((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]))
  const save = () => {
    update('cards', card.id, { blocked: sel })
    toast({ title: 'Đã cập nhật nhóm ngành bị chặn', desc: sel.length ? `${sel.length} nhóm ngành bị chặn trên thẻ ••${card.last4}` : 'Thẻ có thể dùng ở mọi ngành hàng' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Chặn nhóm ngành" desc="Giao dịch ở các nhóm ngành được chọn sẽ tự động bị từ chối."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={save}>Lưu thay đổi</Button></>}>
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
        {MERCHANT_GROUPS.map((g) => <Checkbox key={g} label={g} checked={sel.includes(g)} onChange={() => toggle(g)} />)}
      </div>
      <div className="mt-4 flex items-center justify-between ds-caption">
        <span>Đã chọn {sel.length}/{MERCHANT_GROUPS.length}</span>
        <button type="button" className="text-brand-ink font-[550] hover:underline" onClick={() => setSel(sel.length ? [] : [...MERCHANT_GROUPS])}>
          {sel.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>
    </Modal>
  )
}

/** Đổi tên thẻ */
export function RenameCardModal({ card, open, onClose }) {
  const update = useBank((s) => s.update)
  const [name, setName] = useState(card.nickname)
  useEffect(() => { if (open) setName(card.nickname) }, [open, card])
  const ok = name.trim().length >= 2 && name.trim() !== card.nickname
  const save = () => { update('cards', card.id, { nickname: name.trim() }); toast({ title: 'Đã đổi tên thẻ', desc: name.trim() }); onClose() }
  return (
    <Modal open={open} onClose={onClose} title="Đổi tên thẻ" size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>Lưu</Button></>}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) save() }}>
        <Input label="Tên thẻ" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)} hint="Tên giúp mọi người biết thẻ dùng cho việc gì." />
      </form>
    </Modal>
  )
}

/** Đặt lại mã PIN: nhập 4 số, nhập lại để xác nhận */
export function PinModal({ card, open, onClose }) {
  const [step, setStep] = useState(0)
  const [pin, setPin] = useState('')
  const [again, setAgain] = useState('')
  useEffect(() => { if (open) { setStep(0); setPin(''); setAgain('') } }, [open])
  const weak = /^(\d)\1{3}$/.test(pin) || ['1234', '4321', '0000'].includes(pin)
  const mismatch = again.length === 4 && again !== pin
  const next = () => {
    if (step === 0) { setStep(1); return }
    toast({ title: 'Đã đặt lại mã PIN', desc: `Mã PIN mới có hiệu lực ngay cho thẻ ••${card.last4}.`, tone: 'pos' })
    onClose()
  }
  const can = step === 0 ? pin.length === 4 && !weak : again.length === 4 && !mismatch
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Đặt lại mã PIN"
      desc={step === 0 ? 'Nhập mã PIN mới gồm 4 chữ số.' : 'Nhập lại mã PIN để xác nhận.'}
      footer={<>
        <Button variant="secondary" onClick={step === 0 ? onClose : () => { setStep(0); setAgain('') }}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        <Button variant="primary" disabled={!can} onClick={next}>{step === 0 ? 'Tiếp tục' : 'Xác nhận'}</Button>
      </>}>
      <div className="flex flex-col items-center gap-3 py-2">
        {step === 0
          ? <OtpInput key="pin" length={4} masked value={pin} onChange={setPin} />
          : <OtpInput key="again" length={4} masked value={again} onChange={setAgain} />}
        {step === 0 && weak && <p className="text-[12.5px] text-neg">Mã PIN quá dễ đoán, hãy chọn mã khác.</p>}
        {step === 1 && mismatch && <p className="text-[12.5px] text-neg">Mã PIN không khớp.</p>}
        <p className="ds-caption flex items-center gap-1.5"><ShieldCheck size={13} />Không dùng ngày sinh hoặc 4 số cuối điện thoại.</p>
      </div>
    </Modal>
  )
}
