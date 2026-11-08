/* ==========================================================
   Quên mật khẩu ("/quen-mat-khau") — nhập email → trạng thái đã gửi
   ========================================================== */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { Button, Callout, Input } from '@/components/ui'
import { toast } from '@/store'
import { AuthShell, isEmail } from '@/features/public/AuthShell'

const WAIT = 30

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [left, setLeft] = useState(0)

  useEffect(() => { document.title = 'Quên mật khẩu — Mạch' }, [])
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(left - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  const submit = (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Vui lòng nhập email bạn dùng để đăng nhập')
    if (!isEmail(email)) return setError('Email chưa đúng định dạng, ví dụ: ban@congty.vn')
    setBusy(true)
    setTimeout(() => { setBusy(false); setSent(true); setLeft(WAIT) }, 900)
  }

  const resend = () => {
    setLeft(WAIT)
    toast({ title: 'Đã gửi lại email', desc: email.trim() })
  }

  if (sent) {
    return (
      <AuthShell variant="forgot">
        <div className="flex flex-col items-start">
          <span className="size-14 grid place-items-center rounded-2xl bg-brand-50 text-brand-ink border border-brand-100 animate-pop-in">
            <MailCheck size={26} />
          </span>
          <h1 className="ds-h1 text-[30px] mt-6">Đã gửi link đặt lại mật khẩu</h1>
          <p className="mt-2 text-muted">
            Nếu <b className="font-[600] text-fg">{email.trim()}</b> đã đăng ký với Mạch, bạn sẽ nhận được email trong vài phút. Link có hiệu lực trong 30 phút.
          </p>
          <Callout tone="neutral" className="mt-6 w-full" title="Không thấy email?">
            Hãy kiểm tra hộp thư Spam hoặc Quảng cáo, hoặc thử lại với địa chỉ khác.
          </Callout>
          <div className="mt-6 flex w-full flex-col gap-2">
            <Button variant="primary" size="lg" to="/dang-nhap" className="w-full">Quay lại đăng nhập</Button>
            <Button variant="ghost" size="lg" onClick={resend} disabled={left > 0} className="w-full">
              {left > 0 ? `Gửi lại sau ${left} giây` : 'Gửi lại email'}
            </Button>
            <button onClick={() => { setSent(false); setLeft(0) }} className="mt-1 text-[13px] font-[550] text-brand-ink hover:underline self-center">Dùng email khác</button>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      variant="forgot"
      title="Quên mật khẩu?"
      desc="Nhập email đăng nhập, chúng tôi sẽ gửi cho bạn link để đặt lại mật khẩu."
      footer={<Link to="/dang-nhap" className="font-[600] text-brand-ink hover:underline">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input id="fp-email" label="Email công việc" type="email" size="lg" prefix={Mail} autoComplete="email" placeholder="ban@congty.vn" autoFocus
          value={email} onChange={(e) => { setEmail(e.target.value); setError(null) }} error={error} />
        <Button type="submit" variant="primary" size="lg" loading={busy} className="w-full">Gửi link đặt lại</Button>
      </form>
      <Link to="/dang-nhap" className="mt-6 inline-flex items-center gap-1.5 text-[13.5px] font-[550] text-dim hover:text-fg">
        <ArrowLeft size={15} /> Quay lại đăng nhập
      </Link>
    </AuthShell>
  )
}
