/* ==========================================================
   Luồng tạo thẻ: Loại thẻ → Người dùng → Hạn mức → Xem lại
   ========================================================== */
import { useState } from 'react'
import { ArrowRight, Check, Globe, CreditCard, Truck, ShieldCheck, Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND, formatDate, addDays, TODAY } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import { COMPANY, ROLES } from '@/data/org'
import {
  FlowShell, Button, RadioCards, Input, MoneyInput, Select, Textarea, Avatar, KeyValue, Callout, PaymentCard, CARD_STYLE_KEYS, Segmented,
} from '@/components/ui'
import { CardThumb } from './CardThumb'
import { PERIODS, periodLabel } from './CardModals'

const STEPS = ['Loại thẻ', 'Người dùng', 'Hạn mức', 'Xem lại']
const STYLE_NAMES = { jade: 'Ngọc bích', ink: 'Mực tàu', sky: 'Bầu trời', sand: 'Cát trắng' }

function Preview({ card, holder }) {
  return (
    <div className="p-10 pt-14 flex flex-col items-center">
      <div className="ds-label mb-4 self-start">Xem trước</div>
      <PaymentCard card={card} holder={holder?.name} size="lg" />
      <div className="mt-6 w-full max-w-[380px] rounded-2xl border border-line bg-surface p-4 text-[13px]">
        <div className="flex justify-between gap-3 py-1"><span className="text-muted">Tên thẻ</span><span className="font-[550] truncate">{card.nickname || '—'}</span></div>
        <div className="flex justify-between gap-3 py-1"><span className="text-muted">Người dùng</span><span className="font-[550]">{holder?.name || '—'}</span></div>
        <div className="flex justify-between gap-3 py-1"><span className="text-muted">Hạn mức</span><span className="font-[550] num">{card.limit ? `${formatVND(card.limit)} ${periodLabel(card.period)}` : '—'}</span></div>
      </div>
      <p className="ds-caption mt-4 text-center max-w-[340px]">
        {card.type === 'virtual' ? 'Thẻ ảo dùng được ngay cho thanh toán online, Apple Pay và Google Pay.' : 'Thẻ vật lý được giao trong 3–5 ngày làm việc. Trong lúc chờ, bạn vẫn dùng được số thẻ ảo đi kèm.'}
      </p>
    </div>
  )
}

export function CreateCardFlow({ open, onClose, onCreated }) {
  const { team, budgets, accounts, add } = useBank()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(null)
  const [f, setF] = useState({
    type: 'virtual', style: 'jade', member: 'u1', nickname: '', limit: 20000000, period: 'Tháng', budget: '', account: 'acc-main',
    shipName: 'Nguyễn Minh Anh', shipAddress: `${COMPANY.address}, ${COMPANY.ward}, ${COMPANY.city}`,
  })
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const holder = team.find((m) => m.id === f.member)
  const budget = budgets.find((b) => b.id === f.budget)
  const draft = { last4: '••••', nickname: f.nickname, type: f.type, style: f.style, status: 'active', limit: f.limit, period: f.period }
  const activeBudgets = budgets.filter((b) => b.status === 'active' && b.members.includes(f.member))

  const canNext = [
    true,
    !!holder && holder.status === 'active' && f.nickname.trim().length >= 2,
    f.limit >= 100000 && (f.type === 'virtual' || (f.shipName.trim().length > 2 && f.shipAddress.trim().length > 8)),
    true,
  ][step]

  const pickMember = (m) => setF((x) => ({
    ...x, member: m.id, shipName: m.name,
    nickname: x.nickname && !x.nickname.startsWith('Thẻ của ') ? x.nickname : `Thẻ của ${m.name.split(' ').slice(-2).join(' ')}`,
    budget: budgets.some((b) => b.id === x.budget && b.members.includes(m.id)) ? x.budget : '',
  }))

  const submit = () => {
    const exp = addDays(TODAY, 365 * 3)
    const card = {
      id: newId('c'),
      last4: String(1000 + Math.floor(Math.random() * 9000)),
      nickname: f.nickname.trim(),
      member: f.member,
      type: f.type,
      status: 'active',
      limit: f.limit,
      period: f.period,
      spent: 0,
      account: f.account,
      expiry: `${String(exp.getMonth() + 1).padStart(2, '0')}/${String(exp.getFullYear()).slice(2)}`,
      style: f.style,
      budget: f.budget || null,
      created: TODAY.toISOString().slice(0, 10),
      blocked: ['Cờ bạc'],
      ...(f.type === 'physical' ? { shipping: `${f.shipName} · ${f.shipAddress}` } : {}),
    }
    add('cards', card)
    toast({ title: f.type === 'virtual' ? 'Đã tạo thẻ ảo' : 'Đã đặt phát hành thẻ vật lý', desc: `${card.nickname} ••${card.last4}`, tone: 'pos' })
    setDone(card)
  }

  const reset = () => { setDone(null); setStep(0); setF((x) => ({ ...x, nickname: '' })) }

  if (!open) return null

  if (done) {
    return (
      <FlowShell onClose={onClose} title="Tạo thẻ">
        <div className="flex flex-col items-center text-center pt-4">
          <span className="size-16 rounded-full grid place-items-center mb-5 bg-pos-soft text-pos animate-pop-in"><Check size={32} strokeWidth={2.6} /></span>
          <h2 className="ds-h1">{done.type === 'virtual' ? 'Thẻ ảo đã sẵn sàng' : 'Đã đặt phát hành thẻ'}</h2>
          <p className="text-muted mt-2 max-w-md">
            {done.type === 'virtual'
              ? `${holder?.name} có thể dùng thẻ ngay cho thanh toán online. Mạch đã gửi email thông báo cho ${holder?.email}.`
              : `Thẻ sẽ được giao đến ${f.shipName} trước ngày ${formatDate(addDays(TODAY, 5))}. Trong lúc chờ, số thẻ ảo đi kèm dùng được ngay.`}
          </p>
          <div className="mt-7 animate-slide-up"><PaymentCard card={done} holder={holder?.name} size="md" /></div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={reset}>Tạo thẻ khác</Button>
            <Button variant="primary" onClick={() => { onClose(); onCreated?.(done) }}>Xem thẻ</Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  return (
    <FlowShell onClose={onClose} title="Tạo thẻ" steps={STEPS} current={step}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={<Preview card={draft} holder={holder} />}
      footer={<>
        <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        {step === STEPS.length - 1
          ? <Button variant="primary" size="lg" icon={ShieldCheck} onClick={submit}>{f.type === 'virtual' ? 'Tạo thẻ ảo' : 'Đặt phát hành thẻ'}</Button>
          : <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
      </>}>

      {/* xem trước nhỏ khi màn hình hẹp (cột phải bị ẩn) */}
      <div className="xl:hidden flex justify-center mb-8">
        <PaymentCard card={draft} holder={holder?.name} size="md" />
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Bạn cần loại thẻ nào?</h2><p className="text-muted mt-1">Thẻ do Ngân hàng Thịnh An phát hành theo yêu cầu gửi từ Mạch, trừ tiền trực tiếp từ tài khoản công ty và hoàn tiền 1,5%.</p></div>
          <RadioCards value={f.type} onChange={set('type')} options={[
            { value: 'virtual', label: 'Thẻ ảo', desc: 'Dùng ngay cho mua sắm online, quảng cáo, thuê bao phần mềm. Tạo không giới hạn.', icon: Globe },
            { value: 'physical', label: 'Thẻ vật lý', desc: 'Thẻ chip & NFC để quẹt tại cửa hàng, rút tiền ATM. Giao tận nơi miễn phí.', icon: CreditCard },
          ]} />
          <div>
            <div className="text-[13px] font-[550] text-dim mb-2">Màu thẻ</div>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-4 gap-2" role="radiogroup" aria-label="Màu thẻ">
              {CARD_STYLE_KEYS.map((s) => {
                const on = f.style === s
                return (
                  <button key={s} type="button" role="radio" aria-checked={on} onClick={() => set('style')(s)}
                    className={cn('flex flex-col items-center gap-2 rounded-xl border p-2.5 transition-[border,background,box-shadow]',
                      on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
                    <CardThumb card={{ ...draft, style: s, nickname: '' }} scale={0.4} />
                    <span className="text-[12.5px] font-[550]">{STYLE_NAMES[s] || s}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Thẻ dành cho ai?</h2><p className="text-muted mt-1">Người dùng thẻ sẽ nhận thông báo và tự nộp chứng từ cho giao dịch của mình.</p></div>
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Người dùng thẻ">
            {team.map((m) => {
              const on = f.member === m.id
              const blocked = m.status !== 'active'
              return (
                <button key={m.id} type="button" role="radio" aria-checked={on} disabled={blocked} onClick={() => pickMember(m)}
                  className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors disabled:opacity-55 disabled:cursor-not-allowed',
                    on ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-subtle')}>
                  <Avatar name={m.name} color={m.color} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-[550] truncate">{m.name}{m.id === 'u1' && <span className="text-muted font-normal"> (bạn)</span>}</span>
                    <span className="block ds-caption truncate">{blocked ? 'Cần bật xác thực hai lớp trước khi được cấp thẻ' : `${m.title} · ${ROLES[m.role]?.label}`}</span>
                  </span>
                  {on && <Check size={17} className="text-brand-ink shrink-0" />}
                </button>
              )
            })}
          </div>
          <Input label="Tên thẻ" value={f.nickname} onChange={set('nickname')} maxLength={40} placeholder="VD: Quảng cáo Meta, Công tác Hà Nội…"
            hint="Đặt tên theo mục đích để kế toán dễ đối chiếu." />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Hạn mức chi tiêu</h2><p className="text-muted mt-1">Bạn có thể đổi hạn mức bất cứ lúc nào sau khi tạo thẻ.</p></div>
          <div>
            <MoneyInput big value={f.limit} onChange={set('limit')} autoFocus />
            <div className="mt-2 flex flex-wrap gap-2">
              {[5e6, 20e6, 50e6, 100e6].map((v) => (
                <button key={v} type="button" onClick={() => set('limit')(v)}
                  className={cn('h-7 rounded-full border px-3 text-[12.5px] num', f.limit === v ? 'border-brand-400 bg-brand-50 text-brand-ink' : 'border-line text-dim hover:bg-subtle')}>{formatVND(v)}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-[550] text-dim">Chu kỳ đặt lại</span>
            <Segmented value={f.period} onChange={set('period')} className="flex-wrap h-auto" size="sm" options={PERIODS.filter((p) => p !== 'Quý')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Select label="Tài khoản trừ tiền" value={f.account} onChange={set('account')}
              options={accounts.filter((a) => a.kind === 'checking').map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))} />
            <Select label="Gắn vào ngân sách" optional value={f.budget} onChange={set('budget')} placeholder="Không gắn"
              options={activeBudgets.map((b) => ({ value: b.id, label: b.name }))} />
          </div>
          {budget && <Callout tone="brand">Chi tiêu trên thẻ sẽ tính vào ngân sách “{budget.name}” (còn {formatVND(budget.limit - budget.spent)}).</Callout>}
          {f.type === 'physical' && (
            <div className="card p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-[14px] font-[600]"><Truck size={17} className="text-muted" />Địa chỉ giao thẻ</div>
              <Input label="Người nhận" value={f.shipName} onChange={set('shipName')} />
              <Textarea label="Địa chỉ" rows={2} value={f.shipAddress} onChange={set('shipAddress')} />
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Kiểm tra lại</h2><p className="text-muted mt-1">Thẻ sẽ được kích hoạt ngay sau khi bạn xác nhận.</p></div>
          <div className="card p-5">
            <KeyValue items={[
              { label: 'Loại thẻ', value: f.type === 'virtual' ? 'Thẻ ảo' : 'Thẻ vật lý' },
              { label: 'Tên thẻ', value: f.nickname },
              { label: 'Người dùng', value: <span className="inline-flex items-center gap-2"><Avatar name={holder?.name} color={holder?.color} size={20} />{holder?.name}</span> },
              { label: 'Hạn mức', value: <span className="num">{formatVND(f.limit)} {periodLabel(f.period)}</span> },
              { label: 'Tài khoản trừ tiền', value: accounts.find((a) => a.id === f.account)?.name },
              budget && { label: 'Ngân sách', value: budget.name },
              f.type === 'physical' && { label: 'Giao đến', value: <span>{f.shipName}<br /><span className="text-muted">{f.shipAddress}</span></span> },
              { label: 'Phí phát hành', value: 'Miễn phí' },
            ]} />
          </div>
          <Callout tone="neutral" icon={Lock}>Nhóm ngành “Cờ bạc” được chặn mặc định. Bạn có thể đổi trong phần cài đặt thẻ.</Callout>
        </div>
      )}
    </FlowShell>
  )
}
