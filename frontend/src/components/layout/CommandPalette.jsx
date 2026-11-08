import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search, CornerDownLeft, ArrowLeftRight, FilePlus2, CreditCard, Upload, Moon, EyeOff, Sparkles, Settings, User, FileText, Receipt, Landmark,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDay, formatVND } from '@/lib/format'
import { useBank, useUI } from '@/store'
import { txName } from '@/data/transactions'
import { invoiceTotals } from '@/data/invoicing'
import { Kbd, TxAvatar, Avatar } from '@/components/ui'
import { NAV } from './Sidebar'

const PAGES = [
  ...NAV.filter((n) => n.to).flatMap((n) => [{ label: n.label, to: n.to, icon: n.icon }, ...(n.children || []).map((c) => ({ label: c.label, to: c.to, icon: n.icon, parent: n.label }))]),
  { label: 'Cài đặt công ty', to: '/cai-dat', icon: Settings },
  { label: 'Thành viên & phân quyền', to: '/cai-dat/thanh-vien', icon: User },
  { label: 'Quy tắc duyệt chi', to: '/cai-dat/duyet-chi', icon: Settings },
  { label: 'Tích hợp', to: '/cai-dat/tich-hop', icon: Settings },
  { label: 'Bảo mật', to: '/cai-dat/bao-mat', icon: Settings },
  { label: 'Gói dịch vụ & thanh toán', to: '/cai-dat/goi-dich-vu', icon: Settings },
]

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')

export function CommandPalette() {
  const open = useUI((s) => s.command)
  const setOpen = useUI((s) => s.setCommand)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const listRef = useRef(null)
  const { transactions, recipients, invoices, customers, accounts } = useBank()

  useEffect(() => { if (open) { setQ(''); setI(0) } }, [open])

  const groups = useMemo(() => {
    const ui = useUI.getState()
    const actions = [
      { label: 'Chuyển tiền', icon: ArrowLeftRight, kbd: '', run: () => ui.openMoveMoney('send') },
      { label: 'Chuyển giữa các tài khoản', icon: ArrowLeftRight, run: () => ui.openMoveMoney('transfer') },
      { label: 'Tạo hoá đơn bán ra', icon: FilePlus2, run: () => navigate('/hoa-don?tao=1') },
      { label: 'Tải hoá đơn cần thanh toán', icon: Upload, run: () => navigate('/thanh-toan?tai-len=1') },
      { label: 'Tạo thẻ mới', icon: CreditCard, run: () => navigate('/the?tao=1') },
      { label: 'Nộp hoàn ứng', icon: Receipt, run: () => navigate('/hoan-ung?nop=1') },
      { label: 'Hỏi trợ lý AI', icon: Sparkles, kbd: 'Ctrl J', run: () => ui.setAssistant(true) },
      { label: ui.hideBalances ? 'Hiện số dư' : 'Ẩn số dư', icon: EyeOff, run: () => ui.toggleHide() },
      { label: 'Đổi giao diện sáng / tối', icon: Moon, run: () => ui.setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark') },
    ]
    const nq = norm(q.trim())
    const match = (s) => !nq || norm(s).includes(nq)
    const g = []
    const acts = actions.filter((a) => match(a.label))
    if (acts.length) g.push({ title: 'Hành động', items: acts.slice(0, nq ? 6 : 5) })
    const pages = PAGES.filter((p) => match(p.label + ' ' + (p.parent || '')))
    if (pages.length) g.push({ title: 'Trang', items: pages.slice(0, nq ? 8 : 6).map((p) => ({ label: p.label, sub: p.parent, icon: p.icon, run: () => navigate(p.to) })) })
    if (nq.length >= 2) {
      const accs = accounts.filter((a) => match(a.name + ' ' + a.last4))
      if (accs.length) g.push({ title: 'Tài khoản', items: accs.map((a) => ({ label: `${a.name} ••${a.last4}`, sub: formatVND(a.balance), icon: Landmark, run: () => navigate('/tai-khoan/' + a.id) })) })
      const txs = transactions.filter((t) => match(txName(t) + ' ' + (t.note || '') + ' ' + Math.abs(t.amount))).slice(0, 5)
      if (txs.length) g.push({ title: 'Giao dịch', items: txs.map((t) => ({ label: txName(t), sub: `${formatDay(t.date)} · ${formatVND(t.amount)}`, avatar: <TxAvatar tx={t} size={24} />, run: () => navigate('/giao-dich?id=' + t.id) })) })
      const rc = recipients.filter((r) => match(r.name)).slice(0, 4)
      if (rc.length) g.push({ title: 'Người nhận', items: rc.map((r) => ({ label: r.name, sub: `${r.bank} · ${r.account}`, avatar: <Avatar name={r.name} color={r.color} size={24} />, run: () => navigate('/nguoi-nhan?id=' + r.id) })) })
      const inv = invoices.filter((v) => match(v.number + ' ' + (customers.find((c) => c.id === v.customer)?.name || ''))).slice(0, 4)
      if (inv.length) g.push({ title: 'Hoá đơn', items: inv.map((v) => ({ label: v.number, sub: `${customers.find((c) => c.id === v.customer)?.name} · ${formatVND(invoiceTotals(v).total)}`, icon: FileText, run: () => navigate('/hoa-don?id=' + v.id) })) })
    }
    return g
  }, [q, transactions, recipients, invoices, customers, accounts, navigate])

  const flat = groups.flatMap((g) => g.items)
  useEffect(() => { setI(0) }, [q])
  useEffect(() => { listRef.current?.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' }) }, [i])

  if (!open) return null
  const run = (it) => { setOpen(false); setTimeout(() => it.run(), 0) }
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(flat.length - 1, x + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)) }
    if (e.key === 'Enter' && flat[i]) { e.preventDefault(); run(flat[i]) }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
  }
  let k = -1
  return createPortal(
    <div data-overlay className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-[rgba(12,16,14,.38)] backdrop-blur-[2px] animate-fade-in" onClick={() => setOpen(false)} />
      <div role="dialog" aria-label="Tìm kiếm nhanh" className="relative w-full max-w-[600px] rounded-2xl border border-line bg-surface shadow-lg overflow-hidden animate-pop-in">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
          <Search size={18} className="text-muted" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Tìm trang, giao dịch, người nhận hoặc gõ một hành động…" className="flex-1 bg-transparent outline-none text-[15px]" />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {flat.length === 0 && <div className="py-10 text-center text-muted text-[13.5px]">Không tìm thấy kết quả cho “{q}”</div>}
          {groups.map((g) => (
            <div key={g.title} className="mb-1">
              <div className="px-2.5 pt-2 pb-1 ds-label !text-[10.5px]">{g.title}</div>
              {g.items.map((it) => {
                k++
                const idx = k
                const Icon = it.icon
                return (
                  <button key={g.title + idx} data-i={idx} onMouseMove={() => setI(idx)} onClick={() => run(it)}
                    className={cn('w-full flex items-center gap-3 rounded-lg px-2.5 h-11 text-left', i === idx ? 'bg-hover' : '')}>
                    {it.avatar || <span className="size-7 grid place-items-center rounded-lg bg-subtle text-muted"><Icon size={15} /></span>}
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      {it.label}{it.sub && <span className="text-faint"> · {it.sub}</span>}
                    </span>
                    {it.kbd ? <Kbd>{it.kbd}</Kbd> : i === idx ? <CornerDownLeft size={14} className="text-faint" /> : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 px-4 h-10 border-t border-line text-[12px] text-faint">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> di chuyển</span>
          <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> mở</span>
          <span className="flex items-center gap-1.5 ml-auto"><Kbd>Ctrl K</Kbd> mở nhanh ở mọi trang</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
