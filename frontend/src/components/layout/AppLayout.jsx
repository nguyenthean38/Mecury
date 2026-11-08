import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Search, ArrowLeftRight, Eye, EyeOff, Bell, Settings, Menu as MenuIcon, Sparkles, ArrowDownLeft, CheckCircle2, FileWarning, CreditCard, UserPlus, Repeat, User, LogOut, Keyboard } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatRelative, formatTime } from '@/lib/format'
import { useAuth, useBank, useUI } from '@/store'
import { ME } from '@/data/org'
import { Avatar, Button, IconButton, Kbd, Menu, Popover } from '@/components/ui'
import { LogoMark } from '@/components/brand/Logo'
import { Sidebar, NAV } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { Assistant } from './Assistant'
import { MoveMoney } from '@/features/move-money/MoveMoney'

const N_ICON = { money_in: ArrowDownLeft, approval: CheckCircle2, invoice: FileWarning, card: CreditCard, member: UserPlus, rule: Repeat }

function Notifications() {
  const navigate = useNavigate()
  const items = useBank((s) => s.notifications)
  const updateMany = useBank((s) => s.updateMany)
  const unread = items.filter((n) => !n.read).length
  return (
    <Popover align="end" width={380} trigger={(p) => <IconButton {...p} icon={Bell} label="Thông báo" badge={unread} />}>
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-2.5 pt-1.5 pb-2">
            <span className="ds-h3">Thông báo</span>
            {unread > 0 && <button onClick={() => updateMany('notifications', items.map((n) => n.id), { read: true })} className="text-[12.5px] font-[550] text-brand-ink hover:underline">Đánh dấu đã đọc</button>}
          </div>
          <div className="max-h-[380px] overflow-y-auto flex flex-col">
            {items.map((n) => {
              const I = N_ICON[n.kind] || Bell
              return (
                <button key={n.id} onClick={() => { close(); navigate(n.to) }} className="flex items-start gap-3 rounded-lg px-2.5 py-2.5 text-left hover:bg-hover">
                  <span className={cn('size-8 shrink-0 grid place-items-center rounded-full', n.kind === 'money_in' ? 'bg-pos-soft text-pos' : n.kind === 'invoice' ? 'bg-neg-soft text-neg' : 'bg-subtle text-muted')}><I size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block text-[13.5px] leading-snug', n.read ? 'text-dim' : 'text-fg font-[550]')}>{n.title}</span>
                    <span className="block ds-caption mt-0.5">{formatRelative(n.time)} · {formatTime(n.time)}</span>
                  </span>
                  {!n.read && <span className="mt-2 size-2 rounded-full bg-brand-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </Popover>
  )
}

function Topbar() {
  const navigate = useNavigate()
  const { hideBalances, toggleHide, setCommand, setSidebar, openMoveMoney } = useUI()
  const logout = useAuth((s) => s.logout)
  return (
    <header className="sticky top-0 z-40 h-14 flex items-center gap-2 px-3 sm:px-5 bg-canvas/85 backdrop-blur-md border-b border-line lg:border-transparent">
      <IconButton icon={MenuIcon} label="Mở menu" className="lg:hidden" onClick={() => setSidebar(true)} />
      <LogoMark size={26} className="lg:hidden" />
      <button onClick={() => setCommand(true)}
        className="hidden sm:flex items-center gap-2.5 h-9 w-full max-w-[380px] rounded-[10px] px-3 text-[13.5px] text-muted hover:bg-hover transition-colors">
        <Search size={16} />
        <span className="flex-1 text-left">Tìm giao dịch, người nhận, trang…</span>
        <Kbd>Ctrl K</Kbd>
      </button>
      <div className="flex-1" />
      <IconButton icon={Search} label="Tìm kiếm" className="sm:hidden" onClick={() => setCommand(true)} />
      <Button variant="ghost" icon={ArrowLeftRight} onClick={() => openMoveMoney('send')} className="hidden md:inline-flex">Chuyển tiền</Button>
      <IconButton icon={hideBalances ? EyeOff : Eye} label={hideBalances ? 'Hiện số dư' : 'Ẩn số dư'} onClick={toggleHide} />
      <IconButton icon={Settings} label="Cài đặt" onClick={() => navigate('/cai-dat')} className="hidden sm:inline-flex" />
      <Notifications />
      <Popover align="end" width={240} trigger={(p) => (
        <button {...p} className="ml-1 rounded-full ring-offset-2 ring-offset-canvas hover:ring-2 hover:ring-line-strong" aria-label="Tài khoản của tôi">
          <Avatar name={ME.name} color={ME.color} size={32} />
        </button>
      )}>
        {(close) => (
          <>
            <div className="px-2.5 py-2">
              <div className="text-[13.5px] font-[600]">{ME.name}</div>
              <div className="ds-caption">{ME.email}</div>
            </div>
            <Menu onClose={close} items={[
              { divider: true },
              { label: 'Hồ sơ của tôi', icon: User, onClick: () => navigate('/cai-dat/ho-so') },
              { label: 'Phím tắt', icon: Keyboard, onClick: () => useUI.getState().setCommand(true) },
              { divider: true },
              { label: 'Đăng xuất', icon: LogOut, danger: true, onClick: () => { logout(); navigate('/dang-nhap') } },
            ]} />
          </>
        )}
      </Popover>
    </header>
  )
}

/** Khung chung cho mọi trang sau khi đăng nhập */
export function AppLayout() {
  const user = useAuth((s) => s.user)
  const loc = useLocation()
  const { sidebarOpen, setSidebar, setCommand, assistant, setAssistant } = useUI()

  useEffect(() => { setSidebar(false); window.scrollTo(0, 0) }, [loc.pathname, setSidebar])
  // tiêu đề tab trình duyệt theo trang hiện tại
  useEffect(() => {
    const items = NAV.filter((n) => n.to).flatMap((n) => [n, ...(n.children || [])]).sort((a, b) => b.to.length - a.to.length)
    const hit = loc.pathname.startsWith('/cai-dat') ? { label: 'Cài đặt' } : items.find((n) => loc.pathname === n.to || loc.pathname.startsWith(n.to + '/'))
    document.title = hit ? `${hit.label} — Mạch` : 'Mạch — Phần mềm quản lý tài chính doanh nghiệp'
  }, [loc.pathname])
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCommand(true) }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); setAssistant(!useUI.getState().assistant) }
      const tag = document.activeElement?.tagName
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !document.querySelector('[data-overlay]')) { e.preventDefault(); setCommand(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCommand, setAssistant])

  if (!user) return <Navigate to={`/dang-nhap?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />

  return (
    <div className="min-h-screen lg:pl-[248px]">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[248px] border-r border-line z-30">
        <Sidebar />
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30 animate-fade-in" onClick={() => setSidebar(false)} />
          <div className="absolute inset-y-0 left-0 w-[284px] max-w-[86%] shadow-lg animate-slide-in border-r border-line" style={{ animationName: 'none' }}>
            <Sidebar mobile onNavigate={() => setSidebar(false)} />
          </div>
        </div>
      )}
      <Topbar />
      <main className="px-4 sm:px-6 lg:px-10 pb-24 pt-4 sm:pt-6">
        <div className="mx-auto w-full max-w-[1180px]">
          <Outlet />
        </div>
      </main>
      {!assistant && (
        <button onClick={() => setAssistant(true)} title="Trợ lý AI (Ctrl J)" aria-label="Mở trợ lý AI"
          className="fixed bottom-5 right-5 z-40 size-12 grid place-items-center rounded-2xl bg-surface border border-line shadow-md text-brand-ink hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <Sparkles size={20} />
        </button>
      )}
      <CommandPalette />
      <Assistant />
      <MoveMoney />
    </div>
  )
}
