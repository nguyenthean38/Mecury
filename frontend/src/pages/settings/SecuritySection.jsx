/* Bảo mật — /cai-dat/bao-mat */
import { useState } from 'react'
import { KeyRound, ShieldCheck, Smartphone, Monitor, Laptop, Fingerprint, Plus, Trash2, LogOut, Copy, Download, Check, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime, formatRelative, TODAY } from '@/lib/format'
import { SESSIONS } from '@/data/workspace'
import { ME } from '@/data/org'
import { toast } from '@/store'
import { Badge, Button, Callout, Card, CardHeader, Confirm, IconButton, Input, Modal, OtpInput, Progress, QrCode } from '@/components/ui'
import { SectionHeader } from './shared'

/* ---------- Đổi mật khẩu ---------- */
function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
}
const STRENGTH = [
  { label: 'Rất yếu', tone: 'neg', cls: 'text-neg' }, { label: 'Yếu', tone: 'neg', cls: 'text-neg' }, { label: 'Trung bình', tone: 'warn', cls: 'text-warn' },
  { label: 'Khá', tone: 'warn', cls: 'text-warn' }, { label: 'Mạnh', tone: 'pos', cls: 'text-pos' }, { label: 'Rất mạnh', tone: 'pos', cls: 'text-pos' },
]

function PasswordModal({ onClose, onDone }) {
  const [f, setF] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const st = strength(f.next)
  const mismatch = f.confirm && f.confirm !== f.next
  const ok = f.current.length >= 1 && f.next.length >= 8 && st >= 3 && f.confirm === f.next && f.next !== f.current
  const submit = () => {
    setLoading(true)
    setTimeout(() => { onDone(); onClose(); toast({ title: 'Đã đổi mật khẩu', desc: 'Các phiên đăng nhập khác cần đăng nhập lại.', tone: 'pos' }) }, 700)
  }
  const EyeIcon = show ? EyeOff : Eye
  return (
    <Modal open onClose={onClose} size="sm" title="Đổi mật khẩu" desc="Mật khẩu tối thiểu 8 ký tự, nên có chữ hoa, số và ký tự đặc biệt."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} loading={loading} onClick={submit}>Đổi mật khẩu</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Mật khẩu hiện tại" type={show ? 'text' : 'password'} value={f.current} onChange={set('current')} autoComplete="current-password" autoFocus />
        <div className="flex flex-col gap-2">
          <Input label="Mật khẩu mới" type={show ? 'text' : 'password'} value={f.next} onChange={set('next')} autoComplete="new-password" />
          {f.next && (
            <div className="flex items-center gap-3 animate-fade-in">
              <Progress value={st} max={5} tone={STRENGTH[st].tone} auto={false} className="flex-1" />
              <span className={cn('text-[12.5px] font-[550] w-20 text-right', STRENGTH[st].cls)}>{STRENGTH[st].label}</span>
            </div>
          )}
        </div>
        <Input label="Nhập lại mật khẩu mới" type={show ? 'text' : 'password'} value={f.confirm} onChange={set('confirm')} autoComplete="new-password"
          error={mismatch ? 'Mật khẩu nhập lại không khớp.' : undefined} />
        <button type="button" onClick={() => setShow(!show)} className="self-start inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-fg">
          <EyeIcon size={15} />{show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        </button>
      </div>
    </Modal>
  )
}

/* ---------- Thiết lập xác thực hai lớp ---------- */
const SECRET = 'JBSW Y3DP EHPK 3PXP'
function makeCodes() {
  return Array.from({ length: 10 }, () => {
    const r = Math.random().toString(36).slice(2, 10).toUpperCase().padEnd(8, '7')
    return `${r.slice(0, 4)}-${r.slice(4, 8)}`
  })
}

function TwoFactorModal({ onClose, onDone }) {
  const [step, setStep] = useState(0)
  const [otp, setOtp] = useState('')
  const [codes] = useState(makeCodes)
  const [checking, setChecking] = useState(false)
  const verify = () => { setChecking(true); setTimeout(() => { setChecking(false); setStep(2) }, 600) }
  const finish = () => { onDone(); onClose(); toast({ title: 'Đã bật xác thực hai lớp', desc: 'Từ giờ Mạch sẽ hỏi mã khi bạn đăng nhập và chuyển tiền.', tone: 'pos' }) }
  const titles = ['Quét mã bằng ứng dụng xác thực', 'Nhập mã xác thực', 'Lưu mã dự phòng']
  return (
    <Modal open onClose={onClose} size="md" title={titles[step]}
      desc={['Dùng Google Authenticator, Microsoft Authenticator hoặc 1Password.', 'Nhập mã 6 số đang hiển thị trong ứng dụng.', 'Dùng mỗi mã một lần khi bạn không có điện thoại bên cạnh.'][step]}
      footer={step === 0
        ? <><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" iconRight={ArrowRight} onClick={() => setStep(1)}>Tiếp tục</Button></>
        : step === 1
          ? <><Button variant="secondary" onClick={() => setStep(0)}>Quay lại</Button><Button variant="primary" disabled={otp.length < 6} loading={checking} onClick={verify}>Xác minh</Button></>
          : <Button variant="primary" icon={Check} onClick={finish}>Tôi đã lưu mã, hoàn tất</Button>}>
      <div className="flex gap-1.5 mb-5">{[0, 1, 2].map((i) => <span key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-brand-500' : 'bg-line')} />)}</div>
      {step === 0 && (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="rounded-2xl border border-line p-3 bg-white text-[#0c120f] [--qr-bg:#fff] shrink-0">
            <QrCode value={`otpauth://totp/Mach:${ME.email}`} size={156} />
          </div>
          <div className="min-w-0 flex flex-col gap-3 text-[13.5px]">
            <ol className="list-decimal pl-4 flex flex-col gap-1.5 text-dim">
              <li>Mở ứng dụng xác thực trên điện thoại.</li>
              <li>Chọn thêm tài khoản và quét mã QR bên cạnh.</li>
              <li>Ứng dụng sẽ hiển thị mã 6 số thay đổi mỗi 30 giây.</li>
            </ol>
            <div>
              <div className="ds-caption mb-1">Không quét được? Nhập khoá thủ công</div>
              <button onClick={() => { navigator.clipboard?.writeText(SECRET.replace(/ /g, '')); toast('Đã sao chép khoá') }}
                className="inline-flex items-center gap-2 rounded-lg bg-subtle px-3 py-1.5 font-mono text-[13px] hover:bg-hover">{SECRET}<Copy size={13} className="text-faint" /></button>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="flex flex-col items-center gap-3 py-3">
          <OtpInput value={otp} onChange={setOtp} />
          <p className="ds-caption">Bản demo: nhập 6 số bất kỳ.</p>
        </div>
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-subtle p-4 font-mono text-[13.5px] num">
            {codes.map((c) => <span key={c} className="text-center py-1">{c}</span>)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon={Copy} onClick={() => { navigator.clipboard?.writeText(codes.join('\n')); toast('Đã sao chép 10 mã dự phòng') }}>Sao chép</Button>
            <Button variant="outline" icon={Download} onClick={() => toast({ title: 'Đã tải tệp', desc: 'ma-du-phong-mach.txt' })}>Tải tệp .txt</Button>
          </div>
          <Callout tone="warn">Mỗi mã chỉ dùng được một lần. Hãy cất ở nơi an toàn như trình quản lý mật khẩu.</Callout>
        </div>
      )}
    </Modal>
  )
}

const deviceIcon = (d) => (/iPhone|Android|Ứng dụng/.test(d) ? Smartphone : /macOS/.test(d) ? Laptop : Monitor)

export function SecuritySection() {
  const [pwChanged, setPwChanged] = useState('2026-09-07')
  const [pwOpen, setPwOpen] = useState(false)
  const [twoFA, setTwoFA] = useState(true)
  const [tfOpen, setTfOpen] = useState(false)
  const [tfOff, setTfOff] = useState(false)
  const [passkeys, setPasskeys] = useState([
    { id: 'pk1', name: 'MacBook Pro — Touch ID', added: '2026-04-12', last: '2026-11-07T08:55:00' },
    { id: 'pk2', name: 'iPhone 15 — Face ID', added: '2026-05-30', last: '2026-11-08T07:41:00' },
  ])
  const [addingKey, setAddingKey] = useState(false)
  const [delKey, setDelKey] = useState(null)
  const [sessions, setSessions] = useState(SESSIONS)
  const [endAll, setEndAll] = useState(false)

  const addPasskey = () => {
    setAddingKey(true)
    setTimeout(() => {
      setAddingKey(false)
      setPasskeys((x) => [...x, { id: 'pk' + Date.now(), name: 'Windows Hello — Chrome', added: TODAY.toISOString().slice(0, 10), last: null }])
      toast({ title: 'Đã thêm khoá truy cập', desc: 'Lần sau bạn có thể đăng nhập bằng Windows Hello.', tone: 'pos' })
    }, 1100)
  }
  const pwDays = Math.round((TODAY - new Date(pwChanged)) / 86400000)

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Bảo mật" desc="Bảo vệ tài khoản của bạn bằng mật khẩu mạnh, xác thực hai lớp và khoá truy cập." />

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="size-10 shrink-0 grid place-items-center rounded-xl bg-subtle text-dim"><KeyRound size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="ds-h3">Mật khẩu</div>
            <p className="ds-caption mt-0.5">{pwDays === 0 ? 'Vừa đổi hôm nay.' : `Đổi lần cuối ${pwDays} ngày trước (${formatDate(pwChanged)}).`}</p>
          </div>
          <Button variant="outline" onClick={() => setPwOpen(true)}>Đổi mật khẩu</Button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className={cn('size-10 shrink-0 grid place-items-center rounded-xl', twoFA ? 'bg-pos-soft text-pos' : 'bg-warn-soft text-warn')}><ShieldCheck size={18} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="ds-h3">Xác thực hai lớp</span>
              {twoFA ? <Badge tone="pos" dot>Đang bật</Badge> : <Badge tone="warn" dot>Đang tắt</Badge>}
            </div>
            <p className="ds-caption mt-0.5">{twoFA ? 'Ứng dụng xác thực · còn 10 mã dự phòng chưa dùng.' : 'Bắt buộc với quản trị viên để chuyển tiền trên 50 triệu.'}</p>
          </div>
          <div className="flex gap-2">
            {twoFA && <Button variant="ghost" onClick={() => setTfOff(true)}>Tắt</Button>}
            <Button variant={twoFA ? 'outline' : 'primary'} onClick={() => setTfOpen(true)}>{twoFA ? 'Thiết lập lại' : 'Bật xác thực hai lớp'}</Button>
          </div>
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="Khoá truy cập (passkey)" icon={Fingerprint} desc="Đăng nhập bằng vân tay, khuôn mặt hoặc mã PIN của thiết bị — không cần mật khẩu."
            action={<Button size="sm" variant="outline" icon={Plus} loading={addingKey} onClick={addPasskey}>Thêm khoá</Button>} />
        </div>
        <div className="divide-y divide-line border-t border-line">
          {passkeys.length === 0 && <p className="px-5 py-4 ds-caption">Chưa có khoá truy cập nào.</p>}
          {passkeys.map((k) => (
            <div key={k.id} className="flex items-center gap-3 px-5 py-3.5">
              <Fingerprint size={18} className="text-muted shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-[550] truncate">{k.name}</div>
                <div className="ds-caption">Thêm {formatDate(k.added)} · {k.last ? `dùng ${formatRelative(k.last).toLowerCase()}` : 'chưa dùng'}</div>
              </div>
              <IconButton size="sm" icon={Trash2} label={`Xoá khoá ${k.name}`} onClick={() => setDelKey(k)} />
            </div>
          ))}
        </div>
      </Card>

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="Phiên đăng nhập" desc="Các thiết bị đang đăng nhập vào tài khoản của bạn."
            action={sessions.length > 1 && <Button size="sm" variant="ghost" icon={LogOut} onClick={() => setEndAll(true)}>Đăng xuất tất cả</Button>} />
        </div>
        <div className="divide-y divide-line border-t border-line">
          {sessions.map((s) => {
            const I = deviceIcon(s.device)
            return (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="size-9 shrink-0 grid place-items-center rounded-lg bg-subtle text-dim"><I size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-[550]">{s.device}</span>
                    {s.current && <Badge tone="brand" size="sm">Phiên này</Badge>}
                  </div>
                  <div className="ds-caption">{s.place} · {s.ip} · {s.current ? 'Đang hoạt động' : formatDateTime(s.last)}</div>
                </div>
                {!s.current && (
                  <Button size="sm" variant="ghost" onClick={() => { setSessions((x) => x.filter((y) => y.id !== s.id)); toast({ title: 'Đã đăng xuất phiên', desc: s.device }) }}>Đăng xuất</Button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {pwOpen && <PasswordModal onClose={() => setPwOpen(false)} onDone={() => { setPwChanged(TODAY.toISOString().slice(0, 10)); setSessions((x) => x.filter((s) => s.current)) }} />}
      {tfOpen && <TwoFactorModal onClose={() => setTfOpen(false)} onDone={() => setTwoFA(true)} />}

      <Confirm open={tfOff} onClose={() => setTfOff(false)} danger confirmLabel="Tắt xác thực hai lớp"
        title="Tắt xác thực hai lớp?" desc="Tài khoản sẽ chỉ được bảo vệ bằng mật khẩu. Bạn sẽ không thể duyệt hoặc chuyển khoản lớn cho đến khi bật lại."
        onConfirm={() => { setTwoFA(false); toast({ title: 'Đã tắt xác thực hai lớp', tone: 'neg' }) }} />
      <Confirm open={!!delKey} onClose={() => setDelKey(null)} danger confirmLabel="Xoá khoá"
        title="Xoá khoá truy cập?" desc={delKey ? `Bạn sẽ không thể đăng nhập bằng “${delKey.name}” nữa.` : ''}
        onConfirm={() => { setPasskeys((x) => x.filter((k) => k.id !== delKey.id)); toast('Đã xoá khoá truy cập') }} />
      <Confirm open={endAll} onClose={() => setEndAll(false)} danger confirmLabel="Đăng xuất tất cả"
        title="Đăng xuất mọi thiết bị khác?" desc={`${sessions.length - 1} phiên khác sẽ phải đăng nhập lại. Phiên hiện tại vẫn giữ nguyên.`}
        onConfirm={() => { setSessions((x) => x.filter((s) => s.current)); toast({ title: 'Đã đăng xuất các thiết bị khác' }) }} />
    </div>
  )
}
