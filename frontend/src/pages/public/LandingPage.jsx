/* ==========================================================
   Trang giới thiệu Mạch ("/")
   ========================================================== */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Check, ChevronDown, Sparkles, ArrowDownLeft, ShieldCheck, KeyRound, UsersRound, Lock, Landmark,
  Rocket, Briefcase, Store, Ship, Zap, Clock, Mail, PlayCircle, Quote, CreditCard, Send, FileText, BookOpen, Eye,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { PLANS } from '@/data/workspace'
import { CARDS } from '@/data/spend'
import { Avatar, Button, PaymentCard, Segmented } from '@/components/ui'
import { HillsArt } from '@/features/public/HillsArt'
import { AnnouncementBar, PublicFooter, PublicNav, Reveal, scrollToId, useDemoLogin } from '@/features/public/PublicChrome'
import { AccountsMock, AssistantMock, BillsMock, CardsMock, FloatChip, HeroDashboard, InvoiceMock } from '@/features/public/LandingMockups'

const WRAP = 'mx-auto w-full max-w-[1240px] px-4 sm:px-6'
const H2 = 'text-[30px] sm:text-[40px] leading-[1.1] font-[500] tracking-[-0.03em] text-fg'

/* ---------------- Ô email + nút dùng thử ---------------- */
function EmailCta({ id, className }) {
  const navigate = useNavigate()
  const demo = useDemoLogin()
  const [email, setEmail] = useState('')
  const submit = (e) => {
    e.preventDefault()
    navigate('/dang-ky', { state: { email: email.trim() } })
  }
  return (
    <div className={cn('flex flex-col items-center gap-3.5', className)}>
      <form onSubmit={submit} className="flex w-full max-w-[460px] flex-col sm:flex-row gap-2 sm:rounded-[14px] sm:bg-surface sm:border sm:border-line-strong sm:p-1.5 sm:shadow-sm">
        <label htmlFor={id} className="sr-only">Email công việc</label>
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface border border-line-strong sm:border-0 px-3 h-12 sm:h-10 focus-within:ring-[3px] focus-within:ring-brand-100 sm:focus-within:ring-0">
          <Mail size={16} className="text-faint shrink-0" />
          <input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.vn" autoComplete="email"
            className="min-w-0 flex-1 bg-transparent outline-none text-[14.5px]" />
        </div>
        <Button type="submit" variant="primary" size="lg" className="h-12 sm:h-10 rounded-xl" iconRight={ArrowRight}>Dùng thử miễn phí</Button>
      </form>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-muted">
        <button onClick={() => demo()} className="inline-flex items-center gap-1.5 font-[600] text-fg hover:text-brand-ink">
          <PlayCircle size={16} /> Xem bản demo
        </button>
        <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-brand-ink" /> Miễn phí gói Khởi đầu</span>
        <span className="hidden sm:inline-flex items-center gap-1.5"><Check size={14} className="text-brand-ink" /> Thiết lập trong 10 phút</span>
      </div>
    </div>
  )
}

/* ---------------- Hero ---------------- */
function Hero() {
  const card = CARDS.find((c) => c.id === 'c3')
  return (
    <section className="relative overflow-hidden -mt-16 pt-16">
      <HillsArt className="absolute inset-0" />
      {/* làm mờ chân hình vào nền trang */}
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-canvas" aria-hidden />
      <div className={cn(WRAP, 'relative pt-14 sm:pt-20 lg:pt-24 pb-16 sm:pb-24')}>
        <div className="mx-auto max-w-[860px] text-center flex flex-col items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 backdrop-blur px-3 py-1 text-[12.5px] font-[550] text-dim shadow-xs">
              <span className="size-1.5 rounded-full bg-brand-500" /> Dành cho công ty TNHH, cổ phần và hộ kinh doanh
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="ds-display mt-6 text-fg">
              Quản lý tài chính trọn vẹn cho <span className="text-brand-ink">doanh nghiệp Việt</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-[620px] text-[16px] sm:text-[17.5px] leading-relaxed text-dim">
              Kết nối mọi tài khoản ngân hàng của công ty, rồi quản lý thẻ, duyệt chi, trả hoá đơn và sổ sách trong một phần mềm đẹp, nhanh và minh bạch. Tiền vẫn nằm ở ngân hàng của bạn.
            </p>
          </Reveal>
          <Reveal delay={240} className="mt-8 w-full">
            <EmailCta id="hero-email" />
          </Reveal>
        </div>

        <Reveal delay={320} className="relative mx-auto mt-14 sm:mt-20 max-w-[880px]">
          <HeroDashboard />
          <FloatChip icon={ArrowDownLeft} tone="pos" title="+96.000.000 ₫ từ Tre Việt Xanh" desc="Hoá đơn SV-2026-0148 · đã đối soát"
            className="hidden xl:flex absolute -left-28 bottom-12" />
          <FloatChip icon={Sparkles} tone="brand" title="Đã phân loại 128 giao dịch" desc="Trợ lý AI · khớp 41 hoá đơn VAT"
            className="hidden xl:flex absolute -right-24 -bottom-6" />
          <div className="hidden xl:block absolute -right-28 -top-14 rotate-[8deg]">
            <PaymentCard card={card} size="sm" holder="Phạm Đức Huy" />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Dải khách hàng (tên hư cấu) ---------------- */
const WORDMARKS = [
  { name: 'Hạt Mầm', cls: 'font-[700] tracking-tight' },
  { name: 'TRE VIỆT', cls: 'font-[600] tracking-[.2em] text-[15px]' },
  { name: 'Lụa Xưa', cls: 'font-serif italic text-[22px]' },
  { name: 'bếp nhà lá', cls: 'font-[500] tracking-tight' },
  { name: 'GỐM AN', cls: 'font-mono font-[600] tracking-wider text-[15px]' },
  { name: 'Mây.', cls: 'font-[800] text-[22px] tracking-tighter' },
  { name: 'Nụ Cười', cls: 'font-serif font-[600] text-[19px]' },
]
function TrustStrip() {
  return (
    <section className={cn(WRAP, 'py-10 sm:py-12')}>
      <p className="text-center text-[13px] text-muted">Hơn 12.000 doanh nghiệp Việt vận hành tài chính mỗi ngày cùng Mạch</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 text-[19px] text-faint">
        {WORDMARKS.map((w) => <span key={w.name} className={cn('select-none whitespace-nowrap hover:text-muted transition-colors', w.cls)}>{w.name}</span>)}
      </div>
    </section>
  )
}

/* ---------------- Khối tính năng (chữ + bản dựng xen kẽ) ---------------- */
function Feature({ id, eyebrow, icon: Icon, title, desc, bullets, mock, flip }) {
  return (
    <section id={id} className={cn(WRAP, 'scroll-mt-24 py-14 sm:py-20')}>
      <div className="grid items-center gap-10 lg:gap-16 lg:grid-cols-2">
        <Reveal className={cn('max-w-[520px]', flip && 'lg:order-2 lg:justify-self-end')}>
          <div className="inline-flex items-center gap-2 text-[13px] font-[600] text-brand-ink">
            <span className="size-7 grid place-items-center rounded-lg bg-brand-50 border border-brand-100"><Icon size={15} /></span>
            {eyebrow}
          </div>
          <h2 className="mt-4 text-[30px] sm:text-[38px] leading-[1.12] font-[500] tracking-[-0.03em] text-fg">{title}</h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-dim">{desc}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[14.5px] text-fg">
                <span className="mt-0.5 size-5 shrink-0 grid place-items-center rounded-full bg-brand-50 text-brand-ink"><Check size={12} strokeWidth={3} /></span>
                {b}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120} className={cn('w-full min-w-0', flip && 'lg:order-1')}>{mock}</Reveal>
      </div>
    </section>
  )
}

/* ---------------- Dải số liệu ---------------- */
const STATS = [
  { icon: Landmark, value: '40+', label: 'Ngân hàng có thể kết nối' },
  { icon: Clock, value: '3 giờ', label: 'Tiết kiệm mỗi tuần cho việc đối soát' },
  { icon: Sparkles, value: '95%', label: 'Giao dịch được AI tự phân loại' },
  { icon: Zap, value: '10 phút', label: 'Để thiết lập và kết nối ngân hàng' },
]
function StatsBand() {
  return (
    <section className={cn(WRAP, 'py-6')}>
      <Reveal className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-3xl border border-line bg-line">
        {STATS.map((s) => (
          <div key={s.label} className="bg-surface p-5 sm:p-7">
            <s.icon size={18} className="text-brand-ink" />
            <div className="mt-3 text-[28px] sm:text-[34px] font-[500] tracking-[-0.03em] num">{s.value}</div>
            <div className="ds-caption mt-1 text-[13px]">{s.label}</div>
          </div>
        ))}
      </Reveal>
    </section>
  )
}

/* ---------------- Giải pháp theo mô hình ---------------- */
const SOLUTIONS = {
  startup: {
    icon: Rocket, label: 'Khởi nghiệp',
    title: 'Từ ngày đầu gọi vốn đến khi có 50 nhân sự',
    desc: 'Gom số dư từ mọi ngân hàng về một chỗ, tách bạch vốn góp và chi tiêu, theo dõi số tháng hoạt động còn lại theo thời gian thực.',
    points: ['Báo cáo tốc độ đốt tiền & runway tự động', 'Dự báo dòng tiền 3 – 6 tháng tới', 'Mời nhà đầu tư xem số liệu với quyền chỉ đọc'],
    metric: ['3 giờ', 'tiết kiệm mỗi tuần cho việc đối soát'],
  },
  agency: {
    icon: Briefcase, label: 'Agency & dịch vụ',
    title: 'Xuất hoá đơn theo dự án, thu tiền đúng hạn',
    desc: 'Gửi hoá đơn có VAT kèm VietQR, nhắc nợ tự động và gán thẻ doanh nghiệp riêng cho từng khách hàng để theo dõi chi phí quảng cáo.',
    points: ['Hoá đơn định kỳ cho hợp đồng duy trì', 'Ngân sách chi tiêu theo từng dự án', 'Lợi nhuận từng khách hàng trong một màn hình'],
    metric: ['9 ngày', 'rút ngắn thời gian thu tiền trung bình'],
  },
  retail: {
    icon: Store, label: 'Bán lẻ & F&B',
    title: 'Nhiều chi nhánh, một bức tranh dòng tiền',
    desc: 'Mỗi cửa hàng một mã VietQR riêng, tiền về thẳng tài khoản ngân hàng của bạn. Mạch ghi nhận ngay, cuối ngày đối soát chỉ một chạm.',
    points: ['Mã VietQR & báo cáo riêng cho từng điểm bán', 'Ngân sách chi tiêu cho quản lý ca', 'Nhắc lịch trả tiền thuê mặt bằng và thuế hằng tháng'],
    metric: ['12 chi nhánh', 'trung bình trên mỗi khách hàng chuỗi'],
  },
  trade: {
    icon: Ship, label: 'Xuất nhập khẩu',
    title: 'Giao dịch quốc tế rõ ràng từng đồng',
    desc: 'Theo dõi tiền về từ đối tác nước ngoài, chứng từ ngoại thương và tỷ giá áp dụng cho từng lô hàng.',
    points: ['Lưu chứng từ hải quan theo từng giao dịch', 'Cảnh báo khi tỷ giá vượt ngưỡng bạn đặt', 'Phân quyền riêng cho bộ phận thanh toán quốc tế'],
    metric: ['40+', 'quốc gia đối tác được theo dõi trên Mạch'],
  },
}
function Solutions() {
  const [tab, setTab] = useState('startup')
  const s = SOLUTIONS[tab]
  return (
    <section id="giai-phap" className={cn(WRAP, 'scroll-mt-24 py-16 sm:py-24')}>
      <Reveal className="max-w-[640px]">
        <div className="ds-label">Giải pháp</div>
        <h2 className={cn(H2, 'mt-3')}>Hợp với cách bạn kinh doanh</h2>
        <p className="mt-4 text-[15.5px] text-dim">Dù bạn là đội năm người hay chuỗi cửa hàng khắp cả nước, Mạch điều chỉnh theo quy trình của bạn — không phải ngược lại.</p>
      </Reveal>
      <Reveal delay={100} className="mt-8">
        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          <Segmented value={tab} onChange={setTab} options={Object.entries(SOLUTIONS).map(([value, x]) => ({ value, label: x.label, icon: x.icon }))} />
        </div>
        <div key={tab} className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr] animate-fade-in">
          <div className="card p-6 sm:p-8">
            <h3 className="text-[22px] sm:text-[26px] font-[500] tracking-[-0.02em]">{s.title}</h3>
            <p className="mt-3 text-[15px] text-dim max-w-xl">{s.desc}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {s.points.map((p) => (
                <li key={p} className="rounded-xl bg-subtle p-4 text-[13.5px] text-fg">
                  <Check size={16} className="text-brand-ink mb-2" strokeWidth={2.6} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-brand-50 to-gold-soft p-6 sm:p-8 flex flex-col justify-end min-h-[220px]">
            <s.icon size={128} strokeWidth={1} className="absolute -right-4 -top-4 text-brand-ink opacity-[.08]" aria-hidden />
            <div className="text-[44px] sm:text-[54px] font-[500] tracking-[-0.04em] leading-none text-brand-ink">{s.metric[0]}</div>
            <div className="mt-2 text-[14px] text-dim max-w-[240px]">{s.metric[1]}</div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------- Bảo mật ---------------- */
const SECURITY = [
  { icon: KeyRound, title: 'Xác thực hai lớp', desc: 'Mỗi lần đăng nhập và tạo lệnh chi đều cần OTP hoặc passkey trên thiết bị đã đăng ký.' },
  { icon: UsersRound, title: 'Phân quyền chi tiết', desc: 'Quản trị viên, kế toán, nhân viên hay quyền tuỳ chỉnh — ai thấy gì, chi được bao nhiêu đều do bạn đặt.' },
  { icon: Lock, title: 'Mã hoá toàn trình', desc: 'Dữ liệu được mã hoá khi truyền và khi lưu trữ; nhật ký hoạt động ghi lại mọi thao tác.' },
  { icon: Eye, title: 'Chỉ đọc theo mặc định', desc: 'Mạch kết nối ngân hàng qua chuẩn kết nối an toàn và không lưu mật khẩu ngân hàng. Lệnh chi luôn cần xác nhận trên ngân hàng của bạn.' },
]
function Security() {
  return (
    <section id="bao-mat" className={cn(WRAP, 'scroll-mt-24 py-10 sm:py-16')}>
      {/* dải màu ngọc đậm cố định ở cả hai chế độ (như mặt thẻ) */}
      <Reveal className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#082a20] via-[#0b3d2e] to-[#0f6e51] text-white px-6 py-12 sm:px-12 sm:py-16">
        <svg className="absolute -right-24 -bottom-24 w-[520px] opacity-[.12]" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth=".8" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => <circle key={i} cx="100" cy="100" r={12 + i * 8} />)}
        </svg>
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><ShieldCheck size={24} /></span>
            <h2 className="mt-5 text-[30px] sm:text-[38px] leading-[1.12] font-[500] tracking-[-0.03em]">Bảo mật ở mọi lớp, không đánh đổi sự tiện lợi</h2>
            <p className="mt-4 text-[15.5px] text-white/75 max-w-md">Mạch được thiết kế để bạn yên tâm giao quyền cho đội ngũ mà vẫn kiểm soát từng đồng ra vào.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SECURITY.map((s) => (
              <div key={s.title} className="rounded-2xl bg-white/[.06] ring-1 ring-white/10 p-5">
                <s.icon size={20} className="text-[#7fe0b9]" />
                <div className="mt-3 text-[15.5px] font-[600]">{s.title}</div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/70">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ---------------- Bảng giá ---------------- */
// mô tả gói theo vai trò phần mềm (Mạch kết nối ngân hàng, không tự phát hành thẻ hay giữ tiền)
const PLAN_FEATURES = {
  free: ['Kết nối 2 tài khoản ngân hàng', 'Theo dõi số dư & giao dịch', 'Xuất hoá đơn VietQR cơ bản', 'Báo cáo dòng tiền', 'Tối đa 3 thành viên'],
  growth: ['Kết nối ngân hàng không giới hạn', 'Quản lý thẻ doanh nghiệp', 'Ngân sách nhóm, hoàn ứng', 'Duyệt chi nhiều cấp', 'Đồng bộ MISA, hoá đơn điện tử', 'Trợ lý AI phân loại chi phí'],
}
function Pricing() {
  const [yearly, setYearly] = useState(false)
  return (
    <section id="bang-gia" className={cn(WRAP, 'scroll-mt-24 py-16 sm:py-24')}>
      <Reveal className="text-center max-w-[620px] mx-auto">
        <div className="ds-label">Bảng giá</div>
        <h2 className={cn(H2, 'mt-3')}>Minh bạch, không phí ẩn</h2>
        <p className="mt-4 text-[15.5px] text-dim">Bắt đầu miễn phí, nâng cấp khi đội ngũ của bạn lớn lên. Huỷ bất cứ lúc nào.</p>
        <div className="mt-6 inline-flex max-w-full overflow-x-auto no-scrollbar">
          <Segmented value={yearly ? 'y' : 'm'} onChange={(v) => setYearly(v === 'y')} options={[{ value: 'm', label: 'Theo tháng' }, { value: 'y', label: 'Theo năm · tiết kiệm 2 tháng' }]} />
        </div>
      </Reveal>
      <div className="mt-12 grid gap-5 lg:grid-cols-3 items-stretch">
        {PLANS.map((p, i) => {
          const hot = p.id === 'growth'
          const monthly = yearly ? Math.round((p.price * 10) / 12 / 1000) * 1000 : p.price
          return (
            <Reveal key={p.id} delay={i * 90} className="h-full">
              <div className={cn('relative h-full flex flex-col rounded-[24px] border p-6 sm:p-7 bg-surface',
                hot ? 'border-brand-400 ring-[4px] ring-brand-100 shadow-md' : 'border-line shadow-xs')}>
                {hot && <span className="absolute -top-3 left-7 rounded-full bg-brand-500 text-white dark:text-[#06140f] px-3 py-1 text-[11.5px] font-[650]">Phổ biến nhất</span>}
                <div className="ds-h2">{p.name}</div>
                <p className="ds-caption mt-1 text-[13px]">{p.tag}</p>
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-[38px] font-[500] tracking-[-0.035em] num">{formatNumber(monthly)}</span>
                  <span className="text-[16px] text-muted">₫</span>
                  <span className="text-[13.5px] text-muted">/tháng</span>
                </div>
                <div className="ds-caption min-h-5">{p.price === 0 ? 'Miễn phí mãi mãi' : yearly ? `Thanh toán ${formatNumber(p.price * 10)} ₫ mỗi năm` : 'Thanh toán hằng tháng'}</div>
                <Button to="/dang-ky" variant={hot ? 'primary' : 'outline'} size="lg" className="mt-6 w-full">
                  {p.price === 0 ? 'Bắt đầu miễn phí' : `Chọn gói ${p.name}`}
                </Button>
                <ul className="mt-7 flex flex-col gap-3 border-t border-line pt-6">
                  {(PLAN_FEATURES[p.id] || p.features).map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[14px] text-fg">
                      <Check size={16} strokeWidth={2.6} className="mt-0.5 shrink-0 text-brand-ink" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )
        })}
      </div>
      <p className="mt-6 text-center ds-caption">Giá chưa gồm VAT. Phí chuyển khoản (nếu có) do ngân hàng của bạn thu theo biểu phí riêng.</p>
    </section>
  )
}

/* ---------------- Cảm nhận khách hàng (nhân vật hư cấu) ---------------- */
const TESTIMONIALS = [
  { quote: 'Trước đây cuối tháng kế toán mất ba ngày gom chứng từ. Giờ hoá đơn VAT tự khớp vào giao dịch, chúng tôi chốt sổ trong một buổi sáng.', name: 'Ngô Bảo Trâm', title: 'Giám đốc tài chính', company: 'Công ty TNHH Hạt Mầm', color: '#6d8f3a' },
  { quote: 'Mỗi chiến dịch một thẻ ảo, hạn mức rõ ràng. Đội marketing chủ động hơn hẳn mà tôi vẫn ngủ ngon.', name: 'Lý Minh Đăng', title: 'Nhà sáng lập', company: 'CTCP Tre Việt Xanh', color: '#138f66' },
  { quote: 'Tám cửa hàng, tám mã VietQR, một màn hình dòng tiền. Đây là thứ chúng tôi tìm kiếm suốt hai năm.', name: 'Trương Văn Lộc', title: 'Chủ chuỗi', company: 'Nhà hàng Bếp Nhà Lá', color: '#3f8f8a' },
]
function Testimonials() {
  return (
    <section id="khach-hang" className="scroll-mt-24 border-y border-line bg-side py-16 sm:py-24">
      <div className={WRAP}>
        <Reveal className="max-w-[620px]">
          <div className="ds-label">Khách hàng nói gì</div>
          <h2 className={cn(H2, 'mt-3')}>Những đội ngũ đã chọn Mạch</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.name} delay={i * 90} className="h-full">
              <figure className="card h-full p-6 flex flex-col">
                <Quote size={22} className="text-brand-300" aria-hidden />
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-fg">“{t.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <Avatar name={t.name} color={t.color} size={38} />
                  <div className="min-w-0">
                    <div className="text-[14px] font-[600]">{t.name}</div>
                    <div className="ds-caption">{t.title} · {t.company}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- Hỏi đáp ---------------- */
const FAQ = [
  { q: 'Mạch có phải là ngân hàng không?', a: 'Không. Mạch là phần mềm quản lý tài chính. Tiền của bạn vẫn nằm ở ngân hàng của bạn; Mạch chỉ kết nối để hiển thị, đối soát và tạo lệnh chi. Bản demo này dùng dữ liệu mô phỏng.' },
  { q: 'Bắt đầu mất bao lâu?', a: 'Khoảng 10 phút: tạo không gian làm việc cho công ty, kết nối các tài khoản ngân hàng đang dùng và mời kế toán. Bạn không cần chuẩn bị giấy tờ gì.' },
  { q: 'Mạch kết nối được với ngân hàng nào?', a: 'Các ngân hàng phổ biến tại Việt Nam như Vietcombank, Techcombank, MB Bank, ACB, VPBank, BIDV, VietinBank… Mặc định Mạch chỉ đọc số dư và giao dịch; lệnh chi luôn cần bạn xác nhận trên ngân hàng của mình. Trong bản demo, việc kết nối là mô phỏng.' },
  { q: 'Chi phí sử dụng Mạch thế nào?', a: 'Gói Khởi đầu miễn phí. Gói Tăng trưởng và Doanh nghiệp tính phí thuê bao theo tháng hoặc theo năm, ghi rõ trong bảng giá, và được dùng thử miễn phí 30 ngày. Phí chuyển khoản (nếu có) do ngân hàng của bạn thu; Mạch không thu thêm.' },
  { q: 'Mạch có kết nối với phần mềm kế toán không?', a: 'Có. Giao dịch, chứng từ và hoá đơn điện tử có thể đồng bộ sang các phần mềm kế toán phổ biến, hoặc xuất theo mẫu sổ sách Thông tư 200.' },
  { q: 'Nhân viên có thể dùng thẻ mà không thấy số dư công ty?', a: 'Được. Với vai trò Nhân viên, mỗi người chỉ thấy thẻ của mình, hạn mức còn lại và các khoản hoàn ứng đã nộp.' },
]
function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section id="hoi-dap" className={cn(WRAP, 'scroll-mt-24 py-16 sm:py-24')}>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <div className="ds-label">Hỏi đáp</div>
          <h2 className={cn(H2, 'mt-3')}>Câu hỏi thường gặp</h2>
          <p className="mt-4 text-[15.5px] text-dim">Chưa thấy câu trả lời bạn cần? Đội hỗ trợ của Mạch trả lời trong giờ hành chính qua chat và email.</p>
        </Reveal>
        <Reveal delay={100} className="divide-y divide-line border-y border-line">
          {FAQ.map((f, i) => {
            const on = open === i
            return (
              <div key={f.q}>
                <h3>
                  <button id={`faq-q-${i}`} aria-expanded={on} aria-controls={`faq-a-${i}`} onClick={() => setOpen(on ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15.5px] font-[550] text-fg hover:text-brand-ink transition-colors">
                    {f.q}
                    <ChevronDown size={18} className={cn('shrink-0 text-muted transition-transform duration-200', on && 'rotate-180')} />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} hidden={!on}
                  className="pb-5 pr-8 text-[14.5px] leading-relaxed text-dim animate-fade-in">
                  {f.a}
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

/* ---------------- Kêu gọi cuối trang ---------------- */
function FinalCta() {
  return (
    <section className={cn(WRAP, 'pb-20 sm:pb-28')}>
      <Reveal className="relative overflow-hidden rounded-[32px] border border-line">
        <HillsArt className="absolute inset-0" sun={0.5} birds={false} />
        {/* lớp sương mờ sau chữ để luôn dễ đọc trên nền đồi */}
        <div className="absolute inset-0 bg-[radial-gradient(65%_60%_at_50%_45%,color-mix(in_srgb,var(--c-canvas)_78%,transparent),transparent)]" aria-hidden />
        <div className="relative px-5 pt-16 pb-24 sm:pt-24 sm:pb-36 text-center flex flex-col items-center">
          <h2 className="max-w-[720px] text-[32px] sm:text-[48px] leading-[1.08] font-[500] tracking-[-0.035em] text-fg">Tài chính doanh nghiệp, nhẹ nhàng như buổi sớm</h2>
          <p className="mt-4 max-w-[520px] text-[16px] text-dim">Kết nối ngân hàng và bắt đầu trong 10 phút. Dùng thử miễn phí, không cần thẻ thanh toán.</p>
          <EmailCta id="cta-email" className="mt-8 w-full" />
        </div>
      </Reveal>
    </section>
  )
}

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Mạch — Phần mềm quản lý tài chính doanh nghiệp'
    // hỗ trợ đường dẫn dạng /#bang-gia
    const id = window.location.hash.slice(1)
    if (id) setTimeout(() => scrollToId(id), 60)
  }, [])

  return (
    <div className="min-h-screen bg-canvas text-fg overflow-x-clip">
      <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-md">Bỏ qua tới nội dung</a>
      <AnnouncementBar onClick={() => scrollToId('ke-toan')} />
      <PublicNav />
      <main id="noi-dung">
        <Hero />
        <TrustStrip />
        <div id="san-pham" className="scroll-mt-20" />
        <Feature
          id="tai-khoan"
          icon={Landmark}
          eyebrow="Kết nối ngân hàng & quy tắc tự động"
          title="Kết nối mọi tài khoản ngân hàng của công ty"
          desc="Số dư và giao dịch từ mọi ngân hàng công ty đang dùng hiện về một màn hình. Đặt quy tắc để Mạch tự tạo lệnh chuyển giữa các tài khoản — lệnh vẫn được xác nhận trên ngân hàng của bạn."
          bullets={['Kết nối 40+ ngân hàng, chỉ đọc theo mặc định', 'Tổng hợp số dư theo thời gian thực, đối soát tự động', 'Quy tắc trích 10% mỗi khoản thu sang tài khoản dành nộp thuế']}
          mock={<AccountsMock />}
        />
        <Feature
          id="the"
          flip
          icon={CreditCard}
          eyebrow="Thẻ doanh nghiệp"
          title="Quản lý thẻ doanh nghiệp do ngân hàng của bạn phát hành"
          desc="Liên kết thẻ công ty để theo dõi chi tiêu theo từng người, từng việc. Đặt ngân sách, nhận cảnh báo khi sắp vượt hạn mức và yêu cầu khoá thẻ ngay khi cần."
          bullets={['Gán thẻ cho từng người, từng dự án', 'Ngân sách theo ngày, tháng hoặc từng giao dịch', 'Nhắc chụp hoá đơn ngay sau mỗi lần quẹt thẻ']}
          mock={<CardsMock />}
        />
        <Feature
          id="thanh-toan"
          icon={Send}
          eyebrow="Thanh toán hoá đơn & duyệt chi"
          title="Trả nhà cung cấp, không cần nhập tay"
          desc="Chuyển tiếp hoá đơn vào hộp thư của Mạch: số tiền, hạn thanh toán và số tài khoản được đọc tự động. Lệnh chi được gửi qua ngân hàng của bạn, duyệt nhiều cấp."
          bullets={['Đọc hoá đơn PDF và ảnh chụp bằng AI', 'Duyệt chi theo số tiền, phòng ban hoặc nhà cung cấp', 'Hẹn lịch thanh toán, tự lặp lại hằng tháng']}
          mock={<BillsMock />}
        />
        <Feature
          id="hoa-don"
          flip
          icon={FileText}
          eyebrow="Xuất hoá đơn & VietQR"
          title="Gửi hoá đơn, nhận tiền qua VietQR"
          desc="Tạo hoá đơn có VAT trong một phút. Khách quét mã VietQR bằng bất kỳ ứng dụng ngân hàng nào; tiền về tài khoản của bạn là hoá đơn tự đánh dấu đã thanh toán."
          bullets={['Mỗi hoá đơn một mã QR kèm sẵn số tiền và nội dung', 'Nhắc nợ tự động trước và sau hạn', 'Hoá đơn định kỳ cho hợp đồng duy trì']}
          mock={<InvoiceMock />}
        />
        <Feature
          id="ke-toan"
          icon={BookOpen}
          eyebrow="Kế toán & Trợ lý AI"
          title="Sổ sách gọn gàng trước cả khi kế toán hỏi"
          desc="Trợ lý AI tự phân loại chi phí, đọc hoá đơn VAT, nhắc thiếu chứng từ và trả lời mọi câu hỏi về dòng tiền bằng tiếng Việt."
          bullets={['Phân loại chi phí theo hệ thống tài khoản của bạn', 'Khớp hoá đơn điện tử với từng giao dịch', 'Đồng bộ sang phần mềm kế toán chỉ với một lần bấm']}
          mock={<AssistantMock />}
        />
        <StatsBand />
        <Solutions />
        <Security />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <PublicFooter />
    </div>
  )
}
