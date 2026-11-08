/* ==========================================================
   Đăng nhập ("/dang-nhap")
   - Email/mật khẩu bất kỳ đều đăng nhập được (bản demo, không gửi đi đâu)
   - Không gợi ý mật khẩu đã lưu: người xem không nên nhập thông tin thật
   - ?demo=1 → tự đăng nhập và chuyển trang
   - ?next=/duong-dan → quay lại trang đang mở trước đó
   ========================================================== */
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Fingerprint, Mail, PlayCircle, Loader2, Info } from 'lucide-react'
import { useAuth } from '@/store'
import { ME } from '@/data/org'
import { Button, Callout, Checkbox, Divider, Input } from '@/components/ui'
import { AuthShell, PasswordInput, isEmail } from '@/features/public/AuthShell'

/** Chỉ chấp nhận đường dẫn nội bộ cho ?next= */
function safeNext(v) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/tong-quan'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuth((s) => s.user)
  const next = safeNext(params.get('next'))
  const demo = params.get('demo') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(null) // null | 'form' | 'passkey' | 'demo'

  useEffect(() => { document.title = 'Đăng nhập — Mạch' }, [])
  // ?demo=1 → đăng nhập ngay; khi user có giá trị, <Navigate> bên dưới sẽ chuyển trang
  useEffect(() => {
    if (demo && !useAuth.getState().user) useAuth.getState().login({ name: ME.name, email: ME.email })
  }, [demo])

  if (user) return <Navigate to={next} replace />

  const finish = () => {
    useAuth.getState().login({ name: ME.name, email: ME.email })
    navigate(next, { replace: true })
  }

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (!email.trim()) err.email = 'Vui lòng nhập email'
    else if (!isEmail(email)) err.email = 'Email chưa đúng định dạng, ví dụ: ban@congty.vn'
    if (!password) err.password = 'Vui lòng nhập mật khẩu'
    else if (password.length < 6) err.password = 'Mật khẩu có ít nhất 6 ký tự'
    setErrors(err)
    if (Object.keys(err).length) return
    setBusy('form')
    setTimeout(finish, 700)
  }

  const passkey = () => { setBusy('passkey'); setTimeout(finish, 1200) }
  const loginDemo = () => { setBusy('demo'); setTimeout(finish, 350) }

  if (demo) {
    return (
      <div className="min-h-screen grid place-items-center bg-canvas text-muted">
        <span className="inline-flex items-center gap-2 text-[14px]"><Loader2 size={18} className="animate-spin" /> Đang mở bản demo…</span>
      </div>
    )
  }

  return (
    <AuthShell
      variant="login"
      title="Chào mừng trở lại"
      desc="Đăng nhập để quản lý tài chính doanh nghiệp của bạn."
      footer={<span>Chưa có tài khoản? <Link to="/dang-ky" className="font-[600] text-brand-ink hover:underline">Dùng thử miễn phí</Link></span>}
    >
      <Callout tone="warn" icon={Info} className="mb-5">
        Đây là bản demo giao diện. Không nhập email hay mật khẩu thật — bấm “Dùng tài khoản demo” để xem.
      </Callout>
      <Button variant="primary" size="lg" icon={PlayCircle} loading={busy === 'demo'} disabled={!!busy && busy !== 'demo'} onClick={loginDemo} className="w-full">
        Dùng tài khoản demo
      </Button>
      <p className="ds-caption mt-2 text-center">Vào thẳng ứng dụng với dữ liệu mẫu của công ty Sen Việt Digital.</p>

      <Divider label="hoặc đăng nhập bằng email" className="my-6" />

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input id="login-email" label="Email công việc" type="email" size="lg" prefix={Mail} autoComplete="off" placeholder="ban@congty.vn"
          value={email} onChange={(e) => { setEmail(e.target.value); errors.email && setErrors({ ...errors, email: null }) }} error={errors.email} />
        <PasswordInput id="login-password" autoComplete="new-password" value={password} error={errors.password}
          onChange={(e) => { setPassword(e.target.value); errors.password && setErrors({ ...errors, password: null }) }}
          action={<Link to="/quen-mat-khau" className="text-[12.5px] font-[550] text-brand-ink hover:underline">Quên mật khẩu?</Link>} />
        <Checkbox checked={remember} onChange={setRemember} label="Ghi nhớ thiết bị này trong 30 ngày" />
        <Button type="submit" variant="outline" size="lg" loading={busy === 'form'} disabled={!!busy && busy !== 'form'} className="w-full mt-1">
          Đăng nhập
        </Button>
      </form>

      <Divider label="hoặc" className="my-5" />

      <Button variant="outline" size="lg" icon={Fingerprint} loading={busy === 'passkey'} disabled={!!busy && busy !== 'passkey'} onClick={passkey} className="w-full">
        {busy === 'passkey' ? 'Đang chờ xác nhận passkey…' : 'Đăng nhập bằng passkey'}
      </Button>
    </AuthShell>
  )
}
