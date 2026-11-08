/* ==========================================================
   Bản xem trước hoá đơn GTGT dạng tờ giấy
   (dựng lại từ dữ liệu hoá đơn + người nhận — bản demo không có PDF thật)
   ========================================================== */
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, readVND } from '@/lib/format'
import { COMPANY } from '@/data/org'
import { CATEGORIES } from '@/data/transactions'
import { preTax } from './billUtils'

const Blank = ({ w = 'w-24' }) => <span className={cn('skeleton inline-block h-3 align-middle', w)} />

export function InvoicePaper({ bill, recipient, scanning, className }) {
  const amount = bill.amount || 0
  const base = preTax(amount, bill.vat)
  const tax = amount - base
  const item = bill.note || CATEGORIES[bill.category]?.label || 'Hàng hoá, dịch vụ'
  return (
    <div className={cn('relative mx-auto w-full max-w-[560px] bg-surface border border-line rounded-[6px] shadow-md text-[11.5px] leading-relaxed text-dim overflow-hidden', className)}>
      <div className="h-1.5 bg-gradient-to-r from-brand-500 via-brand-300 to-gold" aria-hidden />
      <div className="px-6 sm:px-8 py-7">
        {/* Người bán + tiêu đề */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-faint uppercase tracking-[.12em] text-[10px] font-[600]">Đơn vị bán hàng</div>
            <div className="mt-1 text-[13.5px] font-[650] text-fg break-words">{recipient?.name || <Blank w="w-40" />}</div>
            <div>MST: {recipient?.taxCode || (recipient ? '—' : <Blank w="w-20" />)}</div>
            {recipient?.email && <div className="truncate">{recipient.email}</div>}
          </div>
          <div className="sm:text-right shrink-0">
            <div className="text-[13px] font-[700] text-fg tracking-wide">HOÁ ĐƠN GIÁ TRỊ GIA TĂNG</div>
            <div className="text-faint">Ký hiệu: 1C26TSV</div>
            <div>Số: <span className="font-mono text-fg">{bill.number || <Blank w="w-16" />}</span></div>
            <div>Ngày {bill.issued ? formatDate(bill.issued) : <Blank w="w-16" />}</div>
          </div>
        </div>

        {/* Người mua */}
        <div className="mt-5 rounded-md bg-subtle px-4 py-3">
          <div className="text-faint uppercase tracking-[.12em] text-[10px] font-[600]">Đơn vị mua hàng</div>
          <div className="mt-0.5 font-[600] text-fg">{COMPANY.name}</div>
          <div>MST: {COMPANY.taxCode} · {COMPANY.address}, {COMPANY.city}</div>
        </div>

        {/* Hàng hoá */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-y border-line-strong text-faint text-[10.5px] uppercase tracking-wide">
                <th className="py-2 pr-2 text-left font-[600] w-8">STT</th>
                <th className="py-2 pr-2 text-left font-[600]">Tên hàng hoá, dịch vụ</th>
                <th className="py-2 pr-2 text-right font-[600] w-10">SL</th>
                <th className="py-2 text-right font-[600] w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="py-2.5 pr-2 align-top">1</td>
                <td className="py-2.5 pr-2 text-fg">{item}</td>
                <td className="py-2.5 pr-2 text-right num">1</td>
                <td className="py-2.5 text-right num">{amount ? formatNumber(base) : <Blank w="w-16" />}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tổng */}
        <div className="mt-3 ml-auto w-full sm:w-[62%] flex flex-col gap-1">
          <div className="flex justify-between"><span>Cộng tiền hàng</span><span className="num">{formatNumber(base)}</span></div>
          <div className="flex justify-between"><span>Thuế suất GTGT {bill.vat || 0}%</span><span className="num">{formatNumber(tax)}</span></div>
          <div className="flex justify-between border-t border-line-strong pt-1.5 mt-1 text-[13px] font-[700] text-fg">
            <span>Tổng thanh toán</span><span className="num">{formatNumber(amount)} ₫</span>
          </div>
        </div>
        <div className="mt-2 italic text-muted">Số tiền viết bằng chữ: {readVND(amount)}.</div>

        {/* Thanh toán */}
        <div className="mt-6 pt-4 border-t border-dashed border-line-strong grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-faint">Hạn thanh toán</div>
            <div className="font-[600] text-fg">{bill.due ? formatDate(bill.due) : '—'}</div>
          </div>
          <div className="sm:text-right">
            <div className="text-faint">Chuyển khoản đến</div>
            <div className="font-[600] text-fg">{recipient?.bank || '—'}</div>
            <div className="font-mono">{recipient?.account || ''}</div>
          </div>
        </div>
        <div className="mt-6 flex items-end justify-between gap-4">
          <div className="text-faint text-[10.5px]">Mã tra cứu: {(bill.number || 'XXXX').replace(/\W/g, '').slice(-6).toUpperCase()}SV · tracuu.hoadon.vn</div>
          <div className="text-center">
            <div className="rounded-md border border-pos/40 text-pos px-2.5 py-1 text-[10px] font-[650] uppercase tracking-wide">Đã ký số</div>
          </div>
        </div>
      </div>
      {scanning && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brand-300/30 to-transparent animate-[invscan_1.2s_ease-in-out_infinite]" />
          <style>{'@keyframes invscan{0%{top:-20%}100%{top:100%}}'}</style>
        </div>
      )}
    </div>
  )
}
