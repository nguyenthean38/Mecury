/* ==========================================================
   Luồng tải hoá đơn phải trả lên: tệp → AI trích xuất → kiểm tra → Lưu nháp / Gửi duyệt
   ========================================================== */
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Loader2, PenLine, Send, Save, ShieldCheck, Mail, Copy } from 'lucide-react'
import { TODAY, addDays, formatVND } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import { BANKS } from '@/data/payments'
import { categoryList } from '@/data/transactions'
import {
  Button, FlowShell, FileDrop, MoneyInput, Input, Select, Textarea, Segmented, Callout, Badge,
} from '@/components/ui'
import { InvoicePaper } from './InvoicePaper'
import { FORWARD_EMAIL, preTax, toHolder } from './billUtils'

const STEPS = ['Tải hoá đơn', 'Kiểm tra thông tin']
const iso = (d) => new Date(d).toISOString().slice(0, 10)
const NEW = '__new'

/** Kết quả trích xuất mô phỏng — chọn theo tên tệp để ổn định */
const EXTRACTS = [
  { recipient: 'p2', number: 'HC-0957', issued: '2026-11-06', due: '2026-11-20', amount: 22000000, vat: 10, category: 'contractor', note: 'Chụp lookbook bộ sưu tập Tết cho Thời Trang Mây' },
  { recipient: NEW, nr: { name: 'Công ty TNHH Cà Phê Mộc Sơn', taxCode: '0317 245 608', bank: 'ACB', account: '2468 1357 90' }, number: 'MS-11/0342', issued: '2026-11-07', due: '2026-11-22', amount: 7560000, vat: 8, category: 'meals', note: 'Cà phê hạt và bánh cho pantry tháng 11' },
  { recipient: 'p1', number: 'HS-DV-1126', issued: '2026-11-07', due: '2026-11-17', amount: 4950000, vat: 10, category: 'utilities', note: 'Phí dịch vụ toà nhà và gửi xe tháng 11' },
]
const pick = (name = '') => EXTRACTS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % EXTRACTS.length]
const CATS = categoryList.filter((c) => !['revenue', 'transfer', 'interest'].includes(c.id))

const blank = () => ({
  recipient: '', nr: { name: '', taxCode: '', bank: 'Vietcombank', account: '' }, number: '', issued: iso(TODAY), due: iso(addDays(TODAY, 14)),
  amount: 0, vat: 10, category: '', note: '',
})

export function UploadBillFlow({ onClose, onCreated }) {
  const { recipients, add } = useBank()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [f, setF] = useState(blank)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const setNr = (k) => (e) => setF((x) => ({ ...x, nr: { ...x.nr, [k]: e.target.value } }))

  const onFile = (v) => {
    setFile(v)
    clearTimeout(timer.current)
    if (!v) { setScanning(false); setScanned(false); return }
    setScanning(true)
    setScanned(false)
    timer.current = setTimeout(() => {
      const ex = pick(v.name)
      setF((x) => ({ ...x, ...ex, nr: ex.nr ? { ...x.nr, ...ex.nr } : x.nr }))
      setScanning(false)
      setScanned(true)
      setStep(1)
    }, 1200)
  }

  const isNew = f.recipient === NEW
  const rc = isNew
    ? { name: f.nr.name, taxCode: f.nr.taxCode, bank: f.nr.bank, account: f.nr.account, type: 'business' }
    : recipients.find((r) => r.id === f.recipient)
  const newOk = !isNew || (f.nr.name.trim().length > 2 && f.nr.account.replace(/\D/g, '').length >= 6)
  const hasRecipient = !!f.recipient && newOk
  const dueErr = f.due && f.issued && f.due < f.issued ? 'Hạn thanh toán phải sau ngày phát hành' : undefined
  const fullOk = hasRecipient && f.number.trim().length >= 2 && f.amount >= 1000 && !!f.due && !dueErr

  const save = (status) => {
    let recipient = f.recipient
    if (isNew) {
      const r = { id: newId('p'), type: 'business', name: f.nr.name.trim(), taxCode: f.nr.taxCode.trim(), email: '', bank: f.nr.bank, account: f.nr.account.trim(), holder: toHolder(f.nr.name), lastPaid: null, total: 0, color: '#3f8f8a' }
      add('recipients', r)
      recipient = r.id
    }
    const bill = {
      id: newId('bl'), recipient, number: f.number.trim() || `NHAP-${Date.now().toString(36).slice(-4).toUpperCase()}`, amount: f.amount,
      issued: f.issued, due: f.due, status, category: f.category || null, note: f.note.trim(), file: file?.name || null, requestedBy: 'u1', vat: Number(f.vat),
    }
    add('bills', bill)
    toast(status === 'review'
      ? { title: 'Đã gửi duyệt hoá đơn', desc: `${bill.number} · ${formatVND(bill.amount)}` }
      : { title: 'Đã lưu nháp', desc: 'Bạn có thể bổ sung và gửi duyệt sau.' })
    onClose()
    onCreated?.(bill.id)
  }

  return (
    <FlowShell
      onClose={onClose}
      title="Tải hoá đơn lên"
      steps={STEPS}
      current={step}
      onBack={step > 0 ? () => setStep(0) : undefined}
      aside={
        <div className="p-8 xl:p-10 pt-14">
          <div className="flex items-center justify-between mb-3">
            <span className="ds-label">{scanning ? 'Đang trích xuất…' : 'Xem trước hoá đơn'}</span>
            {scanned && <Badge tone="brand" icon={Sparkles}>AI đã đọc · độ tin cậy 98%</Badge>}
          </div>
          <InvoicePaper bill={f} recipient={rc} scanning={scanning} />
        </div>
      }
      footer={step === 0 ? <>
        <Button variant="ghost" onClick={onClose}>Huỷ</Button>
        <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!file || scanning} onClick={() => setStep(1)}>Tiếp tục</Button>
      </> : <>
        <Button variant="ghost" onClick={() => setStep(0)}>Quay lại</Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="lg" icon={Save} disabled={!hasRecipient} onClick={() => save('draft')}>Lưu nháp</Button>
          <Button variant="primary" size="lg" icon={Send} disabled={!fullOk} onClick={() => save('review')}>Gửi duyệt</Button>
        </div>
      </>}
    >
      {step === 0 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Tải hoá đơn lên</h2><p className="text-muted mt-1">Mạch tự đọc người bán, số hoá đơn, số tiền, VAT và hạn thanh toán.</p></div>
          <FileDrop value={file} onChange={onFile} label="Kéo thả hoá đơn PDF hoặc ảnh vào đây" hint="PDF, XML hoá đơn điện tử, JPG hoặc PNG · tối đa 10 MB" accept=".pdf,.xml,.jpg,.jpeg,.png" />
          {scanning && (
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 text-brand-ink px-4 py-3 animate-fade-in" role="status">
              <Loader2 size={17} className="animate-spin shrink-0" />
              <div className="text-[13.5px]"><b className="font-[600]">Đang trích xuất dữ liệu…</b> Đối chiếu mã số thuế với danh sách người nhận.</div>
            </div>
          )}
          {!file && (
            <button type="button" onClick={() => setStep(1)} className="self-start inline-flex items-center gap-1.5 text-[13px] font-[550] text-brand-ink hover:underline underline-offset-4">
              <PenLine size={14} />Nhập thủ công không cần tệp
            </button>
          )}
          <div className="card p-4 flex items-start gap-3">
            <span className="size-9 grid place-items-center rounded-lg bg-subtle text-muted shrink-0"><Mail size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-[550]">Hoặc chuyển tiếp email</div>
              <div className="ds-caption">Gửi hoá đơn đến <span className="font-mono text-dim">{FORWARD_EMAIL}</span> — Mạch tự nhập thành bản nháp.</div>
            </div>
            <Button size="sm" variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(FORWARD_EMAIL); toast('Đã sao chép địa chỉ email') }}>Sao chép</Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Kiểm tra thông tin</h2><p className="text-muted mt-1">{scanned ? 'Đã điền sẵn từ hoá đơn — bạn chỉ cần xác nhận.' : 'Điền thông tin trên hoá đơn.'}</p></div>
          {scanned && <Callout tone="brand" icon={Sparkles}>Đã nhận diện {isNew ? 'người bán mới' : `người bán “${rc?.name}”`}, số hoá đơn, ngày, hạn thanh toán, số tiền và thuế suất.</Callout>}

          <Select label="Người nhận" value={f.recipient} onChange={set('recipient')} placeholder="Chọn người nhận"
            options={[...recipients.map((r) => ({ value: r.id, label: r.name })), { value: NEW, label: '+ Thêm người nhận mới' }]} />
          {isNew && (
            <div className="rounded-xl border border-line bg-surface p-4 flex flex-col gap-3 animate-pop-in">
              <div className="ds-h3">Người nhận mới</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Tên công ty" value={f.nr.name} onChange={setNr('name')} placeholder="VD: Công ty TNHH Ánh Dương" />
                <Input label="Mã số thuế" optional value={f.nr.taxCode} onChange={setNr('taxCode')} placeholder="0312 345 678" />
                <Select label="Ngân hàng" value={f.nr.bank} onChange={setNr('bank')} options={BANKS} />
                <Input label="Số tài khoản" value={f.nr.account} inputMode="numeric" placeholder="0123 4567 89"
                  onChange={(e) => setF((x) => ({ ...x, nr: { ...x.nr, account: e.target.value.replace(/[^\d ]/g, '') } }))} />
              </div>
              {newOk && <Callout tone="pos" icon={ShieldCheck}>Tên chủ tài khoản: <b className="font-[650]">{toHolder(f.nr.name)}</b> — khớp với thông tin ngân hàng.</Callout>}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <Input label="Số hoá đơn" value={f.number} onChange={set('number')} placeholder="VD: 0001234" className="sm:col-span-1" />
            <Input type="date" label="Ngày phát hành" value={f.issued} onChange={set('issued')} />
            <Input type="date" label="Hạn thanh toán" value={f.due} onChange={set('due')} error={dueErr} />
          </div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <MoneyInput label="Tổng thanh toán (gồm VAT)" value={f.amount} onChange={set('amount')} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-[550] text-dim">Thuế GTGT</span>
              <Segmented value={Number(f.vat)} onChange={set('vat')} options={[0, 5, 8, 10].map((v) => ({ value: v, label: `${v}%` }))} className="h-10" />
            </div>
          </div>
          {f.amount > 0 && <p className="ds-caption -mt-3">Tiền hàng {formatVND(preTax(f.amount, f.vat))} · thuế {formatVND(f.amount - preTax(f.amount, f.vat))}</p>}
          <Select label="Danh mục" value={f.category} onChange={set('category')} placeholder="Chọn danh mục" options={CATS.map((c) => ({ value: c.id, label: c.label }))} />
          <Textarea label="Ghi chú" optional value={f.note} onChange={set('note')} placeholder="Hoá đơn cho việc gì?" rows={2} />
          {file && <p className="ds-caption">Tệp đính kèm: {file.name}</p>}
        </div>
      )}
    </FlowShell>
  )
}
