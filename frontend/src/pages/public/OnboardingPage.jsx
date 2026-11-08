/* ==========================================================
   Thiết lập doanh nghiệp ("/mo-tai-khoan")
   Tạo không gian làm việc trên Mạch: 6 bước trong FlowShell
   → màn hình "Không gian làm việc đã sẵn sàng".
   Mạch chỉ kết nối tới ngân hàng doanh nghiệp đang dùng (mô phỏng),
   không giữ tiền và không thu thập giấy tờ tuỳ thân.
   Bản nháp lưu tạm trong sessionStorage để tải lại trang không mất dữ liệu.
   ========================================================== */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight, Search, Check, Plus, Trash2, Building2, MapPin, Users, Landmark, BookOpen, Target, Lightbulb,
  ShieldCheck, Globe, Home, CircleCheck, Sparkles, Eye, KeyRound, Send, Unplug, Circle,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth, toast } from '@/store'
import { ACCOUNTS, COMPANY, ME, ROLES, TEAM } from '@/data/org'
import { BANKS } from '@/data/payments'
import { PLANS } from '@/data/workspace'
import {
  AccountIcon, Avatar, Badge, Button, Callout, Checkbox, Confirm, FlowShell, IconButton, Input, KeyValue, Money, Progress, RadioCards, Select,
} from '@/components/ui'
import { BankTile, Chips, GroupLabel, bankHash } from '@/features/public/onboarding-parts'
import { isEmail } from '@/features/public/AuthShell'

const STEPS = ['Thông tin công ty', 'Địa chỉ', 'Kết nối ngân hàng', 'Thiết lập kế toán', 'Mời đội ngũ', 'Nhu cầu sử dụng']
const DRAFT_KEY = 'mach-setup-draft'

const BIZ_TYPES = ['Công ty TNHH một thành viên', 'Công ty TNHH hai thành viên trở lên', 'Công ty cổ phần', 'Công ty hợp danh', 'Doanh nghiệp tư nhân', 'Hộ kinh doanh']
const INDUSTRIES = [
  'Dịch vụ thiết kế & phát triển phần mềm', 'Thương mại điện tử', 'Bán lẻ', 'Nhà hàng, quán cà phê', 'Sản xuất', 'Xuất nhập khẩu',
  'Tư vấn & dịch vụ chuyên môn', 'Truyền thông & quảng cáo', 'Xây dựng & bất động sản', 'Giáo dục & đào tạo', 'Y tế & chăm sóc sức khoẻ', 'Vận tải & logistics', 'Khác',
]
const SIZES = ['1 – 10', '11 – 50', '51 – 200', '201 – 500', 'Trên 500'].map((v) => ({ value: v, label: v }))
// 34 đơn vị hành chính cấp tỉnh từ 01/07/2025
const PROVINCES = [
  'TP. Hà Nội', 'TP. Hồ Chí Minh', 'TP. Hải Phòng', 'TP. Đà Nẵng', 'TP. Cần Thơ', 'TP. Huế',
  'An Giang', 'Bắc Ninh', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Tĩnh', 'Hưng Yên',
  'Khánh Hoà', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Nghệ An', 'Ninh Bình', 'Phú Thọ', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sơn La', 'Tây Ninh', 'Thái Nguyên', 'Thanh Hoá', 'Tuyên Quang', 'Vĩnh Long',
]

/* ---- Kết nối ngân hàng (mô phỏng) ---- */
// ngân hàng hư cấu của dữ liệu mẫu lên trước
const BANK_LIST = [...BANKS.filter((b) => b.startsWith('Ngân hàng')), ...BANKS.filter((b) => !b.startsWith('Ngân hàng'))]
const SAMPLE_BANKS = ['Ngân hàng Thịnh An', 'Ngân hàng Lạc Hồng']
const PERMISSIONS = [
  { icon: Eye, text: 'Xem số dư và lịch sử giao dịch' },
  { icon: Send, text: 'Tạo lệnh chi ở trạng thái chờ — bạn xác nhận trên ngân hàng của mình' },
  { icon: KeyRound, text: 'Không lưu tên đăng nhập hay mật khẩu ngân hàng' },
]
/** Tài khoản "tìm thấy" sau khi kết nối: dùng ACCOUNTS mẫu, ngân hàng khác sinh 1 tài khoản mô phỏng */
function accountsOf(bank) {
  const real = ACCOUNTS.filter((a) => a.bank === bank)
  if (real.length) return real.map(({ id, name, last4, kind, color, balance }) => ({ id, name, last4, kind, color, balance }))
  const h = bankHash(bank)
  return [{ id: `sim-${h}`, name: 'Tài khoản thanh toán', last4: String(1000 + (h % 9000)), kind: 'checking', color: '#4f7fe0', balance: (40 + (h % 600)) * 1e6 }]
}

/* ---- Kế toán ---- */
const REGIMES = [
  { value: 'tt200', label: 'Thông tư 200', desc: 'Chế độ kế toán doanh nghiệp đầy đủ, áp dụng được cho mọi quy mô', icon: BookOpen },
  { value: 'tt133', label: 'Thông tư 133', desc: 'Dành cho doanh nghiệp nhỏ và vừa, hệ thống tài khoản gọn hơn', icon: BookOpen },
]
const REGIME_LABEL = { tt200: 'Thông tư 200', tt133: 'Thông tư 133' }
const PERIODS = Array.from({ length: 12 }, (_, i) => `Tháng ${String(i + 1).padStart(2, '0')}/2026`)
const SOFTWARE = ['MISA', 'Fast', 'Excel', 'Chưa dùng'].map((v) => ({ value: v, label: v }))
const EINVOICE = ['MISA meInvoice', 'Viettel S-Invoice', 'VNPT Invoice', 'BKAV eHoadon', 'FPT eInvoice', 'Nhà cung cấp khác', 'Chưa dùng hoá đơn điện tử']

/* ---- Đội ngũ ---- */
const INVITE_ROLES = ['admin', 'bookkeeper', 'employee']
const ROLE_OPTS = INVITE_ROLES.map((v) => ({ value: v, label: ROLES[v].label }))

/* ---- Nhu cầu ---- */
const GOALS = [
  'Kiểm soát chi tiêu', 'Thu tiền khách hàng', 'Duyệt chi nhiều cấp', 'Báo cáo dòng tiền', 'Sổ sách kế toán',
  'Quản lý thẻ doanh nghiệp', 'Hoàn ứng cho nhân viên', 'Trả hoá đơn nhà cung cấp',
].map((v) => ({ value: v, label: v }))
const VOLUMES = [
  { value: 'lt500m', label: 'Dưới 500 triệu', desc: 'Doanh nghiệp mới, quy mô nhỏ' },
  { value: '500m-2b', label: '500 triệu – 2 tỷ', desc: 'Phổ biến với đội 10 – 50 người' },
  { value: '2b-10b', label: '2 – 10 tỷ', desc: 'Doanh nghiệp đang tăng trưởng' },
  { value: 'gt10b', label: 'Trên 10 tỷ', desc: 'Nhiều tài khoản, nhiều chi nhánh' },
]
function suggestPlan(f) {
  const big = ['201 – 500', 'Trên 500'].includes(f.company.size)
  if (f.needs.volume === 'gt10b' || big) return PLANS.find((p) => p.id === 'scale')
  if (f.needs.volume === 'lt500m' && f.company.size === '1 – 10') return PLANS.find((p) => p.id === 'free')
  return PLANS.find((p) => p.id === 'growth')
}

const initial = (state) => ({
  step: 0,
  company: { name: '', taxCode: '', type: '', industry: '', website: '', size: '' },
  lookedUp: false,
  address: { city: '', ward: '', street: '', same: true, opCity: '', opWard: '', opStreet: '' },
  banks: { selected: [], status: {} },
  books: { regime: '', period: '', software: '', einvoice: '' },
  team: [{ id: 'me', name: state?.name || ME.name, email: state?.email || ME.email, role: 'admin', me: true }],
  needs: { goals: [], volume: '' },
})

function loadDraft(state) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      const d = { ...initial(state), ...JSON.parse(raw) }
      // bỏ trạng thái "đang kết nối" dở dang khi tải lại trang
      const status = Object.fromEntries(Object.entries(d.banks?.status || {}).filter(([, v]) => v === 'connected'))
      return { ...d, banks: { selected: d.banks?.selected || [], status } }
    }
  } catch { /* bỏ qua */ }
  return initial(state)
}

const digits = (s) => s.replace(/\D/g, '')
const connectedOf = (f) => BANK_LIST.filter((b) => f.banks.status[b] === 'connected')
const invitesOf = (f) => f.team.filter((m) => !m.me)

/* ---------------- Kiểm tra từng bước ---------------- */
function validate(step, f) {
  const e = {}
  if (step === 0) {
    const c = f.company
    const n = digits(c.taxCode).length
    if (!n) e.taxCode = 'Vui lòng nhập mã số thuế'
    else if (n !== 10 && n !== 13) e.taxCode = 'Mã số thuế gồm 10 hoặc 13 chữ số'
    if (c.name.trim().length < 4) e.name = 'Vui lòng nhập tên công ty theo giấy đăng ký'
    if (!c.type) e.type = 'Chọn loại hình doanh nghiệp'
    if (!c.industry) e.industry = 'Chọn ngành nghề chính'
    if (c.website && !/^[\w-]+(\.[\w-]+)+(\/.*)?$/i.test(c.website.replace(/^https?:\/\//, ''))) e.website = 'Website chưa đúng định dạng, ví dụ: congty.vn'
    if (!c.size) e.size = 'Chọn số nhân sự'
  }
  if (step === 1) {
    const a = f.address
    if (!a.city) e.city = 'Chọn tỉnh/thành phố'
    if (a.ward.trim().length < 3) e.ward = 'Nhập phường/xã'
    if (a.street.trim().length < 3) e.street = 'Nhập số nhà, tên đường'
    if (!a.same) {
      if (!a.opCity) e.opCity = 'Chọn tỉnh/thành phố'
      if (a.opWard.trim().length < 3) e.opWard = 'Nhập phường/xã'
      if (a.opStreet.trim().length < 3) e.opStreet = 'Nhập số nhà, tên đường'
    }
  }
  if (step === 2) {
    const st = Object.values(f.banks.status)
    if (st.includes('connecting')) e.banks = 'Đang kết nối ngân hàng, vui lòng chờ trong giây lát'
    else if (!connectedOf(f).length) {
      e.banks = f.banks.selected.length ? 'Bấm “Cho phép kết nối” để hoàn tất kết nối' : 'Chọn và kết nối ít nhất một ngân hàng'
    }
  }
  if (step === 3) {
    const b = f.books
    if (!b.regime) e.regime = 'Chọn chế độ kế toán'
    if (!b.period) e.period = 'Chọn kỳ kế toán bắt đầu'
    if (!b.software) e.software = 'Cho chúng tôi biết bạn đang ghi sổ bằng gì'
  }
  if (step === 4) {
    const seen = new Set(f.team.filter((m) => m.me).map((m) => m.email.trim().toLowerCase()))
    invitesOf(f).forEach((m) => {
      const v = m.email.trim().toLowerCase()
      if (!v) e[`inv-${m.id}`] = 'Nhập email hoặc xoá dòng này'
      else if (!isEmail(v)) e[`inv-${m.id}`] = 'Email chưa đúng định dạng'
      else if (seen.has(v)) e[`inv-${m.id}`] = 'Email này đã có trong danh sách'
      seen.add(v)
    })
  }
  if (step === 5) {
    if (!f.needs.goals.length) e.goals = 'Chọn ít nhất một nhu cầu'
    if (!f.needs.volume) e.volume = 'Chọn mức giao dịch hằng tháng'
  }
  return e
}

function StepHead({ title, desc }) {
  return (
    <div className="mb-7">
      <h2 className="ds-h1">{title}</h2>
      {desc && <p className="text-muted mt-1.5">{desc}</p>}
    </div>
  )
}
const Err = ({ children }) => (children ? <p className="text-[12.5px] text-neg mt-1.5">{children}</p> : null)

function SampleLink({ onClick, children = 'Dùng dữ liệu mẫu' }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[12.5px] font-[550] text-brand-ink hover:underline">
      <Sparkles size={13} /> {children}
    </button>
  )
}

/* ---------------- Cột phải: mẹo + tóm tắt ---------------- */
const TIPS = [
  { title: 'Tra cứu bằng mã số thuế', text: 'Nhập mã số thuế rồi bấm "Tra cứu" — Mạch sẽ điền sẵn tên và địa chỉ trụ sở từ dữ liệu đăng ký kinh doanh.' },
  { title: 'Địa chỉ hai cấp', text: 'Từ 01/07/2025, địa chỉ hành chính chỉ còn cấp tỉnh/thành phố và phường/xã. Hãy ghi theo giấy đăng ký mới nhất.' },
  { title: 'Kết nối an toàn', text: 'Mạch không bao giờ hỏi mật khẩu ngân hàng. Quyền mặc định là chỉ đọc, và bạn có thể ngắt kết nối bất cứ lúc nào.' },
  { title: 'Chọn chế độ nào?', text: 'Doanh nghiệp nhỏ và vừa thường dùng Thông tư 133. Nếu chưa chắc, hãy hỏi kế toán — bạn có thể đổi trước khi chốt sổ kỳ đầu tiên.' },
  { title: 'Phân quyền rõ ràng', text: 'Kế toán xem mọi giao dịch và ghi sổ nhưng không tạo lệnh chi. Nhân viên chỉ thấy thẻ và khoản hoàn ứng của chính mình.' },
  { title: 'Vì sao hỏi điều này?', text: 'Mạch dùng câu trả lời để sắp xếp bảng điều khiển và gợi ý gói dịch vụ phù hợp. Bạn có thể thay đổi sau.' },
]

function Row({ icon: Icon, label, value, ok }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line last:border-0">
      <span className={cn('mt-0.5 size-6 shrink-0 grid place-items-center rounded-full', ok ? 'bg-pos-soft text-pos' : 'bg-subtle text-faint')}>
        {ok ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-faint">{label}</div>
        <div className={cn('text-[13.5px] truncate', value ? 'text-fg font-[550]' : 'text-faint')}>{value || 'Chưa có'}</div>
      </div>
    </div>
  )
}

function Summary({ f, done }) {
  const tip = TIPS[f.step]
  const c = f.company
  const a = f.address
  const banks = connectedOf(f)
  const nAcc = banks.reduce((s, b) => s + accountsOf(b).length, 0)
  const invites = invitesOf(f).filter((m) => isEmail(m.email))
  return (
    <div className="p-10 pt-14 flex flex-col gap-5">
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <div className="flex items-center gap-2 text-brand-ink text-[13px] font-[650]"><Lightbulb size={16} /> {tip.title}</div>
        <p className="mt-1.5 text-[13.5px] text-dim leading-relaxed">{tip.text}</p>
      </div>
      <div className="rounded-2xl bg-surface border border-line shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="ds-label">Không gian làm việc</div>
          <span className="text-[12.5px] text-muted num">{done}/{STEPS.length} bước</span>
        </div>
        <Progress value={done} max={STEPS.length} auto={false} className="mt-3" />
        <div className="mt-5 flex items-center gap-3">
          <Avatar name={c.name || 'Công ty'} color="#138f66" size={40} square />
          <div className="min-w-0">
            <div className="text-[14.5px] font-[600] truncate">{c.name || 'Tên công ty'}</div>
            <div className="ds-caption">{c.taxCode ? `MST ${c.taxCode}` : 'Mã số thuế'}{c.type ? ` · ${c.type}` : ''}</div>
          </div>
        </div>
        <div className="mt-4">
          <Row icon={MapPin} label="Trụ sở" value={a.street && a.city ? `${a.street}, ${a.ward}, ${a.city}` : ''} ok={!!(a.street && a.city && a.ward)} />
          <Row icon={Landmark} label="Ngân hàng đã kết nối" value={banks.length ? `${banks.length} ngân hàng · ${nAcc} tài khoản` : ''} ok={banks.length > 0} />
          <Row icon={BookOpen} label="Kế toán" value={f.books.regime ? `${REGIME_LABEL[f.books.regime]}${f.books.period ? ` · từ ${f.books.period.replace('Tháng ', 'T')}` : ''}` : ''} ok={!!(f.books.regime && f.books.period && f.books.software)} />
          <Row icon={Users} label="Đội ngũ" value={`Bạn${invites.length ? ` + ${invites.length} người được mời` : ''}`} ok={invites.length > 0} />
          <Row icon={Target} label="Nhu cầu" value={f.needs.goals.length ? `${f.needs.goals.length} mục tiêu` : ''} ok={!!(f.needs.goals.length && f.needs.volume)} />
        </div>
      </div>
      <p className="ds-caption flex items-center justify-center gap-1.5"><ShieldCheck size={14} /> Bản nháp chỉ lưu trên trình duyệt này</p>
    </div>
  )
}

/* ---------------- Màn hình hoàn tất ---------------- */
function Ready({ f, onEnter, onHome }) {
  const banks = connectedOf(f)
  const nAcc = banks.reduce((s, b) => s + accountsOf(b).length, 0)
  const invites = invitesOf(f)
  const plan = suggestPlan(f)
  const items = [
    { ok: true, label: `Đã kết nối ${banks.length} ngân hàng`, desc: `${banks.join(', ')} · ${nAcc} tài khoản, chỉ đọc` },
    invites.length
      ? { ok: true, label: `Đã mời ${invites.length} thành viên`, desc: invites.map((m) => m.email.trim()).join(', ') }
      : { ok: false, label: 'Chưa mời thành viên', desc: 'Bạn có thể mời kế toán và đồng nghiệp sau trong phần Thành viên' },
    { ok: true, label: 'Đã chọn chế độ kế toán', desc: `${REGIME_LABEL[f.books.regime]} · bắt đầu từ ${f.books.period}` },
  ]
  return (
    <FlowShell onClose={onHome} title="Thiết lập doanh nghiệp">
      <div className="flex flex-col items-center text-center pt-2">
        <span className="size-16 rounded-full grid place-items-center mb-5 bg-pos-soft text-pos animate-pop-in"><Check size={32} strokeWidth={2.6} /></span>
        <h2 className="ds-h1">Không gian làm việc đã sẵn sàng</h2>
        <p className="text-muted mt-2 max-w-md">
          Chào mừng <b className="font-[600] text-fg">{f.company.name}</b> đến với Mạch. Giao dịch từ ngân hàng sẽ tiếp tục được đồng bộ trong nền.
        </p>
      </div>

      <div className="mt-8 card p-5">
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.label} className="flex items-start gap-3 py-3 border-b border-line last:border-0">
              <span className={cn('mt-0.5 size-6 shrink-0 grid place-items-center rounded-full', it.ok ? 'bg-pos-soft text-pos' : 'bg-subtle text-faint')}>
                {it.ok ? <Check size={13} strokeWidth={3} /> : <Circle size={11} />}
              </span>
              <div className="min-w-0">
                <div className={cn('text-[14px] font-[600]', !it.ok && 'text-muted')}>{it.label}</div>
                <div className="ds-caption break-words">{it.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 card p-5">
        <KeyValue items={[
          { label: 'Doanh nghiệp', value: f.company.name },
          { label: 'Mã số thuế', value: f.company.taxCode },
          { label: 'Gói gợi ý', value: plan ? `${plan.name}${plan.price ? ' · dùng thử miễn phí 30 ngày' : ' · miễn phí'}` : '—' },
        ]} />
      </div>

      <Callout tone="brand" icon={Sparkles} className="mt-5">Đây là bản demo: bảng điều khiển hiển thị dữ liệu mô phỏng của công ty Sen Việt Digital.</Callout>

      <div className="mt-6 flex flex-col-reverse sm:flex-row justify-center gap-2">
        <Button variant="ghost" size="lg" icon={Home} onClick={onHome}>Về trang chủ</Button>
        <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={onEnter}>Vào bảng điều khiển</Button>
      </div>
    </FlowShell>
  )
}

/* ================================================================ */
export default function OnboardingPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [f, setF] = useState(() => loadDraft(state))
  const [tried, setTried] = useState({})
  const [lookup, setLookup] = useState(false)
  const [exit, setExit] = useState(false)
  const [sending, setSending] = useState(false)
  const [finished, setFinished] = useState(false)
  const topRef = useRef(null)
  const timers = useRef([])
  const step = f.step

  useEffect(() => { document.title = 'Thiết lập doanh nghiệp — Mạch' }, [])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (finished) return
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(f)) } catch { /* bỏ qua */ }
  }, [f, finished])
  useEffect(() => { topRef.current?.scrollIntoView({ block: 'start' }) }, [step])

  const errors = useMemo(() => (tried[step] ? validate(step, f) : {}), [tried, step, f])
  const doneCount = useMemo(() => STEPS.filter((_, i) => {
    if (Object.keys(validate(i, f)).length) return false
    // bước mời đội ngũ không bắt buộc: chỉ tính khi đã đi qua hoặc đã mời ai đó
    return i !== 4 || f.step > 4 || invitesOf(f).length > 0
  }).length, [f])

  /** setter lồng: patch('company', { name }) */
  const patch = useCallback((group, p) => setF((x) => ({ ...x, [group]: { ...x[group], ...p } })), [])
  const field = (group, key, map = (v) => v) => (e) => patch(group, { [key]: map(e?.target ? e.target.value : e) })
  const goto = (s) => setF((x) => ({ ...x, step: s }))

  const next = () => {
    const e = validate(step, f)
    if (Object.keys(e).length) {
      setTried((t) => ({ ...t, [step]: true }))
      toast({ title: 'Còn thông tin cần bổ sung', desc: 'Vui lòng kiểm tra các mục được đánh dấu đỏ.', tone: 'neg' })
      return
    }
    if (step < STEPS.length - 1) return goto(step + 1)
    // hoàn tất thiết lập
    setSending(true)
    timers.current.push(setTimeout(() => {
      try { sessionStorage.removeItem(DRAFT_KEY) } catch { /* bỏ qua */ }
      setSending(false)
      setFinished(true)
    }, 1200))
  }
  const back = () => (step > 0 ? goto(step - 1) : setExit(true))

  /* ---- Tra cứu mã số thuế (giả lập) ---- */
  const runLookup = () => {
    const n = digits(f.company.taxCode).length
    if (n !== 10 && n !== 13) {
      setTried((t) => ({ ...t, 0: true }))
      return
    }
    setLookup(true)
    timers.current.push(setTimeout(() => {
      setF((x) => ({
        ...x,
        lookedUp: true,
        company: { ...x.company, name: COMPANY.name, type: COMPANY.type, industry: COMPANY.industry, website: x.company.website || COMPANY.website, size: x.company.size || COMPANY.employees },
        address: { ...x.address, city: COMPANY.city, ward: COMPANY.ward, street: COMPANY.address },
      }))
      setLookup(false)
    }, 1200))
  }

  /* ---- Kết nối ngân hàng (giả lập) ---- */
  const setBanks = (fn) => setF((x) => ({ ...x, banks: fn(x.banks) }))
  const toggleBank = (b) => setBanks((k) => ({ ...k, selected: k.selected.includes(b) ? k.selected.filter((y) => y !== b) : [...k.selected, b] }))
  const pending = f.banks.selected.filter((b) => !f.banks.status[b])
  const connecting = Object.values(f.banks.status).includes('connecting')
  const connectBanks = () => {
    const list = pending
    if (!list.length) return
    setBanks((k) => ({ ...k, status: { ...k.status, ...Object.fromEntries(list.map((b) => [b, 'connecting'])) } }))
    list.forEach((b, i) => {
      timers.current.push(setTimeout(() => {
        setBanks((k) => (k.status[b] === 'connecting' ? { ...k, status: { ...k.status, [b]: 'connected' } } : k))
        if (i === list.length - 1) toast({ title: 'Đã kết nối ngân hàng', desc: `${list.length} ngân hàng · dữ liệu mô phỏng` })
      }, 1100 + i * 700))
    })
  }
  const disconnect = (b) => setBanks((k) => {
    const status = { ...k.status }
    delete status[b]
    return { selected: k.selected.filter((y) => y !== b), status }
  })

  /* ---- Đội ngũ ---- */
  const setMember = (id, p) => setF((x) => ({ ...x, team: x.team.map((m) => (m.id === id ? { ...m, ...p } : m)) }))
  const addMember = (m = {}) => setF((x) => ({
    ...x,
    team: [...x.team, { id: `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, email: '', role: invitesOf(x).length ? 'employee' : 'bookkeeper', ...m }],
  }))
  const removeMember = (id) => setF((x) => ({ ...x, team: x.team.filter((m) => m.id !== id) }))
  const addSampleTeam = () => {
    const have = new Set(f.team.map((m) => m.email.trim().toLowerCase()))
    const sample = TEAM.filter((m) => ['u2', 'u3'].includes(m.id) && !have.has(m.email))
    setF((x) => ({
      ...x,
      team: [...x.team.filter((m) => m.me || m.email.trim()), ...sample.map((m) => ({ id: `s-${m.id}`, email: m.email, role: m.role === 'bookkeeper' ? 'bookkeeper' : 'employee' }))],
    }))
  }

  const enterApp = () => {
    useAuth.getState().login({ name: ME.name, email: ME.email })
    useAuth.getState().setOnboarded(true)
    navigate('/tong-quan')
  }

  if (finished) {
    return <Ready f={f} onEnter={enterApp} onHome={() => navigate('/')} />
  }

  const nameParts = (state?.name || '').trim().split(/\s+/).filter(Boolean)
  const greet = nameParts.length ? nameParts.slice(-2).join(' ') : ''
  const last = step === STEPS.length - 1
  const connected = connectedOf(f)
  const me = f.team.find((m) => m.me)
  const invites = invitesOf(f)
  const plan = suggestPlan(f)

  return (
    <>
      <FlowShell
        onClose={() => setExit(true)}
        title="Thiết lập doanh nghiệp"
        steps={STEPS}
        current={step}
        onBack={step > 0 ? () => goto(step - 1) : undefined}
        aside={<Summary f={f} done={doneCount} />}
        footer={<>
          <Button variant="ghost" onClick={back}>{step === 0 ? 'Lưu & thoát' : 'Quay lại'}</Button>
          <Button variant="primary" size="lg" loading={sending} icon={last ? Check : undefined} iconRight={last ? undefined : ArrowRight} onClick={next}>
            {last ? 'Hoàn tất thiết lập' : step === 4 && !invites.length ? 'Bỏ qua, mời sau' : 'Tiếp tục'}
          </Button>
        </>}
      >
        <div ref={topRef} className="scroll-mt-10" />
        <div key={step} className="animate-slide-up">
          {/* ---------- 1. Thông tin công ty ---------- */}
          {step === 0 && (
            <>
              <StepHead title="Thông tin công ty"
                desc={`${greet ? `Chào ${greet}, h` : 'H'}ãy bắt đầu với vài thông tin cơ bản. Tra cứu bằng mã số thuế để điền nhanh.`} />
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-start gap-2">
                    <Input id="ob-tax" label="Mã số thuế" className="flex-1" inputMode="numeric" placeholder="10 hoặc 13 chữ số" inputClassName="num"
                      value={f.company.taxCode} onChange={field('company', 'taxCode', (v) => v.replace(/[^\d -]/g, '').slice(0, 16))} error={errors.taxCode}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runLookup() } }} />
                    <Button variant="outline" icon={Search} loading={lookup} onClick={runLookup} className="mt-[26px] h-10 shrink-0">Tra cứu</Button>
                  </div>
                  {!f.company.taxCode && <div className="mt-2"><SampleLink onClick={() => patch('company', { taxCode: COMPANY.taxCode })}>Dùng mã số thuế mẫu</SampleLink></div>}
                </div>
                {lookup && (
                  <div className="flex flex-col gap-2 rounded-xl border border-line p-4" aria-live="polite">
                    <span className="sr-only">Đang tra cứu mã số thuế</span>
                    <div className="skeleton h-4 w-2/3" /><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-3/4" />
                  </div>
                )}
                {f.lookedUp && !lookup && (
                  <Callout tone="pos" icon={CircleCheck} title="Đã tìm thấy doanh nghiệp">
                    Thông tin công ty và địa chỉ trụ sở đã được điền sẵn từ dữ liệu đăng ký kinh doanh. Vui lòng kiểm tra lại.
                  </Callout>
                )}
                <Input id="ob-name" label="Tên công ty" hint="Ghi đúng như trên giấy chứng nhận đăng ký doanh nghiệp" placeholder="Công ty TNHH…"
                  value={f.company.name} onChange={field('company', 'name')} error={errors.name} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select id="ob-type" label="Loại hình doanh nghiệp" placeholder="Chọn loại hình" options={BIZ_TYPES}
                    value={f.company.type} onChange={field('company', 'type')} error={errors.type} />
                  <Select id="ob-ind" label="Ngành nghề chính" placeholder="Chọn ngành nghề" options={INDUSTRIES}
                    value={f.company.industry} onChange={field('company', 'industry')} error={errors.industry} />
                </div>
                <Input id="ob-web" label="Website" optional prefix={Globe} placeholder="congty.vn"
                  value={f.company.website} onChange={field('company', 'website')} error={errors.website} />
                <div>
                  <GroupLabel id="ob-size">Số nhân sự</GroupLabel>
                  <Chips labelledBy="ob-size" options={SIZES} value={f.company.size} onChange={field('company', 'size')} />
                  <Err>{errors.size}</Err>
                </div>
              </div>
            </>
          )}

          {/* ---------- 2. Địa chỉ ---------- */}
          {step === 1 && (
            <>
              <StepHead title="Địa chỉ trụ sở" desc="Theo giấy chứng nhận đăng ký doanh nghiệp. Mạch dùng địa chỉ này trên hoá đơn bán ra và báo cáo kế toán." />
              <div className="flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select id="ob-city" label="Tỉnh/thành phố" placeholder="Chọn tỉnh/thành phố" options={PROVINCES}
                    value={f.address.city} onChange={field('address', 'city')} error={errors.city} />
                  <Input id="ob-ward" label="Phường/xã" placeholder="Phường Bến Thành"
                    value={f.address.ward} onChange={field('address', 'ward')} error={errors.ward} />
                </div>
                <Input id="ob-street" label="Số nhà, tên đường" placeholder="Tầng 9, 52 Nguyễn Thị Minh Khai"
                  value={f.address.street} onChange={field('address', 'street')} error={errors.street} />
                <div className="rounded-xl bg-subtle p-4 mt-1">
                  <Checkbox checked={f.address.same} onChange={(v) => patch('address', { same: v })}
                    label="Địa chỉ văn phòng giống địa chỉ đăng ký" desc="Địa chỉ in trên hoá đơn gửi khách hàng và đối tác." />
                </div>
                {!f.address.same && (
                  <div className="flex flex-col gap-4 rounded-2xl border border-line p-4 sm:p-5 animate-pop-in">
                    <div className="ds-h3 flex items-center gap-2"><Building2 size={16} className="text-muted" /> Địa chỉ văn phòng</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Select id="ob-ocity" label="Tỉnh/thành phố" placeholder="Chọn tỉnh/thành phố" options={PROVINCES}
                        value={f.address.opCity} onChange={field('address', 'opCity')} error={errors.opCity} />
                      <Input id="ob-oward" label="Phường/xã" value={f.address.opWard} onChange={field('address', 'opWard')} error={errors.opWard} />
                    </div>
                    <Input id="ob-ostreet" label="Số nhà, tên đường" value={f.address.opStreet} onChange={field('address', 'opStreet')} error={errors.opStreet} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ---------- 3. Kết nối ngân hàng ---------- */}
          {step === 2 && (
            <>
              <StepHead title="Kết nối ngân hàng" desc="Chọn các ngân hàng công ty đang dùng. Số dư và giao dịch sẽ hiện về Mạch — tiền vẫn nằm ở ngân hàng của bạn." />
              <Callout tone="info" icon={ShieldCheck} className="mb-5">Mạch chỉ đọc số dư và giao dịch. Không lưu mật khẩu ngân hàng.</Callout>
              <div className="flex items-center justify-between gap-3 mb-2">
                <GroupLabel id="ob-banks" hint="Các ngân hàng phổ biến · bản demo kết nối mô phỏng">Ngân hàng của công ty</GroupLabel>
                {!f.banks.selected.length && !connected.length && (
                  <SampleLink onClick={() => setBanks((k) => ({ ...k, selected: SAMPLE_BANKS }))}>Chọn ngân hàng mẫu</SampleLink>
                )}
              </div>
              <div role="group" aria-labelledby="ob-banks" className="grid sm:grid-cols-2 gap-2">
                {BANK_LIST.map((b) => (
                  <BankTile key={b} name={b} selected={f.banks.selected.includes(b)} status={f.banks.status[b]} onToggle={() => toggleBank(b)} />
                ))}
              </div>

              {pending.length > 0 && (
                <div className="mt-5 rounded-2xl border border-line bg-surface p-4 sm:p-5 animate-pop-in">
                  <div className="ds-h3">Cấp quyền cho Mạch</div>
                  <p className="ds-caption mt-0.5">{pending.join(', ')}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {PERMISSIONS.map((p) => (
                      <li key={p.text} className="flex items-start gap-2.5 text-[13.5px] text-dim">
                        <p.icon size={15} className="mt-0.5 shrink-0 text-brand-ink" /> {p.text}
                      </li>
                    ))}
                  </ul>
                  <Button variant="primary" icon={ShieldCheck} className="mt-4" loading={connecting} disabled={connecting} onClick={connectBanks}>
                    Cho phép kết nối
                  </Button>
                </div>
              )}
              <Err>{errors.banks}</Err>

              {connected.length > 0 && (
                <div className="mt-6">
                  <GroupLabel>Tài khoản tìm thấy</GroupLabel>
                  <div className="flex flex-col gap-3">
                    {connected.map((b) => (
                      <div key={b} className="card p-4">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[13.5px] font-[600] truncate">{b}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge tone="neutral" size="sm" icon={Eye}>Chỉ đọc</Badge>
                            <IconButton icon={Unplug} label={`Ngắt kết nối ${b}`} size="sm" onClick={() => disconnect(b)} />
                          </div>
                        </div>
                        {accountsOf(b).map((a) => (
                          <div key={a.id} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
                            <AccountIcon kind={a.kind} color={a.color} size={30} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[13.5px] font-[550] truncate">{a.name}</div>
                              <div className="text-[11.5px] text-faint num">••{a.last4}</div>
                            </div>
                            <Money value={a.balance} hideable={false} className="text-[13.5px] font-[550]" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ---------- 4. Thiết lập kế toán ---------- */}
          {step === 3 && (
            <>
              <StepHead title="Thiết lập kế toán" desc="Mạch tự phân loại giao dịch và lập sổ theo chế độ bạn chọn." />
              {!f.books.regime && (
                <div className="-mt-4 mb-5">
                  <SampleLink onClick={() => patch('books', { regime: 'tt200', period: PERIODS[10], software: 'MISA', einvoice: 'MISA meInvoice' })}>Dùng thiết lập gợi ý</SampleLink>
                </div>
              )}
              <div className="flex flex-col gap-7">
                <div>
                  <GroupLabel>Chế độ kế toán</GroupLabel>
                  <RadioCards columns={2} options={REGIMES} value={f.books.regime} onChange={field('books', 'regime')} />
                  <Err>{errors.regime}</Err>
                </div>
                <Select id="ob-period" label="Kỳ kế toán bắt đầu" placeholder="Chọn tháng" options={PERIODS}
                  hint="Mạch nhập giao dịch từ đầu kỳ này để lập sổ." value={f.books.period} onChange={field('books', 'period')} error={errors.period} />
                <div>
                  <GroupLabel id="ob-soft" hint="Mạch có thể đồng bộ hoặc xuất dữ liệu sang phần mềm này">Phần mềm kế toán đang dùng</GroupLabel>
                  <Chips labelledBy="ob-soft" options={SOFTWARE} value={f.books.software} onChange={field('books', 'software')} />
                  <Err>{errors.software}</Err>
                </div>
                <Select id="ob-einv" label="Nhà cung cấp hoá đơn điện tử" optional placeholder="Chọn nhà cung cấp" options={EINVOICE}
                  hint="Để khớp hoá đơn đầu vào, đầu ra với giao dịch." value={f.books.einvoice} onChange={field('books', 'einvoice')} />
              </div>
            </>
          )}

          {/* ---------- 5. Mời đội ngũ ---------- */}
          {step === 4 && (
            <>
              <StepHead title="Mời đội ngũ" desc="Mời kế toán và đồng nghiệp cùng làm việc. Lời mời được gửi qua email khi bạn hoàn tất thiết lập." />
              <div className="flex flex-col gap-2">
                {me && (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-subtle px-3.5 py-3">
                    <Avatar name={me.name} color={ME.color} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-[550] truncate">{me.name} <span className="font-normal text-faint">(bạn)</span></div>
                      <div className="ds-caption truncate">{me.email}</div>
                    </div>
                    <Badge tone="brand">{ROLES.admin.label}</Badge>
                  </div>
                )}
                {invites.map((m, i) => (
                  <div key={m.id} className="animate-pop-in">
                    <div className="flex items-start gap-2">
                      <Input id={`ob-inv-${m.id}`} className="flex-1 min-w-0" type="email" placeholder="ketoan@congty.vn" autoComplete="off"
                        aria-label={`Email người được mời ${i + 1}`} autoFocus={!m.email && i === invites.length - 1}
                        value={m.email} onChange={(e) => setMember(m.id, { email: e.target.value })} error={errors[`inv-${m.id}`]} />
                      <Select className="w-[148px] shrink-0" aria-label="Vai trò" options={ROLE_OPTS}
                        value={m.role} onChange={(e) => setMember(m.id, { role: e.target.value })} />
                      <IconButton icon={Trash2} label="Xoá dòng" className="mt-1" onClick={() => removeMember(m.id)} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button variant="outline" icon={Plus} onClick={() => addMember()} disabled={invites.length >= 10}>Thêm người</Button>
                {!invites.some((m) => m.email) && <SampleLink onClick={addSampleTeam}>Mời kế toán & thành viên mẫu</SampleLink>}
              </div>
              <div className="mt-7 card p-4">
                <div className="ds-label mb-1">Vai trò</div>
                {INVITE_ROLES.map((r) => (
                  <div key={r} className="py-2 border-b border-line last:border-0">
                    <div className="text-[13.5px] font-[550]">{ROLES[r].label}</div>
                    <div className="ds-caption">{ROLES[r].desc}</div>
                  </div>
                ))}
              </div>
              <p className="ds-caption mt-3">Bạn có thể bỏ qua bước này và mời sau trong phần Thành viên.</p>
            </>
          )}

          {/* ---------- 6. Nhu cầu sử dụng ---------- */}
          {step === 5 && (
            <>
              <StepHead title="Bạn muốn Mạch giúp gì?" desc="Chọn những việc quan trọng nhất — Mạch sẽ sắp xếp bảng điều khiển cho phù hợp. Bạn có thể đổi sau." />
              <div className="flex flex-col gap-7">
                <div>
                  <GroupLabel id="ob-goals" hint="Chọn tất cả mục phù hợp">Nhu cầu chính</GroupLabel>
                  <Chips multiple labelledBy="ob-goals" options={GOALS} value={f.needs.goals} onChange={(v) => patch('needs', { goals: v })} />
                  <Err>{errors.goals}</Err>
                </div>
                <div>
                  <GroupLabel hint="Tổng tiền vào và ra trên các tài khoản ngân hàng của công ty">Giao dịch hằng tháng</GroupLabel>
                  <RadioCards columns={2} options={VOLUMES} value={f.needs.volume} onChange={field('needs', 'volume')} />
                  <Err>{errors.volume}</Err>
                </div>
                {f.needs.volume && plan && (
                  <Callout tone="brand" icon={Sparkles} title={`Gợi ý: gói ${plan.name}`} className="animate-pop-in">
                    {plan.tag}. {plan.price ? 'Dùng thử miễn phí 30 ngày, không cần thẻ thanh toán.' : 'Miễn phí, nâng cấp khi cần.'}
                  </Callout>
                )}
              </div>
            </>
          )}

          {/* mẹo hiển thị trong nội dung khi cột phải bị ẩn (màn hình < xl) */}
          <div className="xl:hidden mt-10 rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <div className="flex items-center gap-2 text-brand-ink text-[13px] font-[650]"><Lightbulb size={15} /> {TIPS[step].title}</div>
            <p className="mt-1 text-[13px] text-dim leading-relaxed">{TIPS[step].text}</p>
          </div>
        </div>
      </FlowShell>

      <Confirm open={exit} onClose={() => setExit(false)} onConfirm={() => navigate('/')}
        title="Thoát thiết lập?" desc="Bản nháp được lưu trên trình duyệt này. Bạn có thể quay lại tiếp tục bất cứ lúc nào trong phiên làm việc."
        confirmLabel="Lưu & thoát" cancelLabel="Ở lại" />
    </>
  )
}
