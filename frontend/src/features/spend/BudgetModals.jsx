/* ==========================================================
   Hộp thoại của trang chi tiết ngân sách: chỉnh sửa, thêm thành viên
   ========================================================== */
import { useState } from 'react'
import { useBank, toast, newId } from '@/store'
import { Modal, Button, Input, Textarea, MoneyInput, Segmented, Toggle, Checkbox, Avatar, EmptyState } from '@/components/ui'
import { IconColorPicker } from './BudgetBits'
import { PERIODS, randomLast4 } from './budgetUtils'

export function BudgetEditModal({ budget, open, onClose }) {
  const update = useBank((s) => s.update)
  const [f, setF] = useState(() => ({ ...budget }))
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const ok = f.name.trim().length >= 2 && f.limit >= 100000
  const save = () => {
    update('budgets', budget.id, {
      name: f.name.trim(), icon: f.icon, color: f.color, desc: (f.desc || '').trim(), limit: f.limit, period: f.period, receiptRequired: f.receiptRequired,
    })
    toast({ title: 'Đã lưu thay đổi', desc: f.name.trim() })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa ngân sách" size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>Lưu thay đổi</Button></>}>
      <div className="flex flex-col gap-5">
        <Input label="Tên ngân sách" value={f.name} onChange={set('name')} maxLength={60} />
        <IconColorPicker icon={f.icon} color={f.color} onIcon={set('icon')} onColor={set('color')} />
        <Textarea label="Mô tả" optional value={f.desc || ''} onChange={set('desc')} rows={2} />
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <MoneyInput label="Hạn mức" value={f.limit} onChange={set('limit')} error={f.limit < 100000 ? 'Tối thiểu 100.000 ₫' : undefined} />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-[550] text-dim">Chu kỳ</span>
            <Segmented value={f.period} onChange={set('period')} options={PERIODS} className="h-10" />
          </div>
        </div>
        <Toggle label="Bắt buộc đính kèm chứng từ" desc="Nhắc thành viên chụp hoá đơn sau mỗi giao dịch." checked={!!f.receiptRequired} onChange={set('receiptRequired')} />
      </div>
    </Modal>
  )
}

export function AddMembersModal({ budget, open, onClose }) {
  const team = useBank((s) => s.team)
  const update = useBank((s) => s.update)
  const add = useBank((s) => s.add)
  const [picked, setPicked] = useState([])
  const [issue, setIssue] = useState(!!budget.autoCard)
  const options = team.filter((m) => !budget.members.includes(m.id))
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const save = () => {
    update('budgets', budget.id, { members: [...budget.members, ...picked] })
    if (issue) {
      picked.forEach((m) => add('cards', {
        id: newId('c'), last4: randomLast4(), nickname: budget.name, member: m, type: 'virtual', status: 'active', limit: budget.limit,
        period: budget.period, spent: 0, account: 'acc-main', expiry: '11/29', style: 'ink', budget: budget.id, created: new Date().toISOString().slice(0, 10),
      }))
    }
    toast({ title: `Đã thêm ${picked.length} thành viên`, desc: issue ? 'Thẻ ảo đã được cấp và gửi thông báo.' : budget.name })
    setPicked([])
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Thêm thành viên" desc={`Thành viên mới có thể chi tiêu trong “${budget.name}”.`}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!picked.length} onClick={save}>Thêm {picked.length ? `(${picked.length})` : ''}</Button></>}>
      {options.length ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-line divide-y divide-line">
            {options.map((m) => (
              <div key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-subtle first:rounded-t-xl last:rounded-b-xl">
                <Checkbox checked={picked.includes(m.id)} onChange={() => toggle(m.id)} />
                <Avatar name={m.name} color={m.color} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-[550] truncate">{m.name}</span>
                  <span className="block ds-caption truncate">{m.title}</span>
                </span>
              </div>
            ))}
          </div>
          <Toggle label="Cấp thẻ ảo cho thành viên mới" desc="Thẻ gắn với ngân sách, dùng được ngay trên điện thoại." checked={issue} onChange={setIssue} />
        </div>
      ) : (
        <EmptyState compact title="Mọi thành viên đã tham gia" desc="Mời thêm người vào công ty trong Cài đặt › Thành viên." />
      )}
    </Modal>
  )
}
