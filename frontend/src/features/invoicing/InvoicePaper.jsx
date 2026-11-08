/* ==========================================================
   Bản hoá đơn dạng "giấy" — luôn nền trắng chữ tối ở cả hai chế độ
   (để giống bản in / PDF gửi khách).
   <InvoicePaper invoice={…} customer={…} template={…} />
   ========================================================== */
import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, readVND, toDate } from '@/lib/format'
import { invoiceTotals } from '@/data/invoicing'
import { COMPANY } from '@/data/org'
import { useBank } from '@/store'
import { QrCode } from '@/components/ui'
import { LogoMark } from '@/components/brand/Logo'
import { useInvoiceTemplate, transferMemo, PAY_METHODS } from './helpers'

const INK = 'text-[#1b1f1d]'
const MUTED = 'text-[#6b716d]'
const LINE = 'border-[#e4e6e1]'

function dateLine(d) {
  const x = toDate(d)
  const p = (n) => String(n).padStart(2, '0')
  return `Ngày ${p(x.getDate())} tháng ${p(x.getMonth() + 1)} năm ${x.getFullYear()}`
}

function Row({ label, children, strong }) {
  return (
    <div className="flex gap-2 leading-[1.55]">
      <span className={cn('shrink-0', MUTED)}>{label}:</span>
      <span className={cn('min-w-0', strong && 'font-[650] uppercase')}>{children || <span className="inline-block w-24 h-2.5 rounded bg-[#eef0ec] align-middle" />}</span>
    </div>
  )
}

export function InvoicePaper({ invoice, customer, template: override, className, compact }) {
  const saved = useInvoiceTemplate()
  const t = { ...saved, ...override }
  const catalog = useBank((s) => s.catalog)
  const account = useBank((s) => s.accounts.find((a) => a.id === (invoice.account || 'acc-main')))
  const { subtotal, vat, total, due } = invoiceTotals(invoice)
  const byRate = {}
  invoice.items.forEach((i) => {
    const r = i.vat || 0
    byRate[r] = (byRate[r] || 0) + Math.round(i.qty * i.price * r / 100)
  })
  const unitOf = (i) => i.unit || catalog.find((c) => c.id === i.catalog)?.unit || 'Gói'
  const serial = String(invoice.number || '').split('-').pop() || '—'
  const accent = t.accent || '#138f66'
  const methods = (invoice.methods || ['transfer']).map((m) => PAY_METHODS[m]).filter(Boolean).join(', ')
  const isVoid = invoice.status === 'void'
  const mixedVat = new Set(invoice.items.map((i) => i.vat || 0)).size > 1

  return (
    <div className={cn('relative bg-white rounded-xl shadow-md border', LINE, INK, compact ? 'p-5 text-[11px]' : 'p-6 sm:p-8 text-[12px]', '[--qr-bg:#fff]', className)}>
      <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl" style={{ background: accent }} />
      {isVoid && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-xl">
          <span className="rotate-[-18deg] border-4 border-[#cf3f57]/50 text-[#cf3f57]/60 font-[800] tracking-[.2em] text-[42px] px-6 py-1 rounded-lg">ĐÃ HUỶ</span>
        </div>
      )}

      {/* Đầu hoá đơn */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {t.logo?.src
            ? <img src={t.logo.src} alt="Logo công ty" className="h-11 w-auto max-w-[120px] object-contain shrink-0" />
            : <span className="size-11 shrink-0 rounded-xl grid place-items-center text-white font-[750] text-[15px]" style={{ background: accent }}>SV</span>}
          <div className="min-w-0">
            <div className="font-[700] text-[13px] leading-snug uppercase">{COMPANY.name}</div>
            <div className={cn('mt-0.5', MUTED)}>MST: <span className="num">{COMPANY.taxCode}</span></div>
          </div>
        </div>
        <div className="sm:text-right shrink-0">
          <div className="font-[750] tracking-[.06em] text-[15px] leading-tight" style={{ color: accent }}>
            {invoice.einvoice ? 'HOÁ ĐƠN GIÁ TRỊ GIA TĂNG' : 'HOÁ ĐƠN'}
          </div>
          <div className={cn('mt-1 italic', MUTED)}>{dateLine(invoice.issued)}</div>
          <div className="mt-1.5 num">Ký hiệu: <b className="font-[650]">1C26TSV</b> · Số: <b className="font-[650]">{serial}</b></div>
          {invoice.einvoice && <div className={cn('num mt-0.5', MUTED)}>Mã CQT: {invoice.cqtCode || '00A1B2C3D4E5F6A7B8C9D0E1F2'}</div>}
        </div>
      </div>

      {/* Bên bán / bên mua */}
      <div className={cn('mt-5 grid gap-4 border-t pt-4', LINE, !compact && 'sm:grid-cols-2')}>
        <div>
          <div className="text-[10.5px] font-[700] tracking-[.12em] uppercase mb-1.5" style={{ color: accent }}>Đơn vị bán hàng</div>
          <Row label="Tên" strong>{COMPANY.name}</Row>
          <Row label="MST"><span className="num">{COMPANY.taxCode}</span></Row>
          <Row label="Địa chỉ">{`${COMPANY.address}, ${COMPANY.ward}, ${COMPANY.city}`}</Row>
          <Row label="Điện thoại"><span className="num">{COMPANY.phone}</span></Row>
        </div>
        <div>
          <div className="text-[10.5px] font-[700] tracking-[.12em] uppercase mb-1.5" style={{ color: accent }}>Đơn vị mua hàng</div>
          <Row label="Tên" strong>{customer?.name}</Row>
          <Row label="Người mua">{customer?.contact}</Row>
          <Row label="MST">{customer?.taxCode && <span className="num">{customer.taxCode}</span>}</Row>
          <Row label="Địa chỉ">{customer?.address}</Row>
          <Row label="Hình thức TT">{methods}</Row>
        </div>
      </div>

      {/* Bảng hàng hoá */}
      <div className="mt-5 overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse min-w-[460px]">
          <thead>
            <tr className="text-left" style={{ background: `color-mix(in srgb, ${accent} 9%, #fff)` }}>
              <th className="py-2 px-2 font-[650] w-9 text-center">STT</th>
              <th className="py-2 px-2 font-[650]">Tên hàng hoá, dịch vụ</th>
              <th className="py-2 px-2 font-[650] w-14">ĐVT</th>
              <th className="py-2 px-2 font-[650] w-10 text-right">SL</th>
              <th className="py-2 px-2 font-[650] text-right">Đơn giá</th>
              <th className="py-2 px-2 font-[650] text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 && (
              <tr><td colSpan={6} className={cn('py-6 text-center italic border-b', LINE, MUTED)}>Chưa có dòng hàng hoá, dịch vụ</td></tr>
            )}
            {invoice.items.map((i, idx) => (
              <tr key={i.key || idx} className={cn('border-b align-top', LINE)}>
                <td className="py-2 px-2 text-center num">{idx + 1}</td>
                <td className="py-2 px-2">
                  {i.name || <span className={cn('italic', MUTED)}>Chưa đặt tên</span>}
                  {mixedVat && <span className={cn('ml-1', MUTED)}>(VAT {i.vat}%)</span>}
                </td>
                <td className="py-2 px-2">{unitOf(i)}</td>
                <td className="py-2 px-2 text-right num">{formatNumber(i.qty)}</td>
                <td className="py-2 px-2 text-right num whitespace-nowrap">{formatNumber(i.price)}</td>
                <td className="py-2 px-2 text-right num whitespace-nowrap">{formatNumber(i.qty * i.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tổng */}
      <div className="mt-3 flex justify-end">
        <div className="w-full sm:w-[64%] flex flex-col gap-1">
          <div className="flex justify-between gap-4"><span className={MUTED}>Cộng tiền hàng</span><span className="num">{formatNumber(subtotal)} ₫</span></div>
          {Object.keys(byRate).sort().map((r) => (
            <div key={r} className="flex justify-between gap-4"><span className={MUTED}>Thuế GTGT {r}%</span><span className="num">{formatNumber(byRate[r])} ₫</span></div>
          ))}
          {Object.keys(byRate).length === 0 && <div className="flex justify-between gap-4"><span className={MUTED}>Thuế GTGT</span><span className="num">{formatNumber(vat)} ₫</span></div>}
          <div className={cn('flex justify-between gap-4 border-t pt-2 mt-1 text-[13.5px] font-[700]', LINE)}>
            <span>Tổng cộng thanh toán</span><span className="num" style={{ color: accent }}>{formatNumber(total)} ₫</span>
          </div>
          {invoice.paid > 0 && invoice.status !== 'paid' && (
            <div className="flex justify-between gap-4 font-[600]"><span className={MUTED}>Còn phải thu</span><span className="num">{formatNumber(due)} ₫</span></div>
          )}
        </div>
      </div>
      <div className={cn('mt-3 italic', MUTED)}>Số tiền viết bằng chữ: <span className={INK}>{readVND(total)}.</span></div>
      {invoice.memo && <div className={cn('mt-2', MUTED)}>Ghi chú: <span className={INK}>{invoice.memo}</span></div>}

      {/* Thông tin thanh toán */}
      {(t.showBank || t.showQr) && (
        <div className={cn('mt-5 rounded-lg border p-4 flex items-center gap-4', LINE, compact ? 'flex-row' : 'flex-col-reverse sm:flex-row')} style={{ background: '#fafbf9' }}>
          {t.showBank && (
            <div className="flex-1 min-w-0 w-full">
              <div className="font-[650] mb-1">Thông tin chuyển khoản</div>
              <Row label="Ngân hàng">{account?.bank || COMPANY.partnerBank}</Row>
              <Row label="Số tài khoản"><span className="num">{account?.number}</span> <span className={MUTED}>({account?.name} ••{account?.last4})</span></Row>
              <Row label="Chủ tài khoản">CONG TY CO PHAN SEN VIET DIGITAL</Row>
              <Row label="Nội dung"><span className="font-mono">{transferMemo(invoice)}</span></Row>
              <Row label="Hạn thanh toán"><b className="font-[650]">{formatDate(invoice.due)}</b></Row>
            </div>
          )}
          {t.showQr && (
            <div className="shrink-0 flex flex-col items-center text-[#0c120f]">
              <QrCode value={`${invoice.number}-${total}`} size={compact ? 84 : 104} />
              <span className="text-[9.5px] font-[700] tracking-wide mt-1">VietQR · NAPAS 247</span>
            </div>
          )}
        </div>
      )}

      {/* Chữ ký */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-center">
        <div>
          <div className="font-[650]">Người mua hàng</div>
          <div className={cn('italic', MUTED)}>(Ký, ghi rõ họ tên)</div>
        </div>
        <div>
          <div className="font-[650]">Người bán hàng</div>
          {invoice.einvoice && !['draft', 'scheduled'].includes(invoice.status) ? (
            <div className="mt-2 inline-flex flex-col items-start gap-0.5 rounded-md border border-[#9fd3bc] bg-[#f0f9f4] px-2.5 py-1.5 text-left text-[10px] text-[#0b5f45]">
              <span className="inline-flex items-center gap-1 font-[700]"><ShieldCheck size={12} /> Chữ ký số hợp lệ</span>
              <span>Ký bởi: {COMPANY.name.toUpperCase()}</span>
              <span className="num">Ký ngày: {formatDate(invoice.sentAt || invoice.issued)}</span>
            </div>
          ) : <div className={cn('italic', MUTED)}>(Ký, ghi rõ họ tên)</div>}
        </div>
      </div>

      {t.footer && <div className={cn('mt-6 border-t pt-3 text-center', LINE, MUTED)}>{t.footer}</div>}
      <div className={cn('mt-2 flex items-center justify-center gap-1.5 text-[10px]', MUTED)}>
        <LogoMark size={12} /> Phát hành qua Mạch
      </div>
    </div>
  )
}
