/* Tuỳ chỉnh mẫu hoá đơn: logo, màu nhấn, ghi chú chân trang, thông tin thanh toán */
import { useRef, useState } from 'react'
import { Check, ImagePlus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBank, toast } from '@/store'
import { Button, Modal, Textarea, Toggle, Field } from '@/components/ui'
import { InvoicePaper } from './InvoicePaper'
import { ACCENTS, useInvoiceTemplate } from './helpers'

export function TemplateModal({ open, onClose }) {
  const tpl = useInvoiceTemplate()
  const sample = useBank((s) => s.invoices.find((i) => i.status !== 'void') || s.invoices[0])
  const customer = useBank((s) => s.customers.find((c) => c.id === sample?.customer))
  const [f, setF] = useState(() => ({ logo: tpl.logo, accent: tpl.accent, footer: tpl.footer, showBank: tpl.showBank, showQr: tpl.showQr }))
  const fileRef = useRef(null)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))

  const pickLogo = (file) => {
    if (!file) return
    if (file.size > 1024 * 1024) { toast({ title: 'Ảnh quá lớn', desc: 'Vui lòng chọn ảnh dưới 1 MB.', tone: 'neg' }); return }
    const reader = new FileReader()
    reader.onload = () => setF((x) => ({ ...x, logo: { name: file.name, src: reader.result } }))
    reader.readAsDataURL(file)
  }
  const save = () => {
    tpl.save(f)
    toast({ title: 'Đã lưu mẫu hoá đơn', desc: 'Áp dụng cho mọi hoá đơn gửi từ bây giờ.', tone: 'pos' })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Tuỳ chỉnh mẫu hoá đơn" desc="Khách hàng sẽ thấy mẫu này trong email, link thanh toán và bản PDF."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" onClick={save}>Lưu mẫu</Button></>}>
      <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <Field label="Logo">
            <div className="flex items-center gap-3">
              <span className="size-14 rounded-xl border border-line bg-subtle grid place-items-center overflow-hidden shrink-0">
                {f.logo?.src ? <img src={f.logo.src} alt="Logo" className="max-h-full max-w-full object-contain" /> : <ImagePlus size={20} className="text-faint" />}
              </span>
              <div className="flex flex-col items-start gap-1 min-w-0">
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>{f.logo ? 'Đổi ảnh' : 'Tải ảnh lên'}</Button>
                  {f.logo && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => set('logo')(null)} aria-label="Gỡ logo" />}
                </div>
                <span className="ds-caption truncate max-w-full">{f.logo?.name || 'PNG hoặc SVG, nền trong suốt, dưới 1 MB'}</span>
              </div>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={(e) => pickLogo(e.target.files?.[0])} />
            </div>
          </Field>

          <Field label="Màu nhấn">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Màu nhấn">
              {ACCENTS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={f.accent === c} aria-label={`Màu ${c}`} onClick={() => set('accent')(c)}
                  className={cn('size-8 rounded-full grid place-items-center ring-offset-2 ring-offset-surface transition-shadow', f.accent === c ? 'ring-2 ring-fg' : 'hover:ring-2 hover:ring-line-strong')}
                  style={{ background: c }}>
                  {f.accent === c && <Check size={15} strokeWidth={3} className="text-white" />}
                </button>
              ))}
            </div>
          </Field>

          <Textarea label="Ghi chú chân trang" rows={3} value={f.footer} onChange={set('footer')} maxLength={200} hint={`${f.footer.length}/200 ký tự`} />

          <div className="flex flex-col gap-4 rounded-xl border border-line p-4">
            <Toggle label="Hiện thông tin chuyển khoản" desc="Ngân hàng, số tài khoản, nội dung chuyển khoản" checked={f.showBank} onChange={set('showBank')} />
            <Toggle label="Hiện mã VietQR" desc="Khách quét để trả đúng số tiền và nội dung" checked={f.showQr} onChange={set('showQr')} />
          </div>
        </div>

        <div className="rounded-2xl bg-subtle border border-line p-4 sm:p-5 max-h-[60vh] overflow-y-auto">
          <div className="ds-label mb-3">Xem trước</div>
          {sample && <InvoicePaper invoice={sample} customer={customer} template={f} compact />}
        </div>
      </div>
    </Modal>
  )
}
