/* ==========================================================
   Luồng chuyển tiền (dùng chung toàn ứng dụng)
   Mở bằng useUI.getState().openMoveMoney(mode, preset)
   mode: send (đến người nhận) | transfer (giữa tài khoản) | deposit (nhận tiền: thông tin TK + VietQR) | request (yêu cầu thanh toán)
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Check, ArrowRight, Copy, Repeat, CalendarClock, Zap, ShieldCheck, Clock, Building2, User, Link2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND, formatDate, readVND, TODAY, addDays, stripAccents } from '@/lib/format'
import { useBank, useUI, toast, newId } from '@/store'
import { categoryList } from '@/data/transactions'
import { BANKS } from '@/data/payments'
import { COMPANY } from '@/data/org'
import {
  Avatar, Button, FlowShell, Modal, MoneyInput, Input, Select, Textarea, RadioCards, FileDrop, Toggle, KeyValue, Callout, Money,
  AccountIcon, OtpInput, QrCode, Segmented,
} from '@/components/ui'

/* ---------- Chọn tài khoản nguồn / đích ---------- */
function AccountPicker({ value, onChange, exclude, label }) {
  const accounts = useBank((s) => s.accounts)
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-[13px] font-[550] text-dim">{label}</span>}
      <div className="flex flex-col gap-2">
        {accounts.filter((a) => a.id !== exclude).map((a) => {
          const on = value === a.id
          return (
            <button key={a.id} type="button" onClick={() => onChange(a.id)}
              className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border,background,box-shadow]',
                on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
              <AccountIcon kind={a.kind} color={a.color} size={34} />
              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-[550]">{a.name} <span className="text-muted font-normal">••{a.last4}</span></span>
                <span className="block ds-caption">{a.bank}</span>
              </span>
              <Money value={a.balance} className="text-[14px] font-[550]" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Bản xem trước uỷ nhiệm chi (cột phải) ---------- */
function Slip({ from, recipient, toAcc, amount, memo, date, method }) {
  const accounts = useBank((s) => s.accounts)
  const src = accounts.find((a) => a.id === from)
  const dst = accounts.find((a) => a.id === toAcc)
  return (
    <div className="p-10 pt-14">
      <div className="ds-label mb-3">Xem trước</div>
      <div className="rounded-2xl bg-surface border border-line shadow-md p-7 [--qr-bg:var(--c-surface)]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[.14em] uppercase text-muted font-[600]">Uỷ nhiệm chi</div>
            <div className="text-[13px] text-faint mt-1">Ngày {formatDate(date || TODAY)}</div>
          </div>
          <span className="rounded-md bg-brand-50 text-brand-ink text-[11px] font-[650] px-2 py-1">{method === 'interbank' ? 'Chuyển thường' : method === 'internal' ? 'Nội bộ' : 'NAPAS 24/7'}</span>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-6 text-[13px]">
          <div>
            <div className="text-faint mb-1">Từ</div>
            <div className="font-[600]">{COMPANY.short}</div>
            <div className="text-muted">{src ? `${src.name} ••${src.last4}` : '—'}</div>
            <div className="text-muted">{src?.bank}</div>
          </div>
          <div>
            <div className="text-faint mb-1">Đến</div>
            <div className="font-[600]">{dst ? COMPANY.short : recipient?.name || <span className="skeleton inline-block w-28 h-3.5 align-middle" />}</div>
            <div className="text-muted">{dst ? `${dst.name} ••${dst.last4}` : recipient ? recipient.account : ''}</div>
            <div className="text-muted">{dst ? dst.bank : recipient?.bank}</div>
          </div>
        </div>
        <div className="mt-8 border-t border-dashed border-line-strong pt-5">
          <div className="text-faint text-[13px]">Số tiền</div>
          <div className="text-[30px] font-[500] tracking-tight num mt-0.5">{formatVND(amount || 0)}</div>
          <div className="text-[12.5px] text-muted italic mt-1">{amount ? readVND(amount) : 'Không đồng'}</div>
        </div>
        <div className="mt-5 text-[13px]">
          <div className="text-faint">Nội dung</div>
          <div className="mt-0.5 font-mono text-[12.5px] uppercase">{memo || '—'}</div>
        </div>
      </div>
      <p className="ds-caption mt-4 text-center">Người nhận sẽ thấy tên công ty và nội dung chuyển khoản ở trên.</p>
    </div>
  )
}

/* ---------- Thêm người nhận mới ---------- */
function NewRecipient({ onDone, onCancel }) {
  const add = useBank((s) => s.add)
  const [f, setF] = useState({ type: 'business', name: '', bank: 'Vietcombank', account: '', email: '' })
  const holder = stripAccents(f.name).toUpperCase()
  const ok = f.name.trim().length > 2 && f.account.replace(/\D/g, '').length >= 6
  const save = () => {
    const r = { id: newId('p'), ...f, holder, lastPaid: null, total: 0, color: '#4f7fe0' }
    add('recipients', r)
    toast({ title: 'Đã lưu người nhận', desc: r.name })
    onDone(r)
  }
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 animate-pop-in">
      <div className="ds-h3">Người nhận mới</div>
      <Segmented value={f.type} onChange={(type) => setF({ ...f, type })} options={[{ value: 'business', label: 'Doanh nghiệp', icon: Building2 }, { value: 'person', label: 'Cá nhân', icon: User }]} />
      <Input label={f.type === 'business' ? 'Tên công ty' : 'Họ và tên'} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder={f.type === 'business' ? 'VD: Công ty TNHH Ánh Dương' : 'VD: Nguyễn Văn An'} autoFocus />
      <div className="grid sm:grid-cols-2 gap-3">
        <Select label="Ngân hàng" value={f.bank} onChange={(e) => setF({ ...f, bank: e.target.value })} options={BANKS} />
        <Input label="Số tài khoản" value={f.account} onChange={(e) => setF({ ...f, account: e.target.value.replace(/[^\d ]/g, '') })} inputMode="numeric" placeholder="0123 4567 89" />
      </div>
      {f.name.length > 2 && f.account.length >= 6 && (
        <Callout tone="pos" icon={ShieldCheck}>Tên chủ tài khoản: <b className="font-[650]">{holder}</b> — khớp với thông tin ngân hàng.</Callout>
      )}
      <Input label="Email nhận thông báo" optional value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="ketoan@congty.vn" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Huỷ</Button>
        <Button variant="primary" disabled={!ok} onClick={save}>Lưu người nhận</Button>
      </div>
    </div>
  )
}

/* ---------- Luồng gửi tiền ---------- */
function SendFlow({ onClose, preset }) {
  const navigate = useNavigate()
  const { recipients, accounts, transfer } = useBank()
  const internal = preset.mode === 'transfer'
  const steps = internal ? ['Tài khoản', 'Số tiền', 'Xem lại'] : ['Người nhận', 'Số tiền', 'Nội dung', 'Xem lại']
  const [step, setStep] = useState(0)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [otp, setOtp] = useState(null)
  const [done, setDone] = useState(null)
  const [f, setF] = useState({
    recipient: preset.recipient || null,
    from: preset.from || accounts.find((a) => a.primary)?.id,
    to: preset.to || (internal ? 'acc-reserve' : null),
    amount: preset.amount || 0,
    method: internal ? 'internal' : 'napas',
    when: 'now',
    date: addDays(TODAY, 3).toISOString().slice(0, 10),
    repeat: false,
    memo: stripAccents(preset.memo || `${COMPANY.short} chuyen khoan`).toUpperCase(),
    category: preset.category || '',
    note: '',
    file: null,
  })
  useEffect(() => { if (preset.recipient && !internal) setStep(1) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const rc = recipients.find((r) => r.id === f.recipient)
  const src = accounts.find((a) => a.id === f.from)
  const over = f.amount > (src?.balance || 0)
  const needsApproval = f.amount > 500000000

  const canNext = [
    internal ? f.from && f.to && f.from !== f.to : !!f.recipient,
    f.amount >= 1000 && !over && (f.method !== 'napas' || f.amount <= 500000000),
    true,
    true,
  ][step]

  const list = recipients.filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
  const last = step === steps.length - 1

  const submit = () => {
    const scheduled = f.when === 'later'
    const status = needsApproval || scheduled ? 'pending' : 'posted'
    const tx = transfer({
      from: f.from, to: internal ? f.to : null, recipient: internal ? null : f.recipient, amount: f.amount,
      note: f.note || (internal ? '' : f.memo), category: internal ? 'transfer' : f.category || null,
      status, date: scheduled ? f.date : undefined,
    })
    setOtp(null)
    setDone({ tx, scheduled, approval: needsApproval })
  }

  if (done) {
    return (
      <FlowShell onClose={onClose} title={internal ? 'Chuyển giữa các tài khoản' : 'Chuyển tiền'}>
        <div className="flex flex-col items-center text-center pt-6">
          <span className={cn('size-16 rounded-full grid place-items-center mb-5 animate-pop-in', done.approval || done.scheduled ? 'bg-warn-soft text-warn' : 'bg-pos-soft text-pos')}>
            {done.approval ? <Clock size={30} /> : done.scheduled ? <CalendarClock size={30} /> : <Check size={32} strokeWidth={2.6} />}
          </span>
          <h2 className="ds-h1">{done.approval ? 'Đã gửi yêu cầu duyệt' : done.scheduled ? 'Đã hẹn lịch chuyển tiền' : 'Tiền đang trên đường đi'}</h2>
          <p className="text-muted mt-2 max-w-md">
            {done.approval
              ? `Khoản chuyển trên 500 triệu cần thêm Trần Quốc Bảo duyệt. Mạch sẽ chuyển ngay khi được duyệt.`
              : done.scheduled
                ? `Mạch sẽ chuyển vào ngày ${formatDate(f.date)}${f.repeat ? ' và lặp lại hằng tháng' : ''}.`
                : internal ? 'Tiền đã có trong tài khoản đích.' : `${rc?.name} sẽ nhận được tiền trong vài giây.`}
          </p>
          <div className="mt-7 w-full card p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-muted text-[13px]">Số tiền</span>
              <span className="text-[22px] font-[500] num">{formatVND(f.amount)}</span>
            </div>
            <KeyValue className="mt-2" items={[
              { label: 'Từ', value: `${src.name} ••${src.last4}` },
              { label: 'Đến', value: internal ? `${accounts.find((a) => a.id === f.to)?.name}` : rc?.name },
              { label: 'Mã giao dịch', value: <span className="font-mono text-[12.5px]">{done.tx.id.toUpperCase()}</span> },
            ]} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => { setDone(null); setStep(0); setF((x) => ({ ...x, amount: 0, recipient: null })) }}>Chuyển khoản khác</Button>
            <Button variant="primary" onClick={() => { onClose(); navigate('/giao-dich?id=' + done.tx.id) }}>Xem giao dịch</Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  return (
    <FlowShell
      onClose={onClose}
      title={internal ? 'Chuyển giữa các tài khoản' : 'Chuyển tiền'}
      steps={steps}
      current={step}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={<Slip from={f.from} recipient={rc} toAcc={internal ? f.to : null} amount={f.amount} memo={internal ? 'Chuyển nội bộ' : f.memo} date={f.when === 'later' ? f.date : TODAY} method={f.method} />}
      footer={<>
        <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        {last
          ? <Button variant="primary" size="lg" icon={ShieldCheck} onClick={() => setOtp('')}>{needsApproval ? 'Gửi yêu cầu duyệt' : f.when === 'later' ? 'Hẹn lịch chuyển' : 'Xác nhận chuyển ' + formatVND(f.amount)}</Button>
          : <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
      </>}
    >
      {/* ---- Bước 1 ---- */}
      {step === 0 && internal && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Chuyển giữa các tài khoản</h2><p className="text-muted mt-1">Miễn phí và tức thì giữa các tài khoản của {COMPANY.short}.</p></div>
          <AccountPicker label="Từ tài khoản" value={f.from} onChange={(v) => setF((x) => ({ ...x, from: v, to: x.to === v ? null : x.to }))} />
          <AccountPicker label="Đến tài khoản" value={f.to} onChange={set('to')} exclude={f.from} />
        </div>
      )}
      {step === 0 && !internal && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Chuyển tiền cho ai?</h2><p className="text-muted mt-1">Chọn người nhận đã lưu hoặc thêm người nhận mới.</p></div>
          {adding ? (
            <NewRecipient onCancel={() => setAdding(false)} onDone={(r) => { setAdding(false); setF((x) => ({ ...x, recipient: r.id })); setStep(1) }} />
          ) : (
            <>
              <Input prefix={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên người nhận" autoFocus />
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setAdding(true)} className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-left hover:bg-subtle">
                  <span className="size-9 grid place-items-center rounded-full bg-brand-50 text-brand-ink"><Plus size={18} /></span>
                  <span className="text-[14px] font-[550]">Thêm người nhận mới</span>
                </button>
                {list.map((r) => {
                  const on = f.recipient === r.id
                  return (
                    <button key={r.id} onClick={() => { setF((x) => ({ ...x, recipient: r.id })); setStep(1) }}
                      className={cn('flex items-center gap-3 rounded-xl px-3.5 py-3 text-left border transition-colors', on ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-subtle')}>
                      <Avatar name={r.name} color={r.color} size={36} square={r.type === 'business'} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-[550] truncate">{r.name}</span>
                        <span className="block ds-caption">{r.bank} · {r.account}</span>
                      </span>
                      {r.lastPaid && <span className="ds-caption hidden sm:block">Lần cuối {formatDate(r.lastPaid)}</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- Bước 2: số tiền ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div>
            <h2 className="ds-h1">Số tiền</h2>
            {rc && !internal && <p className="text-muted mt-1">Gửi đến <b className="text-fg font-[600]">{rc.name}</b> · {rc.bank}</p>}
          </div>
          <div>
            <MoneyInput big value={f.amount} onChange={set('amount')} autoFocus />
            <div className="mt-2 flex flex-wrap gap-2">
              {[5e6, 20e6, 50e6, 100e6].map((v) => (
                <button key={v} onClick={() => set('amount')(v)} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-dim hover:bg-subtle num">{formatVND(v)}</button>
              ))}
            </div>
            {over && <p className="text-neg text-[13px] mt-2">Số dư tài khoản nguồn không đủ.</p>}
            {f.method === 'napas' && f.amount > 500000000 && <p className="text-warn text-[13px] mt-2">Chuyển nhanh 24/7 tối đa 500 triệu/lần — hãy chọn Chuyển thường.</p>}
            {f.amount > 0 && <p className="ds-caption mt-2 italic">{readVND(f.amount)}</p>}
          </div>
          {!internal && <AccountPicker label="Từ tài khoản" value={f.from} onChange={set('from')} />}
          {!internal && (
            <RadioCards value={f.method} onChange={set('method')} options={[
              { value: 'napas', label: 'Chuyển nhanh 24/7', desc: 'Đến ngay trong vài giây · tối đa 500 triệu/lần · miễn phí', icon: Zap },
              { value: 'interbank', label: 'Chuyển thường', desc: 'Đến trong ngày làm việc · không giới hạn số tiền · miễn phí', icon: Clock },
            ]} />
          )}
          <div className="card p-4 flex flex-col gap-4">
            <Segmented value={f.when} onChange={set('when')} options={[{ value: 'now', label: 'Chuyển ngay' }, { value: 'later', label: 'Hẹn ngày chuyển', icon: CalendarClock }]} />
            {f.when === 'later' && (
              <div className="grid sm:grid-cols-2 gap-3 items-end animate-fade-in">
                <Input type="date" label="Ngày chuyển" value={f.date} min={addDays(TODAY, 1).toISOString().slice(0, 10)} onChange={set('date')} />
                <Toggle label="Lặp lại hằng tháng" checked={f.repeat} onChange={set('repeat')} className="pb-2" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Bước 3: nội dung (chỉ khi gửi ra ngoài) ---- */}
      {step === 2 && !internal && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Nội dung chuyển khoản</h2><p className="text-muted mt-1">Thông tin giúp người nhận và kế toán đối chiếu.</p></div>
          <Input label="Nội dung hiển thị cho người nhận" value={f.memo} maxLength={140} onChange={(e) => set('memo')(stripAccents(e.target.value).toUpperCase())} hint={`${f.memo.length}/140 ký tự · không dấu để hiển thị đúng ở mọi ngân hàng`} />
          <Select label="Danh mục chi phí" value={f.category} onChange={set('category')} placeholder="Chọn danh mục" options={categoryList.filter((c) => !['revenue', 'transfer', 'interest'].includes(c.id)).map((c) => ({ value: c.id, label: c.label }))} />
          <Textarea label="Ghi chú nội bộ" optional value={f.note} onChange={set('note')} placeholder="Chỉ thành viên công ty nhìn thấy" />
          <div>
            <div className="text-[13px] font-[550] text-dim mb-1.5">Hoá đơn / chứng từ <span className="font-normal text-faint">(không bắt buộc)</span></div>
            <FileDrop value={f.file} onChange={set('file')} compact />
          </div>
        </div>
      )}

      {/* ---- Bước cuối: xem lại ---- */}
      {last && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Kiểm tra lại</h2><p className="text-muted mt-1">Giao dịch chuyển khoản không thể hoàn tác sau khi xác nhận.</p></div>
          <div className="card p-5">
            <div className="text-muted text-[13px]">Số tiền</div>
            <div className="text-[34px] font-[500] tracking-tight num">{formatVND(f.amount)}</div>
            <KeyValue className="mt-3" items={[
              { label: 'Từ', value: `${src.name} ••${src.last4}` },
              internal ? { label: 'Đến', value: `${accounts.find((a) => a.id === f.to)?.name} ••${accounts.find((a) => a.id === f.to)?.last4}` } : { label: 'Người nhận', value: <span>{rc?.name}<br /><span className="text-muted">{rc?.bank} · {rc?.account}</span></span> },
              !internal && { label: 'Hình thức', value: f.method === 'napas' ? 'Chuyển nhanh 24/7' : 'Chuyển thường' },
              { label: 'Thời gian', value: f.when === 'later' ? `${formatDate(f.date)}${f.repeat ? ' · lặp hằng tháng' : ''}` : 'Ngay bây giờ' },
              !internal && { label: 'Nội dung', value: <span className="font-mono text-[12.5px]">{f.memo}</span> },
              { label: 'Phí', value: 'Miễn phí' },
            ]} />
          </div>
          <Callout tone="neutral" icon={ShieldCheck}>Mạch gửi lệnh chuyển tới {src.bank} qua kết nối bạn đã uỷ quyền. Tiền đi thẳng từ tài khoản ngân hàng của công ty, Mạch không giữ tiền.</Callout>
          {needsApproval && <Callout tone="warn" title="Cần thêm một người duyệt">Theo quy tắc của công ty, khoản trên 500 triệu cần Kế toán trưởng Trần Quốc Bảo duyệt.</Callout>}
          {f.when === 'later' && f.repeat && <Callout tone="info" icon={Repeat}>Mạch sẽ tự chuyển vào ngày {new Date(f.date).getDate()} hằng tháng cho đến khi bạn tắt.</Callout>}
        </div>
      )}

      <Modal open={otp !== null} onClose={() => setOtp(null)} title="Xác thực giao dịch" desc="Nhập mã 6 số từ ứng dụng xác thực trên điện thoại của bạn." size="sm"
        footer={<><Button variant="secondary" onClick={() => setOtp(null)}>Huỷ</Button><Button variant="primary" disabled={(otp || '').length < 6} onClick={submit}>Xác nhận</Button></>}>
        <div className="flex flex-col items-center gap-3 py-2">
          <OtpInput value={otp || ''} onChange={setOtp} />
          <p className="ds-caption">Bản demo: nhập 6 số bất kỳ.</p>
        </div>
      </Modal>
    </FlowShell>
  )
}

/* ---------- Nhận tiền: thông tin tài khoản + VietQR ---------- */
function DepositModal({ onClose }) {
  const accounts = useBank((s) => s.accounts)
  const [id, setId] = useState(accounts[0].id)
  const a = accounts.find((x) => x.id === id)
  const copy = (t) => { navigator.clipboard?.writeText(t); toast('Đã sao chép') }
  const row = (label, value) => (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-line last:border-0">
      <span className="text-[13px] text-muted">{label}</span>
      <button onClick={() => copy(value)} className="group flex items-center gap-2 text-[13.5px] font-[550] text-right">{value}<Copy size={13} className="text-faint group-hover:text-fg" /></button>
    </div>
  )
  return (
    <Modal open onClose={onClose} title="Nhận tiền vào tài khoản" desc="Gửi thông tin tài khoản hoặc mã VietQR dưới đây cho người cần chuyển tiền cho công ty." size="lg">
      <div className="grid sm:grid-cols-[1fr_200px] gap-6 items-start">
        <div>
          <Select value={id} onChange={(e) => setId(e.target.value)} options={accounts.map((x) => ({ value: x.id, label: `${x.name} ••${x.last4}` }))} />
          <div className="mt-3">
            {row('Ngân hàng', a.bank)}
            {row('Số tài khoản', a.number)}
            {row('Chủ tài khoản', 'CONG TY CO PHAN SEN VIET DIGITAL')}
            {row('Chi nhánh', 'Hội sở TP. Hồ Chí Minh')}
          </div>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-line p-4 bg-white text-[#0c120f] [--qr-bg:#fff]">
          <QrCode value={a.number} size={160} />
          <div className="text-[11.5px] font-[650] mt-2 tracking-wide">VietQR · NAPAS 247</div>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- Yêu cầu thanh toán: tạo link + QR ---------- */
function RequestModal({ onClose }) {
  const customers = useBank((s) => s.customers)
  const [f, setF] = useState({ amount: 0, customer: '', desc: '' })
  const [link, setLink] = useState(null)
  const create = () => setLink(`https://pay.mach.vn/senviet/${Math.random().toString(36).slice(2, 8)}`)
  return (
    <Modal open onClose={onClose} title={link ? 'Link thanh toán đã sẵn sàng' : 'Yêu cầu thanh toán'} desc={link ? 'Gửi link hoặc mã QR cho khách. Tiền về Thanh toán chính ••2502.' : 'Tạo nhanh một link thanh toán, không cần lập hoá đơn đầy đủ.'}
      footer={link
        ? <><Button variant="secondary" icon={Copy} onClick={() => { navigator.clipboard?.writeText(link); toast('Đã sao chép link') }}>Sao chép link</Button><Button variant="primary" onClick={onClose}>Xong</Button></>
        : <><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" icon={Link2} disabled={f.amount < 10000} onClick={create}>Tạo link</Button></>}>
      {link ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-line p-4 bg-white text-[#0c120f] [--qr-bg:#fff]"><QrCode value={link} size={170} /></div>
          <div className="text-[26px] font-[500] num">{formatVND(f.amount)}</div>
          <div className="w-full rounded-xl bg-subtle px-3.5 py-2.5 font-mono text-[12.5px] break-all text-center">{link}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <MoneyInput label="Số tiền" value={f.amount} onChange={(amount) => setF({ ...f, amount })} autoFocus />
          <Select label="Khách hàng" optional value={f.customer} onChange={(e) => setF({ ...f, customer: e.target.value })} placeholder="Không chọn" options={customers.map((c) => ({ value: c.id, label: c.name }))} />
          <Input label="Mô tả" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="VD: Đặt cọc thiết kế website" />
        </div>
      )}
    </Modal>
  )
}

export function MoveMoney() {
  const mm = useUI((s) => s.moveMoney)
  const close = useUI((s) => s.closeMoveMoney)
  const key = useMemo(() => (mm ? Math.random() : 0), [mm])
  if (!mm) return null
  if (mm.mode === 'deposit') return <DepositModal onClose={close} />
  if (mm.mode === 'request') return <RequestModal onClose={close} />
  return <SendFlow key={key} onClose={close} preset={{ ...mm.preset, mode: mm.mode }} />
}
