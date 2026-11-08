/* ==========================================================
   Cài đặt chính sách hoàn ứng (lưu theo trình duyệt của người xem)
   ========================================================== */
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Check } from 'lucide-react'
import { useBank, toast } from '@/store'
import { categoryList } from '@/data/transactions'
import { Modal, Button, Select, Input, Avatar } from '@/components/ui'

const KEY = 'mach-reimb-policy'
export const DEFAULT_POLICY = { approver: 'u2', deadline: 30, categories: ['travel', 'meals', 'office', 'software', 'marketing'], payout: 'acc-main' }
export const REIMB_CATS = categoryList.filter((c) => !['revenue', 'transfer', 'interest', 'payroll', 'tax', 'rent'].includes(c.id))

export function loadPolicy() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_POLICY, ...JSON.parse(raw) } : DEFAULT_POLICY
  } catch {
    return DEFAULT_POLICY
  }
}
function savePolicy(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch { /* bỏ qua khi trình duyệt chặn lưu trữ */ }
}

export function ReimbursementSettings({ open, onClose, policy, onChange }) {
  const team = useBank((s) => s.team)
  const accounts = useBank((s) => s.accounts)
  const [f, setF] = useState(policy)
  const approvers = team.filter((m) => ['admin', 'bookkeeper'].includes(m.role))
  const approver = team.find((m) => m.id === f.approver)
  const toggle = (id) => setF((x) => ({ ...x, categories: x.categories.includes(id) ? x.categories.filter((c) => c !== id) : [...x.categories, id] }))
  const ok = f.deadline >= 1 && f.deadline <= 365 && f.categories.length > 0
  const save = () => {
    savePolicy(f)
    onChange(f)
    toast({ title: 'Đã lưu chính sách hoàn ứng', desc: `Người duyệt: ${approver?.name}` })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} size="lg" title="Chính sách hoàn ứng" desc="Áp dụng cho mọi yêu cầu nộp từ hôm nay."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>Lưu chính sách</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Select label="Người duyệt" value={f.approver} onChange={(e) => setF({ ...f, approver: e.target.value })}
              options={approvers.map((m) => ({ value: m.id, label: m.name + (m.id === 'u1' ? ' (bạn)' : '') }))} />
            {approver && <span className="inline-flex items-center gap-1.5 ds-caption"><Avatar name={approver.name} color={approver.color} size={16} />{approver.title}</span>}
          </div>
          <Input label="Hạn nộp chứng từ" type="number" min={1} max={365} value={f.deadline} suffix="ngày"
            onChange={(e) => setF({ ...f, deadline: Number(e.target.value) })} hint="Tính từ ngày chi tiêu"
            error={f.deadline < 1 || f.deadline > 365 ? 'Từ 1 đến 365 ngày' : undefined} />
        </div>
        <Select label="Tài khoản chi trả" value={f.payout} onChange={(e) => setF({ ...f, payout: e.target.value })}
          options={accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))} hint="Tiền hoàn ứng được chuyển từ tài khoản này." />
        <div>
          <div className="text-[13px] font-[550] text-dim mb-2">Danh mục được hoàn</div>
          <div className="flex flex-wrap gap-2">
            {REIMB_CATS.map((c) => {
              const on = f.categories.includes(c.id)
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => toggle(c.id)}
                  className={cn('h-8 inline-flex items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors',
                    on ? 'border-brand-400 bg-brand-50 text-brand-ink font-[550]' : 'border-line-strong text-dim hover:bg-subtle')}>
                  {on && <Check size={13} strokeWidth={2.6} />}{c.label}
                </button>
              )
            })}
          </div>
          {!f.categories.length && <p className="text-[12.5px] text-neg mt-2">Chọn ít nhất một danh mục.</p>}
        </div>
      </div>
    </Modal>
  )
}
