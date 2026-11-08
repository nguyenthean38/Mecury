/* Quy tắc duyệt chi — /cai-dat/duyet-chi */
import { useState } from 'react'
import { Plus, Ellipsis, Pencil, Trash2, ShieldCheck, ArrowLeftRight, FileText, Receipt, CreditCard, Info } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND } from '@/lib/format'
import { ROLES } from '@/data/org'
import { useBank, toast, newId } from '@/store'
import {
  AvatarStack, Badge, Button, Callout, Card, Checkbox, Confirm, EmptyState, IconButton, Menu, Modal, MoneyInput, Popover, Segmented, Select, Toggle,
} from '@/components/ui'
import { SectionHeader } from './shared'

const SCOPES = [
  { value: 'Chuyển khoản', icon: ArrowLeftRight },
  { value: 'Hoá đơn phải trả', icon: FileText },
  { value: 'Hoàn ứng', icon: Receipt },
  { value: 'Giao dịch thẻ', icon: CreditCard },
]
const scopeIcon = (s) => SCOPES.find((x) => x.value === s)?.icon || ShieldCheck

/** "Trên 50.000.000 ₫" → 50000000 */
const parseAmount = (cond) => Number((cond.match(/[\d.]+/)?.[0] || '0').replace(/\./g, '')) || 0

function RuleModal({ open, rule, onClose }) {
  const { team, add, update } = useBank()
  const eligible = team.filter((m) => m.status === 'active')
  const init = () => rule
    ? { scope: rule.scope, mode: /^Trên/.test(rule.condition) ? 'over' : 'all', amount: parseAmount(rule.condition), approvers: rule.approvers, count: rule.count }
    : { scope: 'Chuyển khoản', mode: 'over', amount: 100000000, approvers: ['u1'], count: 1 }
  const [f, setF] = useState(init)

  const toggleApprover = (id) => setF((x) => {
    const approvers = x.approvers.includes(id) ? x.approvers.filter((a) => a !== id) : [...x.approvers, id]
    return { ...x, approvers, count: Math.min(x.count, Math.max(1, approvers.length)) }
  })
  const ok = f.approvers.length > 0 && (f.mode === 'all' || f.amount > 0)
  const condition = f.mode === 'all' ? (f.scope === 'Hoá đơn phải trả' ? 'Mọi hoá đơn' : 'Mọi khoản') : `Trên ${formatVND(f.amount)}`

  const save = () => {
    const data = { scope: f.scope, condition, approvers: f.approvers, count: f.count }
    if (rule) update('approvals', rule.id, data)
    else add('approvals', { id: newId('ap'), ...data, active: true }, { prepend: false })
    toast({ title: rule ? 'Đã cập nhật quy tắc' : 'Đã tạo quy tắc duyệt chi', desc: `${f.scope} · ${condition}`, tone: 'pos' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title={rule ? 'Sửa quy tắc duyệt chi' : 'Tạo quy tắc duyệt chi'}
      desc="Khoản chi khớp điều kiện sẽ chờ đủ người duyệt trước khi Mạch thực hiện."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>{rule ? 'Lưu quy tắc' : 'Tạo quy tắc'}</Button></>}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="text-[13px] font-[550] text-dim mb-1.5">Áp dụng cho</div>
          <div className="grid grid-cols-2 gap-2">
            {SCOPES.map((s) => {
              const on = f.scope === s.value
              const I = s.icon
              return (
                <button key={s.value} type="button" role="radio" aria-checked={on} onClick={() => setF({ ...f, scope: s.value })}
                  className={cn('flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-[13.5px] font-[550] transition-[border,background]',
                    on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong hover:border-faint')}>
                  <I size={16} className={on ? 'text-brand-ink' : 'text-muted'} />{s.value}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="text-[13px] font-[550] text-dim">Điều kiện</div>
          <Segmented value={f.mode} onChange={(mode) => setF({ ...f, mode })} options={[{ value: 'over', label: 'Khi số tiền vượt' }, { value: 'all', label: 'Mọi khoản' }]} />
          {f.mode === 'over' && <MoneyInput value={f.amount} onChange={(amount) => setF({ ...f, amount })} hint="Áp dụng cho từng khoản, không cộng dồn." />}
        </div>
        <div>
          <div className="text-[13px] font-[550] text-dim mb-1.5">Người duyệt</div>
          <div className="flex flex-col rounded-xl border border-line divide-y divide-line max-h-[220px] overflow-y-auto">
            {eligible.map((m) => (
              <div key={m.id} className="px-3.5 py-2.5">
                <Checkbox checked={f.approvers.includes(m.id)} onChange={() => toggleApprover(m.id)} label={m.name} desc={`${m.title} · ${ROLES[m.role]?.label}`} />
              </div>
            ))}
          </div>
        </div>
        <Select label="Số người cần duyệt" value={String(f.count)} onChange={(e) => setF({ ...f, count: Number(e.target.value) })}
          options={Array.from({ length: Math.max(1, f.approvers.length) }, (_, i) => ({ value: String(i + 1), label: i + 1 === f.approvers.length && i > 0 ? `Tất cả ${i + 1} người` : `${i + 1} người` }))} />
      </div>
    </Modal>
  )
}

export function ApprovalsSection() {
  const { approvals, team, update, remove } = useBank()
  const [edit, setEdit] = useState(null) // null | 'new' | rule
  const [del, setDel] = useState(null)
  const people = (ids) => ids.map((id) => team.find((m) => m.id === id)).filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Quy tắc duyệt chi" desc="Đặt ngưỡng số tiền cần duyệt cho chuyển khoản, hoá đơn và hoàn ứng."
        action={<Button variant="primary" icon={Plus} onClick={() => setEdit('new')}>Tạo quy tắc</Button>} />

      <Callout tone="info" icon={Info}>Người tạo yêu cầu không thể tự duyệt khoản chi của mình. Khi nhiều quy tắc cùng khớp, Mạch áp dụng quy tắc chặt nhất.</Callout>

      {approvals.length === 0 ? (
        <Card><EmptyState icon={ShieldCheck} title="Chưa có quy tắc duyệt chi" desc="Mọi khoản chi sẽ được thực hiện ngay khi người có quyền xác nhận."
          action={<Button variant="primary" icon={Plus} onClick={() => setEdit('new')}>Tạo quy tắc đầu tiên</Button>} /></Card>
      ) : (
        <Card padded={false} className="divide-y divide-line">
          {approvals.map((r) => {
            const I = scopeIcon(r.scope)
            const ps = people(r.approvers)
            return (
              <div key={r.id} className={cn('flex items-center gap-4 px-5 py-4 transition-opacity', !r.active && 'opacity-60')}>
                <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-subtle text-dim"><I size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-[600]">{r.scope}</span>
                    <span className="text-muted text-[13.5px]">·</span>
                    <span className="text-[13.5px] num">{r.condition}</span>
                    {!r.active && <Badge size="sm">Đang tắt</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <AvatarStack people={ps} size={22} />
                    <span className="ds-caption">
                      {r.count >= ps.length && ps.length > 1 ? `Cần cả ${ps.length} người duyệt` : `Cần ${r.count}/${ps.length} người duyệt`}
                      <span className="hidden sm:inline"> · {ps.map((p) => p.name.split(' ').slice(-2).join(' ')).join(', ')}</span>
                    </span>
                  </div>
                </div>
                <Toggle size="sm" checked={r.active} onChange={(v) => { update('approvals', r.id, { active: v }); toast(v ? 'Đã bật quy tắc' : 'Đã tắt quy tắc') }} />
                <Popover align="end" width={180} trigger={(p) => <IconButton {...p} icon={Ellipsis} size="sm" label="Thao tác với quy tắc" />}>
                  {(close) => <Menu onClose={close} items={[
                    { label: 'Sửa quy tắc', icon: Pencil, onClick: () => setEdit(r) },
                    { divider: true },
                    { label: 'Xoá quy tắc', icon: Trash2, danger: true, onClick: () => setDel(r) },
                  ]} />}
                </Popover>
              </div>
            )
          })}
        </Card>
      )}

      {edit && <RuleModal key={edit === 'new' ? 'new' : edit.id} open rule={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
      <Confirm open={!!del} onClose={() => setDel(null)} danger confirmLabel="Xoá quy tắc"
        title="Xoá quy tắc duyệt chi?" desc={del ? `${del.scope} · ${del.condition}. Các yêu cầu đang chờ duyệt vẫn giữ nguyên.` : ''}
        onConfirm={() => { remove('approvals', del.id); toast('Đã xoá quy tắc') }} />
    </div>
  )
}
