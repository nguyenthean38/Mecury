import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X, ArrowUp, RotateCcw, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatVND, formatCompact, TODAY, formatDate } from '@/lib/format'
import { cashflowByMonth, groupSpend, totalBalance } from '@/lib/selectors'
import { useBank, useUI } from '@/store'
import { CATEGORIES, MERCHANTS } from '@/data/transactions'
import { INVOICE_STATUS, invoiceTotals } from '@/data/invoicing'
import { IconButton } from '@/components/ui'

const SUGGESTIONS = [
  'Tháng này công ty chi bao nhiêu cho quảng cáo?',
  'Với tốc độ chi hiện tại, tiền đủ dùng bao lâu?',
  'Hoá đơn nào khách chưa thanh toán?',
  '5 khoản chi lớn nhất 30 ngày qua',
  'Còn giao dịch nào chưa phân loại?',
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

/** "Trợ lý" mô phỏng: đọc câu hỏi, tính số liệu thật từ dữ liệu demo rồi trả lời. */
function answer(q, s) {
  const n = norm(q)
  const months = cashflowByMonth(s.transactions, 3)
  const cur = months[months.length - 1], prev = months[months.length - 2]
  if (/quang cao|marketing|ads/.test(n)) {
    const thisM = groupSpend(s.transactions, { days: TODAY.getDate() - 1 }).find((x) => x.key === 'marketing')?.value || 0
    const last30 = groupSpend(s.transactions, { days: 30 }).find((x) => x.key === 'marketing')?.value || 0
    const b = s.budgets.find((x) => x.id === 'b1')
    return {
      text: `Từ đầu tháng 11 đến nay, công ty đã chi **${formatVND(thisM)}** cho quảng cáo & marketing (30 ngày gần nhất: ${formatVND(last30)}).\n\nNgân sách “${b.name}” đã dùng **${Math.round((b.spent / b.limit) * 100)}%** (${formatCompact(b.spent)} / ${formatCompact(b.limit)}). Phần lớn chi phí đến từ Meta Ads và Google Ads trên thẻ ••3856 của Thu Hà.`,
      links: [{ label: 'Xem giao dịch quảng cáo', to: '/giao-dich?danh-muc=marketing' }, { label: 'Mở ngân sách', to: '/chi-tieu-nhom/b1' }],
    }
  }
  if (/du dung|runway|bao lau|het tien|du tien/.test(n)) {
    const full = cashflowByMonth(s.transactions, 7).slice(1, 6)
    const burn = -full.reduce((a, m) => a + m.outflow, 0) / full.length
    const income = full.reduce((a, m) => a + m.inflow, 0) / full.length
    const bal = totalBalance(s.accounts)
    const net = income - burn
    return {
      text: `Tổng số dư hiện tại là **${formatVND(bal)}**. Trung bình 5 tháng gần đây, công ty chi khoảng **${formatCompact(burn)}/tháng** và thu về **${formatCompact(income)}/tháng**.\n\n${net >= 0 ? `Dòng tiền đang dương (+${formatCompact(net)}/tháng), nên số dư vẫn tăng đều.` : `Dòng tiền đang âm ${formatCompact(-net)}/tháng.`} Nếu không có thêm doanh thu, số dư đủ chi trả khoảng **${(bal / burn).toFixed(1).replace('.', ',')} tháng** hoạt động.`,
      links: [{ label: 'Xem báo cáo dòng tiền', to: '/phan-tich' }],
    }
  }
  if (/hoa don|chua thanh toan|qua han|cong no|phai thu/.test(n)) {
    const open = s.invoices.filter((v) => ['sent', 'viewed', 'partial', 'overdue'].includes(v.status))
    const total = open.reduce((a, v) => a + invoiceTotals(v).due, 0)
    const lines = open.map((v) => `• ${v.number} — ${s.customers.find((c) => c.id === v.customer)?.name}: ${formatVND(invoiceTotals(v).due)} (${INVOICE_STATUS[v.status].label.toLowerCase()}, hạn ${formatDate(v.due)})`).join('\n')
    return { text: `Có **${open.length} hoá đơn** khách chưa thanh toán đủ, tổng **${formatVND(total)}**:\n\n${lines}\n\nHoá đơn của Nha khoa Nụ Cười đã quá hạn — bạn có thể gửi nhắc thanh toán ngay từ trang Hoá đơn.`, links: [{ label: 'Mở danh sách hoá đơn', to: '/hoa-don' }] }
  }
  if (/lon nhat|nhieu nhat|top|khoan chi/.test(n)) {
    const top = groupSpend(s.transactions, { days: 30, by: 'merchant' }).filter((x) => x.key !== 'internal').slice(0, 5)
    const lines = top.map((x, i) => `${i + 1}. ${MERCHANTS[x.key]?.name || x.key} — ${formatVND(x.value)}`).join('\n')
    return { text: `5 đối tác nhận nhiều tiền nhất trong 30 ngày qua:\n\n${lines}\n\nLương và bảo hiểm chiếm phần lớn chi phí cố định, đúng như các tháng trước.`, links: [{ label: 'Phân tích chi tiêu', to: '/phan-tich' }] }
  }
  if (/phan loai|danh muc|chung tu|hoa don vat/.test(n)) {
    const un = s.transactions.filter((t) => !t.category && t.status !== 'failed')
    const miss = s.transactions.filter((t) => t.amount < -200000 && !t.receipt && t.category !== 'transfer' && t.status === 'posted').length
    return { text: `Còn **${un.length} giao dịch** chưa phân loại và **${miss} giao dịch** trên 200.000 ₫ chưa có chứng từ.\n\nGợi ý: phần lớn là chuyến Grab và cà phê tiếp khách — có thể gán nhanh vào “${CATEGORIES.travel.label}” và “${CATEGORIES.meals.label}”.`, links: [{ label: 'Phân loại ngay', to: '/giao-dich?loc=chua-phan-loai' }] }
  }
  if (/so du|bao nhieu tien|tai khoan/.test(n)) {
    const lines = s.accounts.map((a) => `• ${a.name} ••${a.last4}: ${formatVND(a.balance)}`).join('\n')
    return { text: `Tổng số dư các tài khoản là **${formatVND(totalBalance(s.accounts))}**:\n\n${lines}`, links: [{ label: 'Xem tài khoản', to: '/tai-khoan' }] }
  }
  if (/thang nay|dong tien|thu chi/.test(n)) {
    return { text: `Tháng ${cur.month}: tiền vào **${formatVND(cur.inflow)}**, tiền ra **${formatVND(-cur.outflow)}**, dòng tiền ròng **${formatVND(cur.net)}**.\n\nTháng ${prev.month} cả tháng: vào ${formatCompact(prev.inflow)}, ra ${formatCompact(-prev.outflow)}.`, links: [{ label: 'Xem phân tích', to: '/phan-tich' }] }
  }
  return {
    text: 'Mình có thể trả lời các câu hỏi về số dư, dòng tiền, chi tiêu theo danh mục, hoá đơn chưa thu và giao dịch cần xử lý. Bạn thử một trong các gợi ý bên dưới nhé.',
    links: [],
  }
}

function Rich({ text }) {
  return text.split('\n').map((line, i) => (
    <p key={i} className={cn(line === '' ? 'h-2' : '')}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => part.startsWith('**') ? <strong key={j} className="font-[650] text-fg">{part.slice(2, -2)}</strong> : part)}
    </p>
  ))
}

export function Assistant() {
  const open = useUI((s) => s.assistant)
  const setOpen = useUI((s) => s.setAssistant)
  const navigate = useNavigate()
  const [msgs, setMsgs] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('[data-overlay]')) setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null
  const ask = (text) => {
    const t = (text ?? q).trim()
    if (!t || busy) return
    setQ('')
    setMsgs((m) => [...m, { role: 'user', text: t }])
    setBusy(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', ...answer(t, useBank.getState()) }])
      setBusy(false)
    }, 650 + Math.random() * 500)
  }

  return createPortal(
    <aside aria-label="Trợ lý AI" className="fixed z-[65] inset-y-0 right-0 w-full sm:w-[420px] bg-surface border-l border-line shadow-lg flex flex-col animate-slide-in">
      <div className="flex items-center gap-2.5 h-14 px-4 border-b border-line">
        <span className="size-8 grid place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white"><Sparkles size={16} /></span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-[620]">Trợ lý Mạch</div>
          <div className="text-[11.5px] text-muted">Trả lời từ dữ liệu tài khoản của bạn</div>
        </div>
        {msgs.length > 0 && <IconButton icon={RotateCcw} label="Cuộc trò chuyện mới" size="sm" onClick={() => setMsgs([])} />}
        <IconButton icon={X} label="Đóng trợ lý" size="sm" onClick={() => setOpen(false)} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {msgs.length === 0 && (
          <div className="pt-6">
            <div className="ds-h2">Chào Minh Anh 👋</div>
            <p className="text-muted mt-1.5 text-[13.5px]">Hỏi mình bất cứ điều gì về tình hình tài chính của Sen Việt Digital. Mình đọc giao dịch, hoá đơn và ngân sách để trả lời.</p>
            <div className="mt-6 flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)} className="flex items-center justify-between gap-2 rounded-xl border border-line px-3.5 py-2.5 text-left text-[13.5px] hover:bg-subtle hover:border-line-strong transition-colors">
                  {s}<ChevronRight size={15} className="text-faint shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {msgs.map((m, i) => m.role === 'user' ? (
            <div key={i} className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 text-white dark:text-[#06140f] px-3.5 py-2 text-[13.5px]">{m.text}</div>
          ) : (
            <div key={i} className="max-w-[94%] animate-fade-in">
              <div className="text-[13.5px] leading-relaxed text-dim flex flex-col gap-0.5"><Rich text={m.text} /></div>
              {m.links?.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {m.links.map((l) => (
                    <button key={l.to} onClick={() => { navigate(l.to); if (window.innerWidth < 640) setOpen(false) }}
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 h-8 text-[12.5px] font-[550] hover:bg-subtle">{l.label}<ChevronRight size={13} /></button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-1.5 text-muted text-[13px]">
              <span className="flex gap-1">{[0, 1, 2].map((d) => <span key={d} className="size-1.5 rounded-full bg-faint animate-pulse" style={{ animationDelay: d * 150 + 'ms' }} />)}</span>
              Đang xem dữ liệu…
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask() }} className="p-3 border-t border-line">
        <div className="flex items-end gap-2 rounded-xl border border-line-strong bg-surface px-3 py-2 focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100">
          <textarea rows={1} value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask() } }}
            placeholder="Hỏi về dòng tiền, chi tiêu, hoá đơn…" className="flex-1 resize-none bg-transparent outline-none text-[13.5px] py-1 max-h-28" />
          <button type="submit" disabled={!q.trim() || busy} aria-label="Gửi"
            className="size-8 grid place-items-center rounded-lg bg-brand-500 text-white dark:text-[#06140f] disabled:opacity-30"><ArrowUp size={16} /></button>
        </div>
        <p className="text-[11px] text-faint mt-1.5 px-1">Bản demo: câu trả lời được tính từ dữ liệu mô phỏng, có thể chưa chính xác.</p>
      </form>
    </aside>,
    document.body,
  )
}
