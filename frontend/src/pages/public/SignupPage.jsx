/* ==========================================================
   Đăng ký dùng thử ("/dang-ky") → sau khi tạo tài khoản đăng nhập
   chuyển sang luồng "Thiết lập doanh nghiệp" (/mo-tai-khoan)
   ========================================================== */
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Info, Mail, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Callout, Checkbox, Input } from '@/components/ui'
import { AuthShell, PasswordInput, isEmail } from '@/features/public/AuthShell'

const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|icloud)\./i

/** Chấm điểm mật khẩu 0–4 */
function scorePassword(p) {
  const checks = [
    { ok: p.length >= 8, label: 'Ít nhất 8 ký tự' },
    { ok: /[a-z]/.test(p) && /[A-Z]/.test(p), label: 'Có chữ hoa và chữ thường' },
    { ok: /\d/.test(p), label: 'Có chữ số' },
    { ok: /[^A-Za-z0-9]/.test(p), label: 'Có ký tự đặc biệt' },
  ]
  const score = p ? checks.filter((c) => c.ok).length : 0
  return { score, checks }
}
const LEVEL = [
  { label: '', tone: '' },
  { label: 'Yếu', tone: 'bg-neg', text: 'text-neg' },
  { label: 'Trung bình', tone: 'bg-warn', text: 'text-warn' },
  { label: 'Khá', tone: 'bg-brand-300', text: 'text-brand-ink' },
  { label: 'Mạnh', tone: 'bg-brand-500', text: 'text-brand-ink' },
]

function StrengthMeter({ password }) {
  const { score, checks } = scorePassword(password)
  const lv = LEVEL[score]
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', i <= score ? lv.tone : 'bg-line')} />
          ))}
        </div>
        <span className={cn('w-20 text-right text-[12.5px] font-[600]', lv.text || 'text-faint')} aria-live="polite">
          {password ? `Độ mạnh: ${lv.label}` : ''}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c) => (
          <li key={c.label} className={cn('flex items-center gap-1.5 text-[12px]', c.ok ? 'text-brand-ink' : 'text-faint')}>
            <Check size={12} strokeWidth={3} className={c.ok ? '' : 'opacity-40'} /> {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [f, setF] = useState({ name: '', email: state?.email || '', password: '', agree: false })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { document.title = 'Đăng ký dùng thử — Mạch' }, [])

  const set = (k) => (e) => {
    const v = e?.target ? e.target.value : e
    setF((x) => ({ ...x, [k]: v }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: null }))
  }

  const submit = (e) => {
    e.preventDefault()
    const err = {}
    if (f.name.trim().length < 2) err.name = 'Vui lòng nhập họ và tên'
    if (!f.email.trim()) err.email = 'Vui lòng nhập email công việc'
    else if (!isEmail(f.email)) err.email = 'Email chưa đúng định dạng'
    if (!f.password) err.password = 'Vui lòng tạo mật khẩu'
    else if (scorePassword(f.password).score < 2 || f.password.length < 8) err.password = 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ và số'
    if (!f.agree) err.agree = 'Bạn cần đồng ý với điều khoản để tiếp tục'
    setErrors(err)
    if (Object.keys(err).length) return
    setBusy(true)
    setTimeout(() => navigate('/mo-tai-khoan', { state: { name: f.name.trim(), email: f.email.trim() } }), 800)
  }

  return (
    <AuthShell
      variant="signup"
      title="Đăng ký dùng thử"
      desc="Tạo tài khoản đăng nhập, sau đó thiết lập không gian làm việc cho công ty trong khoảng 10 phút."
      footer={<span>Đã có tài khoản? <Link to="/dang-nhap" className="font-[600] text-brand-ink hover:underline">Đăng nhập</Link></span>}
    >
      <Callout tone="warn" icon={Info} className="mb-5">
        Đây là bản demo giao diện. Không nhập email hay mật khẩu thật — dữ liệu chỉ dùng để mô phỏng.
      </Callout>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input id="su-name" label="Họ và tên" size="lg" prefix={User} autoComplete="off" placeholder="Nguyễn Minh Anh" autoFocus
          value={f.name} onChange={set('name')} error={errors.name} />
        <Input id="su-email" label="Email công việc" type="email" size="lg" prefix={Mail} autoComplete="off" placeholder="ban@congty.vn"
          value={f.email} onChange={set('email')} error={errors.email}
          hint={FREE_MAIL.test(f.email) ? 'Mẹo: dùng email theo tên miền công ty để dễ mời đồng nghiệp vào cùng không gian làm việc.' : 'Dùng để đăng nhập và nhận thông báo từ Mạch.'} />
        <PasswordInput id="su-password" label="Mật khẩu" autoComplete="new-password" placeholder="Tối thiểu 8 ký tự"
          value={f.password} onChange={set('password')} error={errors.password}
          hint={<StrengthMeter password={f.password} />} />
        {errors.password && <StrengthMeter password={f.password} />}
        <div className="flex flex-col gap-1">
          <Checkbox checked={f.agree} onChange={set('agree')}
            label={<>Tôi đồng ý với <a href="/#hoi-dap" className="font-[550] text-brand-ink hover:underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Điều khoản sử dụng</a> và <a href="/#bao-mat" className="font-[550] text-brand-ink hover:underline" target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>Chính sách quyền riêng tư</a> của Mạch.</>} />
          {errors.agree && <p className="text-[12.5px] text-neg pl-7">{errors.agree}</p>}
        </div>
        <Button type="submit" variant="primary" size="lg" loading={busy} iconRight={busy ? undefined : ArrowRight} className="w-full mt-1">
          Bắt đầu dùng thử
        </Button>
      </form>
      <p className="ds-caption mt-6 text-center">Dùng thử miễn phí 30 ngày, không cần thẻ thanh toán.</p>
    </AuthShell>
  )
}
