/* ==========================================================
   404 — không tìm thấy trang
   ========================================================== */
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, LayoutDashboard, LogIn } from 'lucide-react'
import { useAuth } from '@/store'
import { Button } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { HillsArt } from '@/features/public/HillsArt'
import { ThemeToggle } from '@/features/public/PublicChrome'

export default function NotFoundPage() {
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => { document.title = 'Không tìm thấy trang — Mạch' }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-fg flex flex-col">
      <HillsArt className="absolute inset-x-0 bottom-0 h-[62vh] [mask-image:linear-gradient(to_bottom,transparent,black_40%)]" sun={0.5} />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-canvas/60" aria-hidden />

      <header className="relative mx-auto flex h-16 w-full max-w-[1240px] items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Mạch — trang chủ" className="rounded-lg"><Logo /></Link>
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 items-start justify-center px-5 pt-[8vh] sm:pt-[12vh]">
        <div className="max-w-[560px] text-center flex flex-col items-center animate-slide-up">
          <span className="rounded-full border border-line bg-surface/80 backdrop-blur px-3 py-1 text-[12.5px] font-[600] text-muted num">Lỗi 404</span>
          <h1 className="mt-5 text-[34px] sm:text-[46px] leading-[1.1] font-[500] tracking-[-0.03em]">Trang này đã lạc giữa sương sớm</h1>
          <p className="mt-4 text-[15.5px] text-dim">
            Chúng tôi không tìm thấy <code className="rounded-md bg-subtle border border-line px-1.5 py-0.5 font-mono text-[13px] break-all">{pathname}</code>.
            Có thể đường dẫn đã thay đổi hoặc bị gõ nhầm.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button variant="primary" size="lg" icon={Home} to="/">Về trang chủ</Button>
            {user
              ? <Button variant="outline" size="lg" icon={LayoutDashboard} to="/tong-quan">Vào bảng điều khiển</Button>
              : <Button variant="outline" size="lg" icon={LogIn} to="/dang-nhap">Đăng nhập</Button>}
          </div>
          <button onClick={() => navigate(-1)} className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-[550] text-dim hover:text-fg">
            <ArrowLeft size={15} /> Quay lại trang trước
          </button>
        </div>
      </main>
    </div>
  )
}
