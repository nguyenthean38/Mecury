import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, ListChecks, Sparkles, Landmark, ArrowLeftRight, CreditCard, Users, Send, FileText, BookOpen,
  Settings, LifeBuoy, ChevronsUpDown, Bookmark, LogOut, UserPlus, Building2, Moon, Sun, Monitor, X, BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth, useBank, useUI } from '@/store'
import { COMPANY } from '@/data/org'
import { Avatar, Money, Popover, Menu, IconButton } from '@/components/ui'

export const NAV = [
  { to: '/tong-quan', label: 'Tổng quan', icon: Home, key: 'G H' },
  { to: '/viec-can-lam', label: 'Việc cần làm', icon: ListChecks, badge: 'tasks' },
  { action: 'assistant', label: 'Trợ lý AI', icon: Sparkles },
  { divider: true },
  { to: '/tai-khoan', label: 'Tài khoản', icon: Landmark },
  { to: '/giao-dich', label: 'Giao dịch', icon: ArrowLeftRight, children: [{ to: '/phan-tich', label: 'Phân tích' }] },
  { to: '/the', label: 'Thẻ', icon: CreditCard },
  { to: '/chi-tieu-nhom', label: 'Chi tiêu nhóm', icon: Users, children: [{ to: '/hoan-ung', label: 'Hoàn ứng', badge: 'reimb' }] },
  { to: '/thanh-toan', label: 'Thanh toán', icon: Send, children: [{ to: '/nguoi-nhan', label: 'Người nhận' }] },
  { to: '/hoa-don', label: 'Hoá đơn bán ra', icon: FileText, children: [{ to: '/hoa-don/khach-hang', label: 'Khách hàng' }, { to: '/hoa-don/danh-muc', label: 'Sản phẩm & dịch vụ' }] },
  { to: '/ke-toan', label: 'Kế toán', icon: BookOpen },
]

function Item({ item, counts, onNavigate }) {
  const loc = useLocation()
  const setAssistant = useUI((s) => s.setAssistant)
  const Icon = item.icon
  const base = 'group flex items-center gap-2.5 h-9 px-2.5 rounded-[10px] text-[13.5px] font-[520] transition-colors'
  if (item.action) {
    return (
      <button onClick={() => { setAssistant(true); onNavigate?.() }} className={cn(base, 'text-dim hover:bg-hover hover:text-fg w-full')}>
        <Icon size={17} strokeWidth={1.9} className="text-muted group-hover:text-brand-ink" />
        <span className="flex-1 text-left">{item.label}</span>
        <span className="rounded-md bg-brand-50 text-brand-ink text-[10.5px] font-[650] px-1.5 py-0.5">Mới</span>
      </button>
    )
  }
  const childActive = item.children?.some((c) => loc.pathname.startsWith(c.to))
  const selfActive = loc.pathname === item.to || (loc.pathname.startsWith(item.to + '/') && !childActive)
  const open = selfActive || childActive
  const badge = item.badge && counts[item.badge]
  return (
    <div>
      <NavLink to={item.to} onClick={onNavigate}
        className={cn(base, selfActive ? 'bg-surface text-fg shadow-xs border border-line' : 'text-dim hover:bg-hover hover:text-fg border border-transparent')}>
        <Icon size={17} strokeWidth={1.9} className={selfActive ? 'text-brand-ink' : 'text-muted'} />
        <span className="flex-1">{item.label}</span>
        {badge ? <span className="num text-[11.5px] text-muted">{badge}</span> : null}
      </NavLink>
      {item.children && open && (
        <div className="ml-[19px] pl-3 border-l border-line mt-0.5 mb-1 flex flex-col gap-0.5">
          {item.children.map((c) => {
            const cb = c.badge && counts[c.badge]
            return (
              <NavLink key={c.to} to={c.to} end onClick={onNavigate}
                className={({ isActive }) => cn('flex items-center h-8 px-2.5 rounded-lg text-[13px] transition-colors', isActive ? 'text-fg font-[600] bg-hover' : 'text-muted hover:text-fg hover:bg-hover')}>
                <span className="flex-1">{c.label}</span>
                {cb ? <span className="num text-[11.5px] text-muted">{cb}</span> : null}
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ onNavigate, mobile }) {
  const navigate = useNavigate()
  const { theme, setTheme, setSidebar } = useUI()
  const logout = useAuth((s) => s.logout)
  const tasks = useBank((s) => s.tasks.length)
  const reimb = useBank((s) => s.reimbursements.filter((r) => r.status === 'pending').length)
  const main = useBank((s) => s.accounts.find((a) => a.primary))
  const counts = { tasks, reimb }

  return (
    <div className="h-full flex flex-col bg-side">
      {/* Công ty */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-1">
        <Popover align="start" width={260} trigger={(p) => (
          <button {...p} className="flex-1 min-w-0 flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 hover:bg-hover text-left">
            <Avatar name="Sen Việt" color="#138f66" size={30} square />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-[620] truncate">{COMPANY.short}</span>
              <span className="block text-[11.5px] text-muted truncate">Gói Tăng trưởng</span>
            </span>
            <ChevronsUpDown size={15} className="text-faint" />
          </button>
        )}>
          {(close) => (
            <Menu onClose={close} items={[
              { heading: 'Pháp nhân' },
              { label: COMPANY.short, desc: 'MST ' + COMPANY.taxCode, icon: Building2, checked: true },
              { divider: true },
              { label: 'Mời thành viên', icon: UserPlus, onClick: () => navigate('/cai-dat/thanh-vien') },
              { label: 'Cài đặt công ty', icon: Settings, onClick: () => navigate('/cai-dat') },
              { divider: true },
              { label: 'Đăng xuất', icon: LogOut, danger: true, onClick: () => { logout(); navigate('/dang-nhap') } },
            ]} />
          )}
        </Popover>
        {mobile && <IconButton icon={X} label="Đóng menu" onClick={() => setSidebar(false)} />}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-1 flex flex-col gap-0.5" aria-label="Điều hướng chính">
        {NAV.map((item, i) => item.divider
          ? <div key={i} className="h-px bg-line my-2 mx-1" />
          : <Item key={item.to || item.action} item={item} counts={counts} onNavigate={onNavigate} />)}

        <div className="mt-5 mb-1 px-2.5 flex items-center justify-between">
          <span className="ds-label !text-[10.5px]">Đã ghim</span>
          <Bookmark size={13} className="text-faint" />
        </div>
        <NavLink to="/phan-tich" onClick={onNavigate} className="flex items-center gap-2.5 h-9 px-2.5 rounded-[10px] text-[13px] text-dim hover:bg-hover">
          <BarChart3 size={15} className="text-faint" /> Báo cáo dòng tiền
        </NavLink>
        {main && (
          <NavLink to={`/tai-khoan/${main.id}`} onClick={onNavigate} className="flex items-start gap-2.5 px-2.5 py-1.5 rounded-[10px] text-[13px] text-dim hover:bg-hover">
            <Landmark size={15} className="text-faint mt-0.5" />
            <span className="min-w-0">
              <span className="block truncate">{main.name} ••{main.last4}</span>
              <Money value={main.balance} className="text-[12px] text-muted" />
            </span>
          </NavLink>
        )}
      </nav>

      <div className="px-3 pb-3 pt-2 border-t border-line flex flex-col gap-0.5">
        <NavLink to="/cai-dat" onClick={onNavigate} className={({ isActive }) => cn('flex items-center gap-2.5 h-9 px-2.5 rounded-[10px] text-[13.5px] font-[520]', isActive ? 'bg-hover text-fg' : 'text-dim hover:bg-hover')}>
          <Settings size={17} strokeWidth={1.9} className="text-muted" /> Cài đặt
        </NavLink>
        <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
          <a href="mailto:hotro@mach.vn" className="flex items-center gap-2 px-1 h-8 text-[13px] text-muted hover:text-fg"><LifeBuoy size={15} /> Hỗ trợ</a>
          <div className="flex items-center rounded-lg bg-subtle border border-line p-0.5">
            {[['light', Sun, 'Sáng'], ['dark', Moon, 'Tối'], ['system', Monitor, 'Theo hệ thống']].map(([v, I, l]) => (
              <button key={v} onClick={() => setTheme(v)} title={l} aria-label={'Giao diện ' + l}
                className={cn('size-7 grid place-items-center rounded-md', theme === v ? 'bg-surface text-fg shadow-xs' : 'text-faint hover:text-fg')}>
                <I size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
