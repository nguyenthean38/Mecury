/* ==========================================================
   Quy tắc tự động chuyển tiền giữa các tài khoản
   3 loại: giữ số dư mục tiêu · trích % tiền vào · chuyển định kỳ
   ========================================================== */
import { useEffect, useState } from 'react'
import { Target, Percent, CalendarClock, Plus, MoreHorizontal, Pencil, Trash2, ArrowRight, Repeat, Clock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCompact, formatDate, formatRelative } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import {
  Card, Button, IconButton, Toggle, Badge, Modal, Confirm, RadioCards, Select, MoneyInput, Input, Popover, Menu, EmptyState, AccountIcon, Callout,
} from '@/components/ui'

export const RULE_TYPES = {
  target: { label: 'Giữ số dư mục tiêu', icon: Target, desc: 'Tự chuyển phần vượt mức sang tài khoản khác.' },
  percent: { label: 'Trích % tiền vào', icon: Percent, desc: 'Mỗi khoản tiền vào, trích một phần sang quỹ riêng.' },
  schedule: { label: 'Chuyển định kỳ', icon: CalendarClock, desc: 'Chuyển một số tiền cố định vào ngày cố định hằng tháng.' },
}

/** 280000000 → "280 triệu" · 1500000000 → "1,5 tỷ" */
const words = (n) => formatCompact(n).replace(/ tr$/, ' triệu').replace(/ N$/, ' nghìn')

function describe(r, accounts) {
  const from = accounts.find((a) => a.id === r.from)?.name || '—'
  const to = accounts.find((a) => a.id === r.to)?.name || '—'
  if (r.type === 'target') return { title: 'Giữ số dư mục tiêu', desc: `Khi ${from} vượt ${words(r.threshold)}, chuyển phần dư sang ${to}.`, freq: 'Hằng ngày' }
  if (r.type === 'percent') return { title: `Trích ${r.percent}% sang ${to}`, desc: `Trích ${r.percent}% mỗi khoản tiền vào ${from} sang tài khoản ${to}.`, freq: 'Mỗi khoản tiền vào' }
  return { title: `Nạp ${to}`, desc: `Chuyển ${words(r.amount)} từ ${from} sang ${to} vào ngày ${r.day} hằng tháng.`, freq: `Ngày ${r.day} hằng tháng` }
}

const dayOf = (r) => r.day || Number(/\d+/.exec(r.freq || '')?.[0]) || 25

/* ---------- Hộp thoại tạo / sửa quy tắc ---------- */
function RuleModal({ open, rule, onClose }) {
  const accounts = useBank((s) => s.accounts)
  const { add, update } = useBank()
  const blank = { type: 'target', from: 'acc-main', to: 'acc-reserve', threshold: 1500000000, percent: 10, amount: 50000000, day: 1, title: '' }
  const [f, setF] = useState(blank)
  useEffect(() => {
    if (!open) return
    setF(rule ? { ...blank, ...rule, day: dayOf(rule), title: rule.title } : blank)
  }, [open, rule]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const auto = describe(f, accounts)
  const valid = f.from && f.to && f.from !== f.to && (
    f.type === 'target' ? f.threshold >= 1000000 : f.type === 'percent' ? f.percent > 0 && f.percent <= 100 : f.amount >= 100000 && f.day >= 1 && f.day <= 28
  )
  const accOpts = accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))

  const save = () => {
    const base = {
      type: f.type, from: f.from, to: f.to,
      ...(f.type === 'target' && { threshold: f.threshold }),
      ...(f.type === 'percent' && { percent: Number(f.percent) }),
      ...(f.type === 'schedule' && { amount: f.amount, day: Number(f.day) }),
    }
    const d = describe(base, accounts)
    const item = { ...base, title: f.title.trim() || d.title, desc: d.desc, freq: d.freq }
    if (rule) {
      update('rules', rule.id, item)
      toast({ title: 'Đã lưu quy tắc', desc: item.title })
    } else {
      add('rules', { id: newId('r'), ...item, active: true, lastRun: null }, { prepend: false })
      toast({ title: 'Đã tạo quy tắc tự động', desc: 'Quy tắc bắt đầu chạy từ hôm nay.', tone: 'pos' })
    }
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="lg" title={rule ? 'Sửa quy tắc' : 'Tạo quy tắc tự động'}
      desc="Mạch sẽ tự chuyển tiền giữa các tài khoản của bạn theo điều kiện dưới đây."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" disabled={!valid} onClick={save}>{rule ? 'Lưu thay đổi' : 'Tạo quy tắc'}</Button>
      </>}>
      <div className="flex flex-col gap-5">
        <RadioCards columns={3} value={f.type} onChange={set('type')}
          options={Object.entries(RULE_TYPES).map(([value, t]) => ({ value, label: t.label, desc: t.desc, icon: t.icon }))} />

        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <Select label="Từ tài khoản" value={f.from} onChange={set('from')} options={accOpts} />
          <span className="hidden sm:grid h-10 place-items-center text-faint"><ArrowRight size={18} /></span>
          <Select label="Đến tài khoản" value={f.to} onChange={set('to')} options={accOpts.filter((o) => o.value !== f.from)}
            error={f.from === f.to ? 'Chọn tài khoản khác tài khoản nguồn' : undefined} />
        </div>

        {f.type === 'target' && (
          <MoneyInput label="Số dư mục tiêu" value={f.threshold} onChange={set('threshold')}
            hint="Mỗi cuối ngày, phần vượt mức này sẽ được chuyển đi. Số dư không bao giờ thấp hơn mục tiêu." />
        )}
        {f.type === 'percent' && (
          <div className="flex flex-col gap-2">
            <Input label="Tỷ lệ trích" type="number" min={1} max={100} value={f.percent} suffix="%" inputClassName="num"
              onChange={(e) => set('percent')(Math.max(0, Math.min(100, Number(e.target.value))))} />
            <div className="flex gap-2 flex-wrap">
              {[5, 8, 10, 15, 20].map((p) => (
                <button key={p} type="button" onClick={() => set('percent')(p)}
                  className={cn('h-7 rounded-full border px-3 text-[12.5px] num', f.percent === p ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line text-dim hover:bg-subtle')}>
                  {p}%
                </button>
              ))}
            </div>
            <p className="ds-caption">Gợi ý: 10% thường đủ để dành cho thuế GTGT và thuế TNDN tạm tính.</p>
          </div>
        )}
        {f.type === 'schedule' && (
          <div className="grid sm:grid-cols-2 gap-3">
            <MoneyInput label="Số tiền mỗi lần" value={f.amount} onChange={set('amount')} />
            <Select label="Ngày chuyển hằng tháng" value={f.day} onChange={(e) => set('day')(Number(e.target.value))}
              options={Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: `Ngày ${i + 1}` }))} />
          </div>
        )}

        <Input label="Tên quy tắc" optional value={f.title} onChange={set('title')} placeholder={auto.title} maxLength={60} />

        {valid && <Callout tone="brand" icon={Repeat}>{auto.desc}</Callout>}
      </div>
    </Modal>
  )
}

/* ---------- Danh sách quy tắc ---------- */
export function AutoRules() {
  const rules = useBank((s) => s.rules)
  const accounts = useBank((s) => s.accounts)
  const { update, remove } = useBank()
  const [editing, setEditing] = useState(null) // null | 'new' | rule
  const [deleting, setDeleting] = useState(null)

  const toggle = (r, active) => {
    update('rules', r.id, { active })
    toast({ title: active ? 'Đã bật quy tắc' : 'Đã tạm dừng quy tắc', desc: r.title })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-muted text-[13.5px] max-w-xl">Quy tắc chạy tự động, không cần ai bấm duyệt. Mỗi lần chạy đều tạo giao dịch chuyển nội bộ để bạn đối chiếu.</p>
        <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Tạo quy tắc</Button>
      </div>

      {rules.length === 0 ? (
        <Card><EmptyState icon={Repeat} title="Chưa có quy tắc nào" desc="Tạo quy tắc để tự động trích thuế, nạp quỹ lương hoặc gom tiền dư sang tài khoản tiết kiệm."
          action={<Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>Tạo quy tắc đầu tiên</Button>} /></Card>
      ) : (
        <Card padded={false}>
          {rules.map((r) => {
            const T = RULE_TYPES[r.type] || RULE_TYPES.schedule
            const from = accounts.find((a) => a.id === r.from)
            const to = accounts.find((a) => a.id === r.to)
            return (
              <div key={r.id} className={cn('flex items-start gap-4 px-5 py-4 border-b border-line last:border-0', !r.active && 'bg-subtle/50')}>
                <span className={cn('size-10 shrink-0 grid place-items-center rounded-xl', r.active ? 'bg-brand-50 text-brand-ink' : 'bg-subtle text-muted')}>
                  <T.icon size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14.5px] font-[600]">{r.title}</span>
                    <Badge size="sm" tone={r.active ? 'pos' : 'neutral'} dot>{r.active ? 'Đang chạy' : 'Tạm dừng'}</Badge>
                  </div>
                  <p className="text-[13.5px] text-dim mt-0.5">{r.desc}</p>
                  <div className="mt-2.5 flex items-center gap-x-4 gap-y-1.5 flex-wrap ds-caption">
                    <span className="inline-flex items-center gap-1.5">
                      {from && <AccountIcon kind={from.kind} color={from.color} size={18} />}
                      {from?.name || '—'}
                      <ArrowRight size={12} className="text-faint" />
                      {to && <AccountIcon kind={to.kind} color={to.color} size={18} />}
                      {to?.name || '—'}
                    </span>
                    <span className="inline-flex items-center gap-1"><Repeat size={12} />{r.freq}</span>
                    <span className="inline-flex items-center gap-1" title={r.lastRun ? formatDate(r.lastRun) : undefined}>
                      <Clock size={12} />{r.lastRun ? `Lần chạy gần nhất: ${formatRelative(r.lastRun)}` : 'Chưa chạy lần nào'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <label className="inline-flex">
                    <span className="sr-only">Bật hoặc tắt {r.title}</span>
                    <Toggle checked={r.active} onChange={(v) => toggle(r, v)} size="sm" />
                  </label>
                  <Popover align="end" width={200} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} size="sm" label={`Thao tác với ${r.title}`} />}>
                    {(close) => <Menu onClose={close} items={[
                      { label: 'Sửa quy tắc', icon: Pencil, onClick: () => setEditing(r) },
                      { divider: true },
                      { label: 'Xoá quy tắc', icon: Trash2, danger: true, onClick: () => setDeleting(r) },
                    ]} />}
                  </Popover>
                </div>
              </div>
            )
          })}
        </Card>
      )}

      <RuleModal open={!!editing} rule={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} danger confirmLabel="Xoá quy tắc"
        title="Xoá quy tắc này?" desc={deleting ? `“${deleting.title}” sẽ ngừng chạy ngay. Các giao dịch đã chuyển trước đó vẫn được giữ nguyên.` : ''}
        onConfirm={() => { remove('rules', deleting.id); toast({ title: 'Đã xoá quy tắc', desc: deleting.title }) }} />
    </div>
  )
}
