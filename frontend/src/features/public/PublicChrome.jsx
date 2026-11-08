/* ==========================================================
   Phần khung dùng chung cho các trang công khai:
   thanh điều hướng, chân trang, nút đổi giao diện, hiệu ứng hiện dần,
   và hàm đăng nhập bằng tài khoản demo.
   ========================================================== */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Menu as MenuIcon, X, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth, useUI } from '@/store'
import { ME } from '@/data/org'
import { Button, IconButton } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'

/** Đăng nhập bằng người dùng demo rồi chuyển trang */
export function useDemoLogin() {
  const navigate = useNavigate()
  return (to = '/tong-quan') => {
    useAuth.getState().login({ name: ME.name, email: ME.email })
    navigate(to)
  }
}

/** Cuộn mượt tới một mục trên trang (bù chiều cao thanh điều hướng bằng scroll-mt) */
export function scrollToId(id) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/** Nút đổi sáng / tối */
export function ThemeToggle({ className }) {
  const setTheme = useUI((s) => s.setTheme)
  useUI((s) => s.theme) // re-render khi đổi chủ đề
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  return (
    <IconButton icon={dark ? Sun : Moon} label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      onClick={() => setTheme(dark ? 'light' : 'dark')} className={className} />
  )
}

/** Hiện dần khi cuộn tới (tôn trọng "giảm chuyển động") */
export function Reveal({ children, className, delay = 0, as: As = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <As ref={ref} className={cn(shown ? 'animate-slide-up' : 'opacity-0', className)}
      style={shown ? { animationDuration: '700ms', animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}>
      {children}
    </As>
  )
}

export const NAV_LINKS = [
  { id: 'san-pham', label: 'Sản phẩm' },
  { id: 'giai-phap', label: 'Giải pháp' },
  { id: 'bang-gia', label: 'Bảng giá' },
  { id: 'hoi-dap', label: 'Hỏi đáp' },
]

/** Thanh thông báo mỏng phía trên cùng */
export function AnnouncementBar({ onClick }) {
  return (
    <div className="relative z-50 bg-brand-50 border-b border-brand-100 text-brand-ink">
      <button onClick={onClick} className="group mx-auto flex max-w-[1240px] items-center justify-center gap-2 px-4 h-9 w-full text-[12.5px] sm:text-[13px] font-[550]">
        <span className="rounded-full bg-brand-500 text-white dark:text-[#06140f] px-2 py-px text-[10.5px] font-[700] uppercase tracking-wider">Mới</span>
        <span className="truncate">Trợ lý AI tự phân loại chi phí và đọc hoá đơn VAT</span>
        <ArrowRight size={14} className="shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

/** Thanh điều hướng dính trên đầu trang công khai */
export function PublicNav({ onAnchor }) {
  const user = useAuth((s) => s.user)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id) => { setOpen(false); onAnchor ? onAnchor(id) : scrollToId(id) }

  return (
    <header className={cn('sticky top-0 z-40 transition-[background,border,box-shadow] duration-200 border-b',
      scrolled || open ? 'bg-canvas/85 backdrop-blur-md border-line' : 'bg-transparent border-transparent')}>
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" className="shrink-0 rounded-lg" aria-label="Mạch — trang chủ"><Logo /></Link>
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a key={l.id} href={`/#${l.id}`} onClick={(e) => { e.preventDefault(); go(l.id) }}
              className="rounded-lg px-3 py-2 text-[14px] font-[520] text-dim hover:text-fg hover:bg-hover transition-colors">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          {user
            ? <Button variant="ghost" to="/tong-quan" className="hidden sm:inline-flex">Vào ứng dụng</Button>
            : <Button variant="ghost" to="/dang-nhap" className="hidden sm:inline-flex">Đăng nhập</Button>}
          <Button variant="primary" to="/dang-ky" className="hidden sm:inline-flex">Dùng thử miễn phí</Button>
          <IconButton icon={open ? X : MenuIcon} label={open ? 'Đóng menu' : 'Mở menu'} className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} />
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-line bg-canvas animate-fade-in">
          <nav aria-label="Điều hướng (di động)" className="mx-auto max-w-[1240px] px-4 py-3 flex flex-col">
            {NAV_LINKS.map((l) => (
              <a key={l.id} href={`/#${l.id}`} onClick={(e) => { e.preventDefault(); go(l.id) }}
                className="rounded-lg px-3 py-3 text-[15px] font-[550] text-fg hover:bg-hover">{l.label}</a>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="lg" to={user ? '/tong-quan' : '/dang-nhap'}>{user ? 'Vào ứng dụng' : 'Đăng nhập'}</Button>
              <Button variant="primary" size="lg" to="/dang-ky">Dùng thử miễn phí</Button>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-subtle px-3 py-2">
              <span className="text-[13.5px] text-dim">Giao diện</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

const FOOTER_COLS = [
  { title: 'Sản phẩm', links: [['Kết nối ngân hàng', 'tai-khoan'], ['Thẻ doanh nghiệp', 'the'], ['Thanh toán hoá đơn', 'thanh-toan'], ['Xuất hoá đơn & VietQR', 'hoa-don'], ['Kế toán & Trợ lý AI', 'ke-toan']] },
  { title: 'Giải pháp', links: [['Khởi nghiệp', 'giai-phap'], ['Agency & dịch vụ', 'giai-phap'], ['Bán lẻ & F&B', 'giai-phap'], ['Xuất nhập khẩu', 'giai-phap']] },
  { title: 'Tài nguyên', links: [['Bảng giá', 'bang-gia'], ['Câu hỏi thường gặp', 'hoi-dap'], ['Bảo mật', 'bao-mat'], ['Khách hàng nói gì', 'khach-hang']] },
]

/** Chân trang công khai */
export function PublicFooter({ onAnchor }) {
  const go = (id) => (onAnchor ? onAnchor(id) : scrollToId(id))
  return (
    <footer className="border-t border-line bg-side">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 pt-14 pb-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_repeat(3,1fr)_1fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13.5px] text-muted">Phần mềm quản lý tài chính cho doanh nghiệp Việt — kết nối ngân hàng, thẻ, duyệt chi, hoá đơn và sổ sách ở cùng một nơi.</p>
          </div>
          {FOOTER_COLS.map((c) => (
            <div key={c.title}>
              <div className="ds-label">{c.title}</div>
              <ul className="mt-3 flex flex-col gap-2">
                {c.links.map(([label, id]) => (
                  <li key={label}>
                    <a href={`/#${id}`} onClick={(e) => { e.preventDefault(); go(id) }} className="text-[13.5px] text-dim hover:text-fg">{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="ds-label">Bắt đầu</div>
            <ul className="mt-3 flex flex-col gap-2 text-[13.5px]">
              <li><Link to="/dang-nhap" className="text-dim hover:text-fg">Đăng nhập</Link></li>
              <li><Link to="/dang-ky" className="text-dim hover:text-fg">Đăng ký dùng thử</Link></li>
              <li><Link to="/dang-nhap?demo=1" className="text-dim hover:text-fg">Xem bản demo</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 md:flex-row md:items-start md:justify-between">
          <p className="text-[12.5px] text-muted max-w-2xl">
            Mạch là sản phẩm demo do Ntahien Tech thiết kế, không phải ngân hàng hay tổ chức tín dụng và không giữ tiền của khách hàng. Toàn bộ dữ liệu là mô phỏng.
          </p>
          <div className="flex items-center gap-3 text-[12.5px] text-faint shrink-0">
            <span>© 2026 Mạch</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
