/* ==========================================================
   Hộp thoại thêm / sửa người nhận (có xác minh tên chủ tài khoản giả lập)
   ========================================================== */
import { useEffect, useState } from 'react'
import { Building2, User, ShieldCheck, Loader2 } from 'lucide-react'
import { useBank, toast, newId } from '@/store'
import { BANKS } from '@/data/payments'
import { Modal, Button, Input, Select, Segmented, Callout } from '@/components/ui'
import { toHolder } from './billUtils'

const COLORS = ['#4f7fe0', '#c2588a', '#3f8f8a', '#d99a2b', '#7a6fd6', '#59a7b8', '#8a7f6d']

export function RecipientFormModal({ open, onClose, initial, onSaved }) {
  const { add, update } = useBank()
  const editing = !!initial
  const [f, setF] = useState(() => ({
    type: initial?.type || 'business', name: initial?.name || '', bank: initial?.bank || 'Vietcombank',
    account: initial?.account || '', email: initial?.email || '', taxCode: initial?.taxCode || '',
  }))
  const [checking, setChecking] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }))
  const holder = toHolder(f.name)
  const digits = f.account.replace(/\D/g, '')
  const ready = f.name.trim().length > 2 && digits.length >= 6
  const emailErr = f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? 'Email chưa đúng định dạng' : undefined

  // giả lập tra cứu tên chủ tài khoản qua NAPAS khi số tài khoản thay đổi
  useEffect(() => {
    if (!ready) return
    setChecking(true)
    const t = setTimeout(() => setChecking(false), 650)
    return () => clearTimeout(t)
  }, [f.account, f.bank, ready])

  const save = () => {
    const data = { ...f, name: f.name.trim(), account: f.account.trim(), email: f.email.trim(), taxCode: f.type === 'business' ? f.taxCode.trim() : undefined, holder }
    if (editing) {
      update('recipients', initial.id, data)
      toast({ title: 'Đã cập nhật người nhận', desc: data.name })
      onSaved?.({ ...initial, ...data })
    } else {
      const r = { id: newId('p'), ...data, lastPaid: null, total: 0, color: COLORS[data.name.length % COLORS.length] }
      add('recipients', r)
      toast({ title: 'Đã lưu người nhận', desc: r.name })
      onSaved?.(r)
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa người nhận' : 'Thêm người nhận'} desc={editing ? undefined : 'Lưu thông tin để chuyển tiền và thanh toán hoá đơn nhanh hơn.'}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ready || checking || !!emailErr} onClick={save}>{editing ? 'Lưu thay đổi' : 'Lưu người nhận'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Segmented value={f.type} onChange={set('type')} className="self-start"
          options={[{ value: 'business', label: 'Doanh nghiệp', icon: Building2 }, { value: 'person', label: 'Cá nhân', icon: User }]} />
        <Input label={f.type === 'business' ? 'Tên công ty' : 'Họ và tên'} value={f.name} onChange={set('name')} autoFocus
          placeholder={f.type === 'business' ? 'VD: Công ty TNHH Ánh Dương' : 'VD: Nguyễn Văn An'} />
        <div className="grid sm:grid-cols-2 gap-3">
          <Select label="Ngân hàng" value={f.bank} onChange={set('bank')} options={BANKS} />
          <Input label="Số tài khoản" value={f.account} inputMode="numeric" placeholder="0123 4567 89"
            onChange={(e) => setF((x) => ({ ...x, account: e.target.value.replace(/[^\d ]/g, '') }))} />
        </div>
        {ready && (checking
          ? <div className="flex items-center gap-2 rounded-xl bg-subtle px-4 py-3 text-[13.5px] text-muted" role="status"><Loader2 size={16} className="animate-spin" />Đang xác minh với {f.bank}…</div>
          : <Callout tone="pos" icon={ShieldCheck}>Tên chủ tài khoản: <b className="font-[650]">{holder}</b> — khớp với thông tin ngân hàng.</Callout>)}
        {f.type === 'business' && <Input label="Mã số thuế" optional value={f.taxCode} onChange={set('taxCode')} placeholder="0312 345 678" />}
        <Input label="Email nhận thông báo" optional type="email" value={f.email} onChange={set('email')} placeholder="ketoan@congty.vn" error={emailErr}
          hint="Mạch gửi uỷ nhiệm chi đến email này sau mỗi lần thanh toán." />
      </div>
    </Modal>
  )
}
