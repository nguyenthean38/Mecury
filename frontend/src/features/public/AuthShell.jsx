/* ==========================================================
   Bố cục chia đôi cho đăng nhập / đăng ký / quên mật khẩu
   Trái: biểu mẫu · Phải: bảng thương hiệu (ẩn trên màn hình nhỏ)
   ========================================================== */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ACCOUNTS } from '@/data/org'
import { AccountIcon, Money } from '@/components/ui'
import { Logo } from '@/components/brand/Logo'
import { HillsArt } from './HillsArt'
import { ThemeToggle } from './PublicChrome'

const QUOTES = {
  login: { text: 'Mỗi sáng tôi mở Mạch trước cả email. Nhìn một màn hình là biết công ty đang khoẻ hay yếu.', name: 'Ngô Bảo Trâm', role: 'Giám đốc tài chính, Hạt Mầm' },
  signup: { text: 'Kết nối hai ngân hàng và mời kế toán chỉ mất mười phút. Cuối tháng không còn phải gom sao kê từng nơi.', name: 'Lý Minh Đăng', role: 'Nhà sáng lập, Tre Việt Xanh' },
  forgot: { text: 'Bảo mật chặt chẽ nhưng không rườm rà — đúng thứ một đội nhỏ như chúng tôi cần.', name: 'Trương Văn Lộc', role: 'Chủ chuỗi, Bếp Nhà Lá' },
}

function BrandPanel({ variant }) {
  const q = QUOTES[variant] || QUOTES.login
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden rounded-[28px] border border-line m-3 p-10">
      <HillsArt className="absolute inset-0" sun={0.72} />
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-canvas/30 to-transparent" aria-hidden />

      {/* bản xem trước nổi */}
      <div className="relative mt-6 ml-auto w-full max-w-[360px] flex flex-col gap-3">
        <div className="card shadow-lg p-5 animate-pop-in">
          <div className="text-[12.5px] text-muted truncate">{ACCOUNTS[0].bank} · Thanh toán chính ••{ACCOUNTS[0].last4}</div>
          <Money value={ACCOUNTS[0].balance} hideable={false} className="mt-1 block text-[26px] font-[500] tracking-tight" />
          <div className="mt-4 flex flex-col gap-2.5">
            {ACCOUNTS.slice(1, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-2.5">
                <AccountIcon kind={a.kind} color={a.color} size={28} />
                <span className="flex-1 min-w-0 text-[13px] font-[550] truncate">{a.name} <span className="font-normal text-faint">· {a.bank.replace(/^Ngân hàng\s+/, '')}</span></span>
                <Money value={a.balance} hideable={false} className="text-[13px] font-[550]" />
              </div>
            ))}
          </div>
        </div>
        <div className="card shadow-md flex items-center gap-3 px-4 py-3 mr-10 animate-pop-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
          <span className="size-8 grid place-items-center rounded-full bg-pos-soft text-pos"><ArrowDownLeft size={16} /></span>
          <div className="min-w-0">
            <div className="text-[13px] font-[600]">+42.120.000 ₫</div>
            <div className="ds-caption truncate">Bếp Nhà Lá đã thanh toán hoá đơn</div>
          </div>
        </div>
      </div>

      <figure className="relative max-w-[440px] rounded-2xl bg-surface/80 backdrop-blur-md border border-line p-6 shadow-sm">
        <blockquote className="text-[17px] leading-relaxed text-fg font-[450]">“{q.text}”</blockquote>
        <figcaption className="mt-3 text-[13px] text-muted"><span className="font-[600] text-fg">{q.name}</span> · {q.role}</figcaption>
      </figure>
    </div>
  )
}

/** <AuthShell variant="login" title="Chào mừng trở lại" desc="…">form</AuthShell> */
export function AuthShell({ variant = 'login', title, desc, children, footer }) {
  return (
    <div className="min-h-screen bg-canvas text-fg grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-screen flex-col px-5 sm:px-10">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" aria-label="Mạch — trang chủ" className="rounded-lg"><Logo /></Link>
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px] animate-slide-up">
            {title && <h1 className="ds-h1 text-[30px]">{title}</h1>}
            {desc && <p className="mt-2 text-muted">{desc}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </main>
        <div className="flex flex-wrap items-center justify-between gap-2 py-5 text-[12.5px] text-faint">
          <span className="inline-flex items-center gap-1.5"><Lock size={13} /> Kết nối được mã hoá</span>
          {footer || <span>Bản demo — dữ liệu mô phỏng</span>}
        </div>
      </div>
      <BrandPanel variant={variant} />
    </div>
  )
}

/** Ô mật khẩu có nút hiện/ẩn */
export function PasswordInput({ id, label = 'Mật khẩu', value, onChange, error, autoComplete = 'current-password', action, placeholder = '••••••••', hint }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-[550] text-dim">{label}</label>
        {action}
      </div>
      <div aria-invalid={!!error}
        className={cn('flex items-center gap-2 h-11 pl-3 pr-1.5 w-full bg-surface border border-line-strong rounded-[10px] transition-[border,box-shadow] duration-150 hover:border-faint',
          'focus-within:border-brand-400 focus-within:ring-[3px] focus-within:ring-brand-100',
          error && 'border-neg ring-[3px] ring-neg-soft')}>
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} placeholder={placeholder}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className="min-w-0 flex-1 bg-transparent outline-none h-full text-[14px]" />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={show}
          className="size-8 grid place-items-center rounded-lg text-faint hover:text-fg hover:bg-hover">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error ? <p id={`${id}-err`} className="text-[12.5px] text-neg">{error}</p> : hint ? <div id={`${id}-hint`}>{hint}</div> : null}
    </div>
  )
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
