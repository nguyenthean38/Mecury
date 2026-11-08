/* ==========================================================
   Hộp thoại dùng cho trang Tài khoản: mở tài khoản phụ, đổi tên
   ========================================================== */
import { useEffect, useState } from 'react'
import { Wallet, PiggyBank, Landmark, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBank, toast, newId } from '@/store'
import { COMPANY } from '@/data/org'
import { Modal, Button, Input, RadioCards, AccountIcon, Callout } from '@/components/ui'

const KIND_OPTIONS = [
  { value: 'checking', label: 'Tài khoản thanh toán', desc: 'Chi tiêu, nhận tiền và cấp thẻ riêng cho từng mảng việc.', icon: Wallet },
  { value: 'savings', label: 'Tài khoản tiết kiệm', desc: 'Hưởng lãi 4,6%/năm, rút về tài khoản thanh toán bất cứ lúc nào.', icon: PiggyBank },
  { value: 'tax', label: 'Quỹ chuyên dụng', desc: 'Để riêng tiền thuế, quỹ dự án hoặc tiền đặt cọc của khách.', icon: Landmark },
]

const COLORS = ['#138f66', '#4f7fe0', '#d99a2b', '#7a6fd6', '#c2588a', '#59a7b8']

const PLACEHOLDER = { checking: 'VD: Chi phí dự án Hạt Mầm', savings: 'VD: Quỹ mua thiết bị 2027', tax: 'VD: Quỹ thưởng Tết' }

/** Mở tài khoản phụ mới — thêm vào danh sách tài khoản */
export function NewAccountModal({ open, onClose, onCreated }) {
  const add = useBank((s) => s.add)
  const [f, setF] = useState({ name: '', kind: 'checking', color: COLORS[1] })
  const [loading, setLoading] = useState(false)
  useEffect(() => { if (open) { setF({ name: '', kind: 'checking', color: COLORS[1] }); setLoading(false) } }, [open])
  const ok = f.name.trim().length >= 3

  const create = () => {
    setLoading(true)
    setTimeout(() => {
      const last4 = String(1000 + Math.floor(Math.random() * 9000))
      const acc = {
        id: newId('acc-'),
        kind: f.kind,
        name: f.name.trim(),
        last4,
        balance: 0,
        number: `9704 2210 00${last4.slice(0, 2)} ${last4.slice(2)}`,
        bank: COMPANY.partnerBank,
        color: f.color,
        ...(f.kind === 'savings' ? { apy: 4.6 } : {}),
        created: new Date().toISOString(),
      }
      add('accounts', acc, { prepend: false })
      toast({ title: 'Đã mở tài khoản mới', desc: `${acc.name} ••${acc.last4} sẵn sàng nhận tiền.`, tone: 'pos' })
      onCreated?.(acc)
      onClose()
    }, 700)
  }

  return (
    <Modal open={open} onClose={onClose} title="Mở tài khoản mới" desc="Tài khoản phụ có số tài khoản riêng, mở ngay, miễn phí và không giới hạn số lượng."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" disabled={!ok} loading={loading} onClick={create}>Mở tài khoản</Button>
      </>}>
      <div className="flex flex-col gap-5">
        <RadioCards value={f.kind} onChange={(kind) => setF({ ...f, kind })} options={KIND_OPTIONS} />
        <Input label="Tên tài khoản" value={f.name} maxLength={40} autoFocus
          onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={PLACEHOLDER[f.kind]}
          hint="Chỉ thành viên công ty nhìn thấy tên này." />
        <div>
          <div className="text-[13px] font-[550] text-dim mb-2">Màu nhận diện</div>
          <div className="flex items-center gap-3">
            <AccountIcon kind={f.kind} color={f.color} size={40} />
            <div className="flex gap-2" role="radiogroup" aria-label="Màu tài khoản">
              {COLORS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={f.color === c} aria-label={`Màu ${c}`}
                  onClick={() => setF({ ...f, color: c })}
                  className={cn('size-7 rounded-full grid place-items-center ring-offset-2 ring-offset-surface transition-shadow', f.color === c && 'ring-2 ring-fg')}
                  style={{ background: c }}>
                  {f.color === c && <Check size={14} strokeWidth={3} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
        {f.kind === 'savings' && (
          <Callout tone="brand">Lãi được cộng vào ngày 1 hằng tháng. Không kỳ hạn, không phí rút trước hạn.</Callout>
        )}
      </div>
    </Modal>
  )
}

/** Đổi tên tài khoản */
export function RenameAccountModal({ account, onClose }) {
  const update = useBank((s) => s.update)
  const [name, setName] = useState(account?.name || '')
  useEffect(() => { setName(account?.name || '') }, [account])
  const ok = name.trim().length >= 2 && name.trim() !== account?.name
  const save = () => {
    update('accounts', account.id, { name: name.trim() })
    toast({ title: 'Đã đổi tên tài khoản', desc: name.trim() })
    onClose()
  }
  return (
    <Modal open={!!account} onClose={onClose} title="Đổi tên tài khoản" size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" disabled={!ok} onClick={save}>Lưu</Button>
      </>}>
      <form onSubmit={(e) => { e.preventDefault(); if (ok) save() }}>
        <Input label="Tên mới" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)}
          hint={account ? `Số tài khoản ••${account.last4} không thay đổi.` : undefined} />
      </form>
    </Modal>
  )
}
