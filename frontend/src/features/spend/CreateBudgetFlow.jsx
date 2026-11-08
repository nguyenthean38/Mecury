/* ==========================================================
   Luồng tạo ngân sách nhóm (FlowShell 4 bước)
   Mẫu → Chi tiết → Thành viên → Quy tắc → màn hình thành công
   ========================================================== */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Plus, Sparkles, CreditCard } from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY, formatDate, formatVND } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import { BUDGET_TEMPLATES } from '@/data/spend'
import { categoryList } from '@/data/transactions'
import {
  Button, FlowShell, Input, Textarea, MoneyInput, Segmented, Checkbox, Toggle, Avatar, KeyValue, Callout, Badge,
} from '@/components/ui'
import { BudgetIcon, IconColorPicker, BudgetPreview } from './BudgetBits'
import { PERIODS, PERIOD_LABEL, TEMPLATE_PRESETS, randomLast4 } from './budgetUtils'

const STEPS = ['Chọn mẫu', 'Chi tiết', 'Thành viên', 'Quy tắc']
const SPEND_CATS = categoryList.filter((c) => !['revenue', 'transfer', 'interest', 'payroll', 'tax'].includes(c.id))

const blank = () => ({
  template: null, name: '', icon: 'Briefcase', color: '#138f66', desc: '', limit: 0, period: 'Tháng',
  start: TODAY.toISOString().slice(0, 10), members: ['u1'], memberLimits: {}, receiptRequired: true, categories: [], autoCard: true,
})

export function CreateBudgetFlow({ onClose }) {
  const navigate = useNavigate()
  const team = useBank((s) => s.team)
  const add = useBank((s) => s.add)
  const [step, setStep] = useState(0)
  const [f, setF] = useState(blank)
  const [done, setDone] = useState(null)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const pickTemplate = (t) => {
    if (t === 'custom') setF((x) => ({ ...blank(), template: 'custom', members: x.members }))
    else {
      const p = TEMPLATE_PRESETS[t.name] || {}
      setF((x) => ({ ...x, template: t.name, name: t.name, icon: t.icon, desc: t.desc + '.', color: p.color || x.color, categories: p.categories || [], limit: x.limit || p.limit || 0 }))
    }
    setStep(1)
  }

  const toggleMember = (id) => setF((x) => ({ ...x, members: x.members.includes(id) ? x.members.filter((m) => m !== id) : [...x.members, id] }))
  const toggleCat = (id) => setF((x) => ({ ...x, categories: x.categories.includes(id) ? x.categories.filter((c) => c !== id) : [...x.categories, id] }))
  const overMember = f.members.some((m) => (f.memberLimits[m] || 0) > f.limit)

  const canNext = [true, f.name.trim().length >= 2 && f.limit >= 100000, f.members.length > 0 && !overMember, true][step]
  const last = step === STEPS.length - 1

  const submit = () => {
    const id = newId('b')
    const budget = {
      id, name: f.name.trim(), icon: f.icon, color: f.color, limit: f.limit, period: f.period, spent: 0,
      members: f.members, owner: 'u1', desc: f.desc.trim(), receiptRequired: f.receiptRequired, status: 'active',
      created: TODAY.toISOString().slice(0, 10), start: f.start, categories: f.categories, memberLimits: f.memberLimits, autoCard: f.autoCard,
    }
    add('budgets', budget)
    const issued = []
    if (f.autoCard) {
      f.members.forEach((m, i) => {
        const card = {
          id: newId('c'), last4: randomLast4(), nickname: budget.name, member: m, type: 'virtual', status: 'active',
          limit: f.memberLimits[m] || f.limit, period: f.period, spent: 0, account: 'acc-main', expiry: '11/29',
          style: ['jade', 'ink', 'sky'][i % 3], budget: id, created: budget.created,
        }
        add('cards', card)
        issued.push(card)
      })
    }
    toast({ title: 'Đã tạo ngân sách', desc: budget.name })
    setDone({ budget, issued })
  }

  if (done) {
    return (
      <FlowShell onClose={onClose} title="Tạo ngân sách">
        <div className="flex flex-col items-center text-center pt-6">
          <span className="size-16 rounded-full grid place-items-center mb-5 bg-pos-soft text-pos animate-pop-in"><Check size={32} strokeWidth={2.6} /></span>
          <h2 className="ds-h1">Ngân sách đã sẵn sàng</h2>
          <p className="text-muted mt-2 max-w-md">
            {done.budget.members.length} thành viên đã có thể chi tiêu trong “{done.budget.name}”.
            {done.issued.length ? ` Mạch đã cấp ${done.issued.length} thẻ ảo gắn với ngân sách này.` : ''}
          </p>
          <div className="mt-7 w-full card p-5 text-left">
            <div className="flex items-center gap-3">
              <BudgetIcon icon={done.budget.icon} color={done.budget.color} size={40} />
              <div className="min-w-0 flex-1">
                <div className="font-[600] truncate">{done.budget.name}</div>
                <div className="ds-caption">{PERIOD_LABEL[done.budget.period]} · bắt đầu {formatDate(done.budget.start)}</div>
              </div>
              <span className="num text-[18px] font-[500]">{formatVND(done.budget.limit)}</span>
            </div>
            {done.issued.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line flex flex-wrap gap-1.5">
                {done.issued.map((c) => {
                  const m = team.find((x) => x.id === c.member)
                  return <Badge key={c.id} icon={CreditCard}>{m?.name} ••{c.last4}</Badge>
                })}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => { setDone(null); setStep(0); setF(blank()) }}>Tạo ngân sách khác</Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => { onClose(); navigate(`/chi-tieu-nhom/${done.budget.id}`) }}>Xem ngân sách</Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  return (
    <FlowShell
      onClose={onClose}
      title="Tạo ngân sách"
      steps={STEPS}
      current={step}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={<BudgetPreview f={f} team={team} />}
      footer={<>
        <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        {step === 0 ? (f.template && <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={() => setStep(1)}>Tiếp tục</Button>) : last
          ? <Button variant="primary" size="lg" icon={Check} onClick={submit}>Tạo ngân sách</Button>
          : <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
      </>}
    >
      {/* ---- Bước 1: mẫu ---- */}
      {step === 0 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Bắt đầu từ một mẫu</h2><p className="text-muted mt-1">Mẫu điền sẵn tên, biểu tượng và danh mục phù hợp. Bạn có thể chỉnh lại ở bước sau.</p></div>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {BUDGET_TEMPLATES.map((t) => {
              const p = TEMPLATE_PRESETS[t.name] || {}
              const on = f.template === t.name
              return (
                <button key={t.name} type="button" onClick={() => pickTemplate(t)}
                  className={cn('flex items-start gap-3 rounded-xl border p-4 text-left transition-[border,background,box-shadow]',
                    on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
                  <BudgetIcon icon={t.icon} color={p.color} size={38} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-[550]">{t.name}</span>
                    <span className="block ds-caption mt-0.5">{t.desc}</span>
                  </span>
                </button>
              )
            })}
            <button type="button" onClick={() => pickTemplate('custom')}
              className={cn('flex items-start gap-3 rounded-xl border border-dashed p-4 text-left transition-colors',
                f.template === 'custom' ? 'border-brand-400 bg-brand-50' : 'border-line-strong hover:bg-subtle')}>
              <span className="size-[38px] rounded-xl grid place-items-center bg-subtle text-muted shrink-0"><Plus size={18} /></span>
              <span className="min-w-0">
                <span className="block text-[14px] font-[550]">Tự tạo</span>
                <span className="block ds-caption mt-0.5">Bắt đầu từ trang trắng</span>
              </span>
            </button>
          </div>
          <Callout tone="brand" icon={Sparkles}>Mỗi ngân sách có thể gắn nhiều thẻ — một người vẫn dùng một thẻ cho nhiều ngân sách khác nhau.</Callout>
        </div>
      )}

      {/* ---- Bước 2: chi tiết ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Chi tiết ngân sách</h2><p className="text-muted mt-1">Đặt tên dễ hiểu để thành viên biết nên chi khoản gì.</p></div>
          <Input label="Tên ngân sách" value={f.name} onChange={set('name')} placeholder="VD: Marketing quý 1" maxLength={60} autoFocus />
          <IconColorPicker icon={f.icon} color={f.color} onIcon={set('icon')} onColor={set('color')} />
          <Textarea label="Mô tả" optional value={f.desc} onChange={set('desc')} placeholder="Ngân sách dùng cho việc gì?" rows={2} />
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <MoneyInput label="Hạn mức" value={f.limit} onChange={set('limit')} error={f.limit > 0 && f.limit < 100000 ? 'Tối thiểu 100.000 ₫' : undefined} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-[550] text-dim">Chu kỳ</span>
              <Segmented value={f.period} onChange={set('period')} options={PERIODS} className="h-10" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 -mt-2">
            {[10e6, 30e6, 50e6, 100e6].map((v) => (
              <button key={v} type="button" onClick={() => set('limit')(v)} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-dim hover:bg-subtle num">{formatVND(v)}</button>
            ))}
          </div>
          <Input type="date" label="Ngày bắt đầu" value={f.start} onChange={set('start')} hint={f.period === 'Trọn đời' ? 'Ngân sách dùng đến khi hết hạn mức.' : `Hạn mức đặt lại vào đầu mỗi ${f.period.toLowerCase()}.`} className="sm:max-w-[240px]" />
        </div>
      )}

      {/* ---- Bước 3: thành viên ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Ai được chi tiêu?</h2><p className="text-muted mt-1">Chọn thành viên và đặt hạn mức riêng nếu cần. Để trống nghĩa là dùng chung hạn mức nhóm.</p></div>
          <div className="card divide-y divide-line">
            {team.map((m) => {
              const on = f.members.includes(m.id)
              const lim = f.memberLimits[m.id] || 0
              return (
                <div key={m.id} className={cn('flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3 transition-colors', on && 'bg-subtle/60')}>
                  <Checkbox checked={on} onChange={() => toggleMember(m.id)} />
                  <button type="button" onClick={() => toggleMember(m.id)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                    <Avatar name={m.name} color={m.color} size={32} />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-[550] truncate">{m.name}{m.id === 'u1' && <span className="text-muted font-normal"> (bạn)</span>}</span>
                      <span className="block ds-caption truncate">{m.title}{m.status === 'invited' ? ' · Đã mời' : ''}</span>
                    </span>
                  </button>
                  {on && (
                    <MoneyInput size="sm" value={lim} placeholder="Hạn mức riêng" className="w-full sm:w-44 animate-fade-in"
                      error={lim > f.limit ? 'Vượt hạn mức nhóm' : undefined}
                      onChange={(v) => setF((x) => ({ ...x, memberLimits: { ...x.memberLimits, [m.id]: v } }))} />
                  )}
                </div>
              )
            })}
          </div>
          {!f.members.length && <p className="text-[13px] text-neg">Chọn ít nhất một thành viên.</p>}
        </div>
      )}

      {/* ---- Bước 4: quy tắc ---- */}
      {step === 3 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Quy tắc chi tiêu</h2><p className="text-muted mt-1">Giúp kế toán đỡ phải nhắc và giữ chi tiêu đúng mục đích.</p></div>
          <div className="card p-5 flex flex-col gap-5">
            <Toggle label="Bắt buộc đính kèm chứng từ" desc="Nhắc thành viên chụp hoá đơn trong 48 giờ sau mỗi giao dịch." checked={f.receiptRequired} onChange={set('receiptRequired')} />
            <div className="h-px bg-line" />
            <Toggle label="Tự động cấp thẻ ảo" desc={`Mỗi thành viên nhận một thẻ ảo gắn với ngân sách (${f.members.length} thẻ).`} checked={f.autoCard} onChange={set('autoCard')} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-[550] text-dim">Danh mục được phép</span>
              {f.categories.length > 0 && <button type="button" onClick={() => set('categories')([])} className="text-[12.5px] font-[550] text-brand-ink hover:underline">Cho phép tất cả</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {SPEND_CATS.map((c) => {
                const on = f.categories.includes(c.id)
                return (
                  <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleCat(c.id)}
                    className={cn('h-8 inline-flex items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors',
                      on ? 'border-brand-400 bg-brand-50 text-brand-ink font-[550]' : 'border-line-strong text-dim hover:bg-subtle')}>
                    {on && <Check size={13} strokeWidth={2.6} />}{c.label}
                  </button>
                )
              })}
            </div>
            <p className="ds-caption mt-2">{f.categories.length ? `Giao dịch ngoài ${f.categories.length} danh mục đã chọn sẽ bị từ chối.` : 'Chưa giới hạn — mọi danh mục chi tiêu đều được chấp nhận.'}</p>
          </div>
          <div className="card p-5">
            <div className="ds-label mb-1">Tóm tắt</div>
            <KeyValue items={[
              { label: 'Tên', value: f.name },
              { label: 'Hạn mức', value: `${formatVND(f.limit)} · ${PERIOD_LABEL[f.period].toLowerCase()}` },
              { label: 'Bắt đầu', value: formatDate(f.start) },
              { label: 'Thành viên', value: `${f.members.length} người` },
              { label: 'Người duyệt', value: 'Nguyễn Minh Anh (bạn)' },
            ]} />
          </div>
        </div>
      )}
    </FlowShell>
  )
}
