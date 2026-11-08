/* ==========================================================
   Cài đặt — /cai-dat và /cai-dat/:section
   Mỗi mục nằm trong một tệp riêng cùng thư mục.
   ========================================================== */
import { NavLink, useParams } from 'react-router-dom'
import { Building2, Users, ShieldCheck, Plug, Bell, Lock, Crown, UserRound, Palette } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PageHeader } from '@/components/ui'
import { CompanySection } from './CompanySection'
import { TeamSection } from './TeamSection'
import { ApprovalsSection } from './ApprovalsSection'
import { IntegrationsSection } from './IntegrationsSection'
import { NotificationsSection } from './NotificationsSection'
import { SecuritySection } from './SecuritySection'
import { PlanSection } from './PlanSection'
import { ProfileSection } from './ProfileSection'
import { AppearanceSection } from './AppearanceSection'

const SECTIONS = [
  { slug: '', label: 'Hồ sơ công ty', icon: Building2, group: 'Công ty', Comp: CompanySection },
  { slug: 'thanh-vien', label: 'Thành viên & phân quyền', icon: Users, group: 'Công ty', Comp: TeamSection },
  { slug: 'duyet-chi', label: 'Quy tắc duyệt chi', icon: ShieldCheck, group: 'Công ty', Comp: ApprovalsSection },
  { slug: 'tich-hop', label: 'Tích hợp', icon: Plug, group: 'Công ty', Comp: IntegrationsSection },
  { slug: 'goi-dich-vu', label: 'Gói dịch vụ', icon: Crown, group: 'Công ty', Comp: PlanSection },
  { slug: 'ho-so', label: 'Hồ sơ cá nhân', icon: UserRound, group: 'Cá nhân', Comp: ProfileSection },
  { slug: 'bao-mat', label: 'Bảo mật', icon: Lock, group: 'Cá nhân', Comp: SecuritySection },
  { slug: 'thong-bao', label: 'Thông báo', icon: Bell, group: 'Cá nhân', Comp: NotificationsSection },
  { slug: 'giao-dien', label: 'Giao diện', icon: Palette, group: 'Cá nhân', Comp: AppearanceSection },
]
const GROUPS = ['Công ty', 'Cá nhân']

function NavItem({ s, mobile }) {
  const Icon = s.icon
  return (
    <NavLink
      to={s.slug ? `/cai-dat/${s.slug}` : '/cai-dat'}
      end
      className={({ isActive }) => cn(
        'flex items-center gap-2.5 rounded-[10px] text-[13.5px] font-[550] transition-colors whitespace-nowrap shrink-0',
        mobile ? 'h-8 px-3 border' : 'h-9 px-2.5',
        isActive
          ? mobile ? 'bg-fg text-canvas border-fg' : 'bg-hover text-fg'
          : mobile ? 'border-line text-dim hover:bg-subtle' : 'text-dim hover:bg-hover hover:text-fg',
      )}
    >
      {({ isActive }) => (
        <>
          {!mobile && <Icon size={16} className={isActive ? 'text-fg' : 'text-muted'} />}
          {s.label}
        </>
      )}
    </NavLink>
  )
}

export default function SettingsPage() {
  const { section = '' } = useParams()
  const current = SECTIONS.find((s) => s.slug === section) || SECTIONS[0]
  const Comp = current.Comp

  return (
    <div>
      <PageHeader title="Cài đặt" desc="Quản lý thông tin công ty, thành viên, bảo mật và cách Mạch làm việc với bạn." />

      {/* Thanh mục cuộn ngang trên điện thoại / máy tính bảng */}
      <nav aria-label="Mục cài đặt" className="lg:hidden -mx-4 sm:-mx-6 px-4 sm:px-6 mb-6 flex gap-2 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => <NavItem key={s.slug} s={s} mobile />)}
      </nav>

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-8 xl:gap-12 items-start">
        <nav aria-label="Mục cài đặt" className="hidden lg:flex flex-col gap-5 sticky top-20">
          {GROUPS.map((g) => (
            <div key={g}>
              <div className="ds-label px-2.5 mb-1.5">{g}</div>
              <div className="flex flex-col gap-0.5">
                {SECTIONS.filter((s) => s.group === g).map((s) => <NavItem key={s.slug} s={s} />)}
              </div>
            </div>
          ))}
        </nav>
        <div key={current.slug} className="min-w-0 animate-fade-in">
          <Comp />
        </div>
      </div>
    </div>
  )
}
