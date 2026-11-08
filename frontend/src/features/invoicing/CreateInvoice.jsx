/* ==========================================================
   Luồng tạo hoá đơn bán ra (toàn màn hình, xem trước trực tiếp bên phải)
   <CreateInvoice onClose preset={{ customer }} onView={(id) => …} />
   ========================================================== */
import { useMemo, useState } from 'react'
import { ArrowRight, Check, Copy, Plus, Search, Trash2, Package, PenLine, CalendarClock, Send, Repeat, FileCheck2, Landmark, QrCode as QrIcon, CreditCard, FileText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND, formatDate, addDays, readVND, TODAY } from '@/lib/format'
import { invoiceTotals } from '@/data/invoicing'
import { COMPANY } from '@/data/org'
import { useBank, toast, newId } from '@/store'
import {
  Avatar, Button, IconButton, FlowShell, Input, MoneyInput, Select, Textarea, Toggle, Segmented, KeyValue, Callout, Popover, Menu, QrCode, Field, Money,
} from '@/components/ui'
import { InvoicePaper } from './InvoicePaper'
import { CustomerForm } from './CustomerForm'
import { TODAY_ISO, isoDate, fromISO, nextInvoiceNumber, payLink, VAT_RATES, UNITS, PAY_METHODS } from './helpers'

const STEPS = ['Khách hàng', 'Sản phẩm/dịch vụ', 'Thanh toán & điều khoản', 'Xem lại & gửi']
const TERMS = [7, 14, 30]
const METHOD_ICON = { transfer: Landmark, vietqr: QrIcon, card: CreditCard }

const nextMonth = (iso) => { const d = fromISO(iso); return new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()) }

let rowKey = 0
const rowFrom = (c) => ({ key: ++rowKey, catalog: c?.id || null, name: c?.name || '', unit: c?.unit || 'Gói', qty: 1, price: c?.price || 0, vat: c?.vat ?? 8 })

/* ---------- Một dòng hàng hoá ---------- */
function LineItem({ item, index, onChange, onRemove, canRemove }) {
  const set = (k) => (v) => onChange({ ...item, [k]: v?.target ? v.target.value : v })
  return (
    <div className="rounded-xl border border-line bg-surface p-4 animate-pop-in">
      <div className="flex items-start gap-2">
        <span className="mt-2.5 size-6 shrink-0 rounded-full bg-subtle text-muted text-[11.5px] font-[650] grid place-items-center num">{index + 1}</span>
        <Input className="flex-1" value={item.name} onChange={set('name')} placeholder="Tên hàng hoá, dịch vụ" aria-label="Tên hàng hoá, dịch vụ" />
        <IconButton icon={Trash2} label="Xoá dòng" size="md" onClick={onRemove} disabled={!canRemove} className="text-faint hover:text-neg" />
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-[72px_96px_1fr_88px] gap-2.5 sm:pl-8">
        <Input label="SL" inputMode="numeric" value={item.qty} onChange={(e) => set('qty')(Math.max(0, Number(e.target.value.replace(/\D/g, '').slice(0, 5)) || 0))} inputClassName="num text-right" />
        <Select label="ĐVT" value={item.unit} onChange={set('unit')} options={UNITS} />
        <MoneyInput label="Đơn giá" value={item.price} onChange={set('price')} className="col-span-2 sm:col-span-1" />
        <Select label="VAT" value={item.vat} onChange={(e) => set('vat')(Number(e.target.value))} options={VAT_RATES.map((r) => ({ value: r, label: r + '%' }))} />
      </div>
      <div className="mt-3 sm:pl-8 flex items-center justify-between text-[13px]">
        <span className="text-muted">Thành tiền (chưa VAT)</span>
        <Money value={item.qty * item.price} hideable={false} className="font-[600]" />
      </div>
    </div>
  )
}

export function CreateInvoice({ onClose, preset = {}, onView }) {
  const { customers, catalog, accounts, invoices, add } = useBank()
  const [step, setStep] = useState(preset.customer ? 1 : 0)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [done, setDone] = useState(null)
  const [f, setF] = useState(() => {
    const c = customers.find((x) => x.id === preset.customer)
    return {
      customer: preset.customer || null,
      items: [],
      issued: TODAY_ISO,
      term: 14,
      due: isoDate(addDays(fromISO(TODAY_ISO), 14)),
      methods: ['transfer', 'vietqr'],
      account: accounts.find((a) => a.primary)?.id || 'acc-main',
      memo: '',
      recurring: false,
      einvoice: true,
      emailTo: c?.email || '',
      message: '',
      sendMode: 'now',
      sendDate: isoDate(addDays(fromISO(TODAY_ISO), 1)),
    }
  })
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const customer = customers.find((c) => c.id === f.customer)
  const number = useMemo(() => nextInvoiceNumber(invoices), [invoices])
  const draft = { number, customer: f.customer, issued: f.issued, due: f.due, items: f.items, memo: f.memo, paid: 0, methods: f.methods, einvoice: f.einvoice, account: f.account, status: 'draft' }
  const totals = invoiceTotals(draft)
  const defaultMessage = `Kính gửi ${customer?.contact || customer?.name || 'quý khách'},\n\n${COMPANY.short} gửi quý khách hoá đơn ${number} với tổng số tiền ${formatVND(totals.total)}, hạn thanh toán ${formatDate(f.due)}.\n\nQuý khách có thể xem và thanh toán trực tuyến qua link đính kèm.\n\nTrân trọng,\n${COMPANY.short}`

  const pickCustomer = (c) => { setF((x) => ({ ...x, customer: c.id, emailTo: c.email || '' })); setStep(1) }
  const setTerm = (term) => setF((x) => ({ ...x, term, due: term === 'custom' ? x.due : isoDate(addDays(fromISO(x.issued), term)) }))
  const setIssued = (e) => {
    const issued = e.target.value
    setF((x) => ({ ...x, issued, due: x.term === 'custom' ? x.due : isoDate(addDays(fromISO(issued), x.term)) }))
  }
  const updateItem = (i, it) => setF((x) => ({ ...x, items: x.items.map((r, j) => (j === i ? it : r)) }))
  const addItem = (c) => setF((x) => ({ ...x, items: [...x.items, rowFrom(c)] }))
  const removeItem = (i) => setF((x) => ({ ...x, items: x.items.filter((_, j) => j !== i) }))
  const toggleMethod = (m) => setF((x) => ({ ...x, methods: x.methods.includes(m) ? x.methods.filter((y) => y !== m) : [...x.methods, m] }))

  const itemsOk = f.items.length > 0 && f.items.every((i) => i.name.trim() && i.qty > 0 && i.price > 0)
  const canNext = [!!customer, itemsOk, f.issued && f.due && f.due >= f.issued && f.methods.length > 0, true][step]
  const last = step === STEPS.length - 1
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailTo)

  const submit = (mode) => {
    const status = mode === 'draft' ? 'draft' : f.sendMode === 'later' ? 'scheduled' : 'sent'
    const inv = {
      id: newId('iv'),
      number,
      customer: f.customer,
      issued: f.issued,
      due: f.due,
      status,
      items: f.items.map(({ key, ...r }) => r), // eslint-disable-line no-unused-vars
      memo: f.memo,
      paid: 0,
      payments: [],
      methods: f.methods,
      account: f.account,
      einvoice: f.einvoice,
      recurring: f.recurring ? 'Hằng tháng' : undefined,
      createdAt: TODAY_ISO,
      sentAt: status === 'sent' ? TODAY.toISOString() : undefined,
      sentTo: status === 'draft' ? undefined : f.emailTo,
      scheduledFor: status === 'scheduled' ? f.sendDate : undefined,
      cqtCode: f.einvoice && status === 'sent' ? '00' + Math.random().toString(16).slice(2, 12).toUpperCase() + 'C26TSV' : undefined,
      viewedAt: null,
    }
    add('invoices', inv)
    setDone(inv)
  }

  /* ---------- Màn hình hoàn tất ---------- */
  if (done) {
    const link = payLink(done)
    const title = { draft: 'Đã lưu nháp hoá đơn', scheduled: 'Đã hẹn gửi hoá đơn', sent: 'Đã gửi hoá đơn' }[done.status]
    const desc = {
      draft: 'Bạn có thể chỉnh sửa và gửi hoá đơn này bất cứ lúc nào.',
      scheduled: `Mạch sẽ tự gửi đến ${done.sentTo} vào ngày ${formatDate(done.scheduledFor)}.`,
      sent: `${customer?.name} sẽ nhận được email kèm link thanh toán trong ít phút.`,
    }[done.status]
    return (
      <FlowShell onClose={onClose} title="Tạo hoá đơn">
        <div className="flex flex-col items-center text-center pt-4">
          <span className={cn('size-16 rounded-full grid place-items-center mb-5 animate-pop-in', done.status === 'draft' ? 'bg-subtle text-dim' : done.status === 'scheduled' ? 'bg-info-soft text-info' : 'bg-pos-soft text-pos')}>
            {done.status === 'draft' ? <FileText size={28} /> : done.status === 'scheduled' ? <CalendarClock size={28} /> : <Check size={32} strokeWidth={2.6} />}
          </span>
          <h2 className="ds-h1">{title}</h2>
          <p className="text-muted mt-2 max-w-md">{desc}</p>
          <div className="mt-7 w-full card p-5 text-left">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-muted text-[13px]">{done.number}</div>
                <div className="text-[24px] font-[500] num tracking-tight">{formatVND(totals.total)}</div>
              </div>
              <div className="rounded-xl border border-line p-2 bg-white text-[#0c120f] [--qr-bg:#fff]"><QrCode value={link} size={92} /></div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-subtle pl-3.5 pr-1.5 py-1.5">
              <span className="flex-1 min-w-0 truncate font-mono text-[12.5px]">{link}</span>
              <Button size="sm" variant="outline" icon={Copy} onClick={() => { navigator.clipboard?.writeText(link); toast('Đã sao chép link thanh toán') }}>Sao chép</Button>
            </div>
            <KeyValue className="mt-3" items={[
              { label: 'Khách hàng', value: customer?.name },
              { label: 'Hạn thanh toán', value: formatDate(done.due) },
              done.recurring && { label: 'Lặp lại', value: 'Tự tạo hoá đơn mới hằng tháng' },
              done.einvoice && { label: 'Hoá đơn điện tử', value: done.status === 'sent' ? 'Đã cấp mã CQT' : 'Cấp mã khi gửi' },
            ]} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={() => { setDone(null); setStep(0); setF((x) => ({ ...x, customer: null, items: [], memo: '', emailTo: '', message: '' })) }}>Tạo hoá đơn khác</Button>
            <Button variant="primary" onClick={() => onView?.(done.id)}>Xem hoá đơn</Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  const list = customers.filter((c) => `${c.name} ${c.contact} ${c.taxCode}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <FlowShell
      onClose={onClose}
      title="Tạo hoá đơn"
      steps={STEPS}
      current={step}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={
        <div className="p-8 pt-12">
          <div className="flex items-center justify-between mb-3">
            <span className="ds-label">Xem trước</span>
            <span className="ds-caption">Khách hàng sẽ thấy hoá đơn như thế này</span>
          </div>
          <InvoicePaper invoice={draft} customer={customer} compact />
        </div>
      }
      footer={<>
        <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        {last ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="lg" onClick={() => submit('draft')} className="hidden sm:inline-flex">Lưu nháp</Button>
            <Button variant="primary" size="lg" icon={f.sendMode === 'later' ? CalendarClock : Send} disabled={!emailOk} onClick={() => submit('send')}>
              {f.sendMode === 'later' ? 'Hẹn gửi' : 'Gửi hoá đơn'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {step > 0 && <Button variant="secondary" size="lg" onClick={() => submit('draft')} disabled={!customer || !f.items.length} className="hidden sm:inline-flex">Lưu nháp</Button>}
            <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          </div>
        )}
      </>}
    >
      {/* ---- Bước 1: khách hàng ---- */}
      {step === 0 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Hoá đơn gửi cho ai?</h2><p className="text-muted mt-1">Chọn khách hàng đã lưu hoặc thêm khách hàng mới.</p></div>
          {adding ? (
            <div className="rounded-2xl border border-line bg-surface p-5 animate-pop-in">
              <div className="ds-h3 mb-4">Khách hàng mới</div>
              <CustomerForm inline submitLabel="Lưu và chọn" onCancel={() => setAdding(false)} onSaved={(c) => { setAdding(false); pickCustomer(c) }} />
            </div>
          ) : (
            <>
              <Input prefix={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, người liên hệ hoặc MST" autoFocus />
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setAdding(true)} className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-left hover:bg-subtle">
                  <span className="size-9 grid place-items-center rounded-full bg-brand-50 text-brand-ink"><Plus size={18} /></span>
                  <span className="text-[14px] font-[550]">Thêm khách hàng mới</span>
                </button>
                {list.map((c) => {
                  const on = f.customer === c.id
                  return (
                    <button key={c.id} onClick={() => pickCustomer(c)}
                      className={cn('flex items-center gap-3 rounded-xl px-3.5 py-3 text-left border transition-colors', on ? 'border-brand-400 bg-brand-50' : 'border-transparent hover:bg-subtle')}>
                      <Avatar name={c.name} color={c.color} size={36} square />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-[550] truncate">{c.name}</span>
                        <span className="block ds-caption truncate">{[c.contact, c.email].filter(Boolean).join(' · ')}</span>
                      </span>
                      {on ? <Check size={17} className="text-brand-ink shrink-0" /> : c.taxCode && <span className="ds-caption num hidden sm:block">MST {c.taxCode}</span>}
                    </button>
                  )
                })}
                {list.length === 0 && <p className="ds-caption text-center py-6">Không tìm thấy khách hàng phù hợp với “{q}”.</p>}
              </div>
            </>
          )}
        </div>
      )}

      {/* ---- Bước 2: dòng hàng hoá ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div>
            <h2 className="ds-h1">Sản phẩm, dịch vụ</h2>
            <p className="text-muted mt-1">Gửi cho <b className="text-fg font-[600]">{customer?.name}</b>. Thêm từ danh mục hoặc nhập dòng tuỳ chỉnh.</p>
          </div>
          {f.items.map((it, i) => (
            <LineItem key={it.key} item={it} index={i} onChange={(v) => updateItem(i, v)} onRemove={() => removeItem(i)} canRemove />
          ))}
          {f.items.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center">
              <Package size={22} className="mx-auto text-faint" />
              <div className="ds-h3 mt-2">Chưa có dòng nào</div>
              <p className="ds-caption mt-1">Chọn sản phẩm, dịch vụ từ danh mục để điền sẵn đơn giá và thuế suất.</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Popover align="start" width={340} trigger={(p) => <Button {...p} variant="outline" icon={Package}>Thêm từ danh mục</Button>}>
              {(close) => (
                <div className="max-h-[320px] overflow-y-auto">
                  <Menu onClose={close} items={[
                    { heading: 'Danh mục sản phẩm & dịch vụ' },
                    ...catalog.map((c) => ({ label: c.name, desc: `${formatVND(c.price)} / ${c.unit.toLowerCase()} · VAT ${c.vat}%`, onClick: () => addItem(c) })),
                  ]} />
                </div>
              )}
            </Popover>
            <Button variant="ghost" icon={PenLine} onClick={() => addItem(null)}>Dòng tuỳ chỉnh</Button>
          </div>
          {f.items.length > 0 && (
            <div className="card p-5">
              <div className="flex justify-between text-[13.5px] py-1"><span className="text-muted">Cộng tiền hàng</span><Money value={totals.subtotal} hideable={false} /></div>
              <div className="flex justify-between text-[13.5px] py-1"><span className="text-muted">Thuế GTGT</span><Money value={totals.vat} hideable={false} /></div>
              <div className="flex justify-between items-baseline border-t border-line mt-2 pt-3"><span className="font-[600]">Tổng cộng</span><Money value={totals.total} hideable={false} className="text-[22px] font-[500] tracking-tight" /></div>
              <p className="ds-caption italic mt-1 text-right">{readVND(totals.total)}</p>
            </div>
          )}
        </div>
      )}

      {/* ---- Bước 3: thanh toán & điều khoản ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-6 animate-slide-up">
          <div><h2 className="ds-h1">Thanh toán & điều khoản</h2><p className="text-muted mt-1">Khách hàng trả tiền về tài khoản của {COMPANY.short} trên Mạch.</p></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input type="date" label="Ngày lập" value={f.issued} onChange={setIssued} />
            <Input type="date" label="Hạn thanh toán" value={f.due} min={f.issued} onChange={(e) => setF((x) => ({ ...x, due: e.target.value, term: 'custom' }))}
              error={f.due < f.issued ? 'Hạn thanh toán phải sau ngày lập' : null} />
          </div>
          <div className="-mt-3">
            <Segmented size="sm" value={f.term} onChange={setTerm} options={[...TERMS.map((t) => ({ value: t, label: `${t} ngày` })), { value: 'custom', label: 'Tuỳ chọn' }]} />
          </div>

          <Field label="Phương thức khách có thể dùng">
            <div className="grid sm:grid-cols-3 gap-2">
              {Object.entries(PAY_METHODS).map(([k, label]) => {
                const on = f.methods.includes(k)
                const I = METHOD_ICON[k]
                return (
                  <button key={k} type="button" role="checkbox" aria-checked={on} onClick={() => toggleMethod(k)}
                    className={cn('flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[13.5px] font-[550] transition-[border,background,box-shadow]',
                      on ? 'border-brand-400 bg-brand-50 ring-[3px] ring-brand-100' : 'border-line-strong bg-surface hover:border-faint')}>
                    <I size={17} className={on ? 'text-brand-ink' : 'text-muted'} />
                    <span className="flex-1">{label}</span>
                    {on && <Check size={15} className="text-brand-ink" />}
                  </button>
                )
              })}
            </div>
            {f.methods.includes('card') && <p className="ds-caption">Phí thẻ 1,8% do {COMPANY.short} chịu, trừ vào số tiền nhận.</p>}
            {f.methods.length === 0 && <p className="text-[12.5px] text-neg">Chọn ít nhất một phương thức.</p>}
          </Field>

          <Select label="Nhận tiền vào tài khoản" value={f.account} onChange={set('account')} options={accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))} />
          <Textarea label="Ghi chú trên hoá đơn" optional rows={2} value={f.memo} onChange={set('memo')} placeholder="VD: Thanh toán theo hợp đồng số 12/2026/HĐ-SV" />

          <div className="card p-4 flex flex-col gap-4">
            <Toggle label="Lặp lại hằng tháng" desc="Tự tạo và gửi hoá đơn mới vào cùng ngày mỗi tháng." checked={f.recurring} onChange={set('recurring')} />
            <div className="h-px bg-line" />
            <Toggle label="Phát hành hoá đơn điện tử có mã CQT" desc="Gửi lên cơ quan thuế qua Hoá đơn điện tử VNPT khi bạn gửi hoá đơn." checked={f.einvoice} onChange={set('einvoice')} />
          </div>
          {f.recurring && <Callout tone="info" icon={Repeat}>Hoá đơn tiếp theo sẽ được tạo vào ngày {formatDate(nextMonth(f.issued))}.</Callout>}
        </div>
      )}

      {/* ---- Bước 4: xem lại & gửi ---- */}
      {last && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Xem lại & gửi</h2><p className="text-muted mt-1">Kiểm tra thông tin trước khi gửi cho khách hàng.</p></div>
          <div className="card p-5">
            <div className="text-muted text-[13px]">Tổng cộng · {number}</div>
            <div className="text-[34px] font-[500] tracking-tight num">{formatVND(totals.total)}</div>
            <KeyValue className="mt-3" items={[
              { label: 'Khách hàng', value: customer?.name },
              { label: 'Số dòng', value: `${f.items.length} sản phẩm, dịch vụ` },
              { label: 'Ngày lập', value: formatDate(f.issued) },
              { label: 'Hạn thanh toán', value: formatDate(f.due) },
              { label: 'Phương thức', value: f.methods.map((m) => PAY_METHODS[m]).join(', ') },
              f.einvoice && { label: 'Hoá đơn điện tử', value: <span className="inline-flex items-center gap-1.5"><FileCheck2 size={14} className="text-pos" />Có mã của cơ quan thuế</span> },
            ]} />
          </div>
          <Input label="Gửi đến" type="email" value={f.emailTo} onChange={set('emailTo')} placeholder="ketoan@khachhang.vn" error={f.emailTo && !emailOk ? 'Email chưa đúng định dạng' : null} />
          <Textarea label="Lời nhắn" rows={7} value={f.message || defaultMessage} onChange={set('message')} />
          <div className="card p-4 flex flex-col gap-4">
            <Segmented value={f.sendMode} onChange={set('sendMode')} options={[{ value: 'now', label: 'Gửi ngay', icon: Send }, { value: 'later', label: 'Hẹn ngày gửi', icon: CalendarClock }]} />
            {f.sendMode === 'later' && (
              <Input type="date" label="Ngày gửi" value={f.sendDate} min={TODAY_ISO} onChange={set('sendDate')} className="animate-fade-in sm:max-w-[240px]" />
            )}
          </div>
          <div className="xl:hidden">
            <div className="ds-label mb-2">Xem trước hoá đơn</div>
            <InvoicePaper invoice={draft} customer={customer} compact />
          </div>
          <Button variant="ghost" className="sm:hidden" onClick={() => submit('draft')}>Lưu nháp</Button>
        </div>
      )}
    </FlowShell>
  )
}
