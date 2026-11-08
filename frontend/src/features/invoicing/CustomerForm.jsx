/* Biểu mẫu khách hàng (thêm / sửa) — tra cứu mã số thuế mô phỏng */
import { useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useBank, toast, newId } from '@/store'
import { Button, Input, Modal, Callout, Textarea } from '@/components/ui'
import { TODAY_ISO } from './helpers'

const COLORS = ['#6d8f3a', '#7a6fd6', '#3f8f8a', '#4f7fe0', '#c2588a', '#138f66', '#59a7b8', '#d99a2b']

/** Kết quả tra cứu giả lập theo MST */
const LOOKUP = {
  '0312 456 789': { name: 'Công ty TNHH Cà Phê Phố Núi', address: '36 Lý Tự Trọng, Phường Sài Gòn, TP. Hồ Chí Minh' },
}
function fakeLookup(tax) {
  const digits = tax.replace(/\D/g, '')
  if (LOOKUP[tax]) return LOOKUP[tax]
  const names = ['Công ty TNHH Ánh Dương Sáng', 'CTCP Giải Pháp Lúa Vàng', 'Công ty TNHH Thương Mại Biển Xanh', 'CTCP Nội Thất Gỗ Mộc An']
  const addr = ['88 Hai Bà Trưng, Phường Bến Nghé, TP. Hồ Chí Minh', '12 Tràng Tiền, Phường Hoàn Kiếm, Hà Nội', '204 Bạch Đằng, Phường Hải Châu, Đà Nẵng', '5 Nguyễn Văn Linh, Phường Tân Phong, TP. Hồ Chí Minh']
  const k = Number(digits.slice(-2)) % names.length
  return { name: names[k], address: addr[k] }
}
export const formatTax = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 13)
  return [d.slice(0, 4), d.slice(4, 7), d.slice(7, 10), d.slice(10)].filter(Boolean).join(' ')
}

const empty = { name: '', contact: '', email: '', taxCode: '', address: '' }

/**
 * <CustomerForm initial onSaved onCancel /> — dùng trong hộp thoại hoặc nhúng trực tiếp.
 */
export function CustomerForm({ initial, onSaved, onCancel, submitLabel, inline }) {
  const { add, update } = useBank()
  const [f, setF] = useState({ ...empty, ...initial })
  const [looking, setLooking] = useState(false)
  const [found, setFound] = useState(false)
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const editing = !!initial?.id
  const emailOk = !f.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)
  const ok = f.name.trim().length > 2 && emailOk

  const lookup = () => {
    setLooking(true)
    setTimeout(() => {
      const r = fakeLookup(f.taxCode)
      setF((x) => ({ ...x, name: x.name || r.name, address: x.address || r.address }))
      setLooking(false)
      setFound(true)
    }, 700)
  }

  const save = () => {
    if (editing) {
      update('customers', initial.id, f)
      toast({ title: 'Đã cập nhật khách hàng', desc: f.name })
      onSaved?.({ ...initial, ...f })
    } else {
      const c = { id: newId('k'), ...f, color: COLORS[Math.floor(Math.random() * COLORS.length)], since: TODAY_ISO }
      add('customers', c, { prepend: false })
      toast({ title: 'Đã thêm khách hàng', desc: c.name, tone: 'pos' })
      onSaved?.(c)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Mã số thuế" value={f.taxCode} onChange={(e) => { setFound(false); setF((x) => ({ ...x, taxCode: formatTax(e.target.value) })) }}
        inputMode="numeric" placeholder="VD: 0312 456 789" autoFocus={!editing}
        hint="Nhập MST để tự điền tên và địa chỉ đăng ký kinh doanh." />
      <div className="-mt-2">
        <Button size="sm" variant="outline" icon={Search} loading={looking} disabled={f.taxCode.replace(/\D/g, '').length < 10} onClick={lookup}>Tra cứu MST</Button>
      </div>
      {found && <Callout tone="pos" icon={ShieldCheck}>Đã tìm thấy doanh nghiệp đang hoạt động trên Cổng thông tin quốc gia về đăng ký doanh nghiệp.</Callout>}
      <Input label="Tên khách hàng" value={f.name} onChange={set('name')} placeholder="VD: Công ty TNHH Hạt Mầm" />
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Người liên hệ" optional value={f.contact} onChange={set('contact')} placeholder="Họ và tên" />
        <Input label="Email nhận hoá đơn" value={f.email} onChange={set('email')} placeholder="ketoan@congty.vn" type="email" error={emailOk ? null : 'Email chưa đúng định dạng'} />
      </div>
      <Textarea label="Địa chỉ" rows={2} value={f.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant={inline ? 'ghost' : 'secondary'} onClick={onCancel}>Huỷ</Button>
        <Button variant="primary" disabled={!ok} onClick={save}>{submitLabel || (editing ? 'Lưu thay đổi' : 'Thêm khách hàng')}</Button>
      </div>
    </div>
  )
}

/** Hộp thoại thêm / sửa khách hàng */
export function CustomerModal({ open, onClose, initial, onSaved }) {
  if (!open) return null
  return (
    <Modal open onClose={onClose} title={initial?.id ? 'Sửa khách hàng' : 'Thêm khách hàng'} desc="Thông tin này được in lên hoá đơn gửi cho khách.">
      <CustomerForm initial={initial} onCancel={onClose} onSaved={(c) => { onSaved?.(c); onClose() }} />
    </Modal>
  )
}
