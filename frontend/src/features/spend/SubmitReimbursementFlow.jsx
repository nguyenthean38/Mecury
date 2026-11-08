/* ==========================================================
   Luồng nộp hoàn ứng: Chứng từ (AI đọc hoá đơn) → Chi tiết → Xem lại
   ========================================================== */
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Sparkles, Loader2, PenLine, Send, AlertTriangle } from 'lucide-react'
import { formatDate, formatVND, readVND, TODAY, daysBetween } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import { categoryList } from '@/data/transactions'
import {
  Button, FlowShell, FileDrop, MoneyInput, Input, Select, Textarea, KeyValue, Callout, CategoryTag,
} from '@/components/ui'
import { ReceiptPreview } from './ReceiptPreview'

const STEPS = ['Chứng từ', 'Chi tiết', 'Xem lại']
const todayISO = () => TODAY.toISOString().slice(0, 10)

/** Kết quả "AI đọc hoá đơn" mô phỏng — chọn theo tên tệp để lần nào cũng giống nhau */
const SCANS = [
  { merchant: 'Nhà hàng Quán Bụi', amount: 1450000, date: '2026-11-07', category: 'meals', note: 'Tiếp khách dự án Gốm Sứ Bát Tràng An' },
  { merchant: 'Grab', amount: 268000, date: '2026-11-07', category: 'travel', note: 'Đi gặp khách hàng ở quận 7' },
  { merchant: 'Nhà sách Fahasa', amount: 612000, date: '2026-11-06', category: 'office', note: 'Sổ tay và bút cho buổi workshop' },
  { merchant: 'Highlands Coffee', amount: 245000, date: '2026-11-08', category: 'meals', note: 'Cà phê họp với đối tác' },
]
const pickScan = (name = '') => SCANS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % SCANS.length]

export function SubmitReimbursementFlow({ onClose, policy }) {
  const add = useBank((s) => s.add)
  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanned, setScanned] = useState(false)
  const [done, setDone] = useState(null)
  const [f, setF] = useState({ amount: 0, date: todayISO(), merchant: '', category: '', note: '' })
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const allowed = categoryList.filter((c) => (policy?.categories?.length ? policy.categories.includes(c.id) : !['revenue', 'transfer', 'interest'].includes(c.id)))
  const age = daysBetween(f.date, TODAY)
  const deadline = policy?.deadline || 30

  const onFile = (v) => {
    setFile(v)
    clearTimeout(timer.current)
    if (!v) { setScanning(false); setScanned(false); return }
    setScanning(true)
    setScanned(false)
    timer.current = setTimeout(() => {
      setF((x) => ({ ...x, ...pickScan(v.name) }))
      setScanning(false)
      setScanned(true)
    }, 1400)
  }

  const valid = f.amount >= 1000 && f.merchant.trim().length >= 2 && !!f.category && age >= 0
  const canNext = [!!file && !scanning, valid, true][step]
  const last = step === STEPS.length - 1

  const submit = () => {
    const rb = {
      id: newId('rb'), member: 'u1', merchant: f.merchant.trim(), amount: f.amount, date: f.date, category: f.category,
      note: f.note.trim(), status: 'pending', receipt: file?.name || null, submitted: todayISO(),
    }
    add('reimbursements', rb)
    toast({ title: 'Đã nộp hoàn ứng', desc: `${rb.merchant} · ${formatVND(rb.amount)}` })
    setDone(rb)
  }
  const reset = () => { setDone(null); setStep(0); setFile(null); setScanned(false); setF({ amount: 0, date: todayISO(), merchant: '', category: '', note: '' }) }

  if (done) {
    return (
      <FlowShell onClose={onClose} title="Nộp hoàn ứng">
        <div className="flex flex-col items-center text-center pt-6">
          <span className="size-16 rounded-full grid place-items-center mb-5 bg-pos-soft text-pos animate-pop-in"><Check size={32} strokeWidth={2.6} /></span>
          <h2 className="ds-h1">Đã nộp hoàn ứng</h2>
          <p className="text-muted mt-2 max-w-md">{policy?.approverName || 'Trần Quốc Bảo'} sẽ xem xét yêu cầu của bạn. Thường mất dưới 2 ngày làm việc.</p>
          <div className="mt-7 w-full card p-5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-muted text-[13px]">Số tiền</span>
              <span className="text-[22px] font-[500] num">{formatVND(done.amount)}</span>
            </div>
            <KeyValue className="mt-2" items={[
              { label: 'Nơi chi', value: done.merchant },
              { label: 'Ngày chi', value: formatDate(done.date) },
              { label: 'Mã yêu cầu', value: <span className="font-mono text-[12.5px]">{done.id.toUpperCase()}</span> },
            ]} />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="secondary" onClick={reset}>Nộp khoản khác</Button>
            <Button variant="primary" onClick={onClose}>Xong</Button>
          </div>
        </div>
      </FlowShell>
    )
  }

  return (
    <FlowShell
      onClose={onClose}
      title="Nộp hoàn ứng"
      steps={STEPS}
      current={step}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
      aside={
        <div className="p-10 pt-14">
          <div className="ds-label mb-3">{scanning ? 'AI đang đọc hoá đơn…' : 'Chứng từ'}</div>
          <ReceiptPreview merchant={f.merchant} amount={f.amount} date={f.date} category={f.category} file={file} scanning={scanning}
            emptyTitle="Xem trước chứng từ" emptyDesc="Tải hoá đơn lên để Mạch đọc và hiển thị ở đây." />
        </div>
      }
      footer={<>
        <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep(step - 1)}>{step === 0 ? 'Huỷ' : 'Quay lại'}</Button>
        {last
          ? <Button variant="primary" size="lg" icon={Send} onClick={submit}>Nộp yêu cầu</Button>
          : <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!canNext} onClick={() => setStep(step + 1)}>Tiếp tục</Button>}
      </>}
    >
      {step === 0 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Tải chứng từ lên</h2><p className="text-muted mt-1">Chụp hoặc tải hoá đơn — Mạch tự đọc nơi chi, số tiền và ngày cho bạn.</p></div>
          <FileDrop value={file} onChange={onFile} label="Kéo thả hoá đơn vào đây hoặc bấm để chọn" />
          {scanning && (
            <div className="flex items-center gap-3 rounded-xl bg-brand-50 text-brand-ink px-4 py-3 animate-fade-in" role="status">
              <Loader2 size={17} className="animate-spin shrink-0" />
              <div className="text-[13.5px]"><b className="font-[600]">AI đang đọc hoá đơn…</b> Nhận diện nơi chi, số tiền, ngày và thuế.</div>
            </div>
          )}
          {scanned && !scanning && (
            <Callout tone="pos" icon={Sparkles} title="Đã đọc xong hoá đơn">
              {f.merchant} · {formatVND(f.amount)} · {formatDate(f.date)}. Bạn có thể chỉnh lại ở bước sau.
            </Callout>
          )}
          {!file && (
            <button type="button" onClick={() => setStep(1)} className="self-start inline-flex items-center gap-1.5 text-[13px] font-[550] text-brand-ink hover:underline underline-offset-4">
              <PenLine size={14} />Không có chứng từ? Nhập thủ công
            </button>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Chi tiết khoản chi</h2><p className="text-muted mt-1">{scanned ? 'Đã điền sẵn từ hoá đơn — kiểm tra lại cho chắc.' : 'Điền thông tin khoản bạn đã tự chi.'}</p></div>
          <div>
            <div className="text-[13px] font-[550] text-dim mb-1.5">Số tiền</div>
            <MoneyInput big value={f.amount} onChange={set('amount')} autoFocus={!scanned} />
            {f.amount > 0 && <p className="ds-caption mt-2 italic">{readVND(f.amount)}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Nơi chi tiêu" value={f.merchant} onChange={set('merchant')} placeholder="VD: Grab, Highlands Coffee" />
            <Input type="date" label="Ngày chi" value={f.date} max={todayISO()} onChange={set('date')}
              error={age < 0 ? 'Ngày chi không thể ở tương lai' : undefined} />
          </div>
          {age > deadline && <Callout tone="warn" icon={AlertTriangle}>Khoản chi đã quá {deadline} ngày — có thể bị từ chối theo chính sách hoàn ứng.</Callout>}
          <Select label="Danh mục" value={f.category} onChange={set('category')} placeholder="Chọn danh mục" options={allowed.map((c) => ({ value: c.id, label: c.label }))} />
          <Textarea label="Ghi chú" optional value={f.note} onChange={set('note')} placeholder="Chi cho việc gì, đi cùng ai…" rows={3} />
        </div>
      )}

      {last && (
        <div className="flex flex-col gap-5 animate-slide-up">
          <div><h2 className="ds-h1">Kiểm tra lại</h2><p className="text-muted mt-1">Yêu cầu sẽ được gửi đến người duyệt ngay khi bạn bấm nộp.</p></div>
          <div className="card p-5">
            <div className="text-muted text-[13px]">Số tiền xin hoàn</div>
            <div className="text-[34px] font-[500] tracking-tight num">{formatVND(f.amount)}</div>
            <KeyValue className="mt-3" items={[
              { label: 'Nơi chi', value: f.merchant },
              { label: 'Ngày chi', value: formatDate(f.date) },
              { label: 'Danh mục', value: <CategoryTag id={f.category} /> },
              { label: 'Ghi chú', value: f.note || '—' },
              { label: 'Chứng từ', value: file?.name || <span className="text-warn">Chưa đính kèm</span> },
              { label: 'Người duyệt', value: policy?.approverName || 'Trần Quốc Bảo' },
            ]} />
          </div>
          {!file && <Callout tone="warn" icon={AlertTriangle}>Yêu cầu không có chứng từ dễ bị từ chối. Bạn có thể quay lại bước 1 để tải lên.</Callout>}
        </div>
      )}
    </FlowShell>
  )
}
