import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ChevronRight, CreditCard, Layers, Wallet, Users, Archive, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY } from '@/lib/format'
import { sum } from '@/lib/selectors'
import { useBank } from '@/store'
import {
  PageHeader, Button, Card, Tabs, Money, Progress, AvatarStack, Avatar, Badge, Table, THead, Th, Tr, Td, EmptyState,
} from '@/components/ui'
import { BudgetIcon } from '@/features/spend/BudgetBits'
import { CreateBudgetFlow } from '@/features/spend/CreateBudgetFlow'
import { PERIOD_LABEL, periodRange, usagePct, usageTone } from '@/features/spend/budgetUtils'

const ROW_GRID = 'md:grid-cols-[40px_minmax(0,1.4fr)_120px_minmax(0,1.3fr)_20px]'

/* ---------- Dải tóm tắt ---------- */
function Summary({ budgets, reimbursements }) {
  const active = budgets.filter((b) => b.status === 'active')
  const limit = sum(active, (b) => b.limit)
  const spent = sum(active, (b) => b.spent)
  const pending = reimbursements.filter((r) => r.status === 'pending')
  return (
    <Card className="grid sm:grid-cols-3 sm:divide-x divide-line" padded={false}>
      <div className="p-5">
        <div className="text-[13px] text-muted">Ngân sách đã cấp kỳ này</div>
        <Money value={limit} className="block mt-1 text-[24px] font-[500] tracking-tight" />
        <div className="ds-caption mt-0.5">{active.length} ngân sách đang hoạt động</div>
      </div>
      <div className="p-5 border-t border-line sm:border-t-0">
        <div className="text-[13px] text-muted">Đã chi</div>
        <Money value={spent} className="block mt-1 text-[24px] font-[500] tracking-tight" />
        <Progress value={spent} max={limit} className="mt-2.5" />
        <div className="ds-caption mt-1.5">{limit ? Math.round((spent / limit) * 100) : 0}% tổng hạn mức</div>
      </div>
      <Link to="/hoan-ung" className="group p-5 border-t border-line sm:border-t-0 hover:bg-subtle rounded-b-2xl sm:rounded-bl-none sm:rounded-r-2xl transition-colors">
        <div className="flex items-center justify-between text-[13px] text-muted">
          Hoàn ứng chờ duyệt <ChevronRight size={16} className="text-faint group-hover:text-fg transition-colors" />
        </div>
        <div className="mt-1 text-[24px] font-[500] tracking-tight num">{pending.length} <span className="text-[15px] text-muted font-normal">yêu cầu</span></div>
        <div className="ds-caption mt-0.5">Tổng <Money value={sum(pending, (r) => r.amount)} /></div>
      </Link>
    </Card>
  )
}

/* ---------- Một dòng ngân sách ---------- */
function BudgetRow({ b, team }) {
  const pct = usagePct(b)
  const tone = usageTone(pct)
  const people = team.filter((m) => b.members.includes(m.id))
  return (
    <Link to={`/chi-tieu-nhom/${b.id}`}
      className={cn('group grid grid-cols-[40px_1fr] items-center gap-x-4 gap-y-3 px-5 py-4 border-b border-line last:border-0 hover:bg-subtle transition-colors', ROW_GRID)}>
      <BudgetIcon icon={b.icon} color={b.color} size={40} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[14.5px] font-[550] truncate">{b.name}</span>
          {b.status === 'draft' && <Badge size="sm">Bản nháp</Badge>}
          {b.status === 'archived' && <Badge size="sm">Đã lưu trữ</Badge>}
        </div>
        <div className="ds-caption truncate">{PERIOD_LABEL[b.period]} · {periodRange(b).label}</div>
      </div>
      <div className="hidden md:block"><AvatarStack people={people} max={3} size={24} /></div>
      <div className="col-span-2 md:col-span-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="min-w-0 truncate"><Money value={b.spent} className="font-[550] text-fg" /> <span className="text-muted">/ <Money value={b.limit} /></span></span>
          <span className={cn('num font-[550]', tone === 'neg' ? 'text-neg' : tone === 'warn' ? 'text-warn' : 'text-muted')}>{pct}%</span>
        </div>
        <Progress value={b.spent} max={b.limit} className="mt-2" />
      </div>
      <ChevronRight size={18} className="hidden md:block text-faint group-hover:text-fg transition-colors" />
    </Link>
  )
}

/* ---------- Giới thiệu khi chưa có ngân sách ---------- */
function Intro({ onCreate }) {
  const steps = [
    { icon: Layers, title: 'Tạo ngân sách', desc: 'Đặt hạn mức theo tháng, quý hoặc theo dự án.' },
    { icon: Users, title: 'Thêm thành viên', desc: 'Chọn ai được chi và hạn mức riêng cho từng người.' },
    { icon: CreditCard, title: 'Chi bằng một thẻ', desc: 'Mỗi giao dịch tự vào đúng ngân sách, kèm chứng từ.' },
  ]
  return (
    <Card className="relative overflow-hidden p-8 sm:p-12 text-center">
      <div className="absolute inset-0 dot-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
      <div className="relative">
        <div className="mx-auto flex items-end justify-center gap-3 h-24" aria-hidden>
          {[['Plane', '#59a7b8', -8], ['Megaphone', '#c2588a', 0], ['Coffee', '#d99a2b', 8]].map(([icon, color, r], i) => (
            <div key={icon} className={cn('card shadow-sm p-2.5', i === 1 && 'mb-5')} style={{ transform: `rotate(${r}deg)` }}>
              <BudgetIcon icon={icon} color={color} size={i === 1 ? 46 : 38} />
            </div>
          ))}
        </div>
        <h2 className="ds-h1 mt-6">Một thẻ, nhiều ngân sách</h2>
        <p className="text-muted mt-2 max-w-lg mx-auto">Chia tiền chi tiêu theo nhóm và mục đích. Thành viên tự chủ chi tiêu, bạn vẫn nắm rõ từng đồng.</p>
        <div className="mt-8 grid sm:grid-cols-3 gap-3 text-left">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="size-6 rounded-full bg-brand-500 text-white dark:text-[#06140f] grid place-items-center text-[12px] font-[650]">{i + 1}</span>
                <s.icon size={17} className="text-muted" />
              </div>
              <div className="mt-3 text-[14px] font-[600]">{s.title}</div>
              <div className="ds-caption mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>
        <Button variant="primary" size="lg" icon={Plus} className="mt-8" onClick={onCreate}>Tạo ngân sách đầu tiên</Button>
      </div>
    </Card>
  )
}

/* ---------- Bảng thành viên ---------- */
function MembersTable({ team, budgets, cards, transactions }) {
  const navigate = useNavigate()
  const rows = useMemo(() => {
    const y = TODAY.getFullYear(), mo = TODAY.getMonth()
    return team.map((m) => {
      const joined = budgets.filter((b) => b.status !== 'archived' && b.members.includes(m.id))
      const mine = cards.filter((c) => c.member === m.id && c.status !== 'cancelled')
      const spent = sum(transactions.filter((t) => {
        if (t.member !== m.id || t.amount >= 0 || t.status === 'failed') return false
        const d = new Date(t.date)
        return d.getFullYear() === y && d.getMonth() === mo
      }), (t) => -t.amount)
      return { m, joined, mine, spent }
    }).sort((a, b) => b.spent - a.spent)
  }, [team, budgets, cards, transactions])

  return (
    <Card padded={false}>
      <Table minWidth={760}>
        <THead>
          <Th>Thành viên</Th>
          <Th>Ngân sách tham gia</Th>
          <Th>Thẻ</Th>
          <Th align="right">Đã chi tháng này</Th>
        </THead>
        <tbody>
          {rows.map(({ m, joined, mine, spent }) => (
            <Tr key={m.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={m.name} color={m.color} size={32} />
                  <div className="min-w-0">
                    <div className="font-[550] truncate">{m.name}{m.id === 'u1' && <span className="text-muted font-normal"> (bạn)</span>}</div>
                    <div className="ds-caption truncate">{m.title}{m.status === 'invited' ? ' · Đã mời' : ''}</div>
                  </div>
                </div>
              </Td>
              <Td>
                {joined.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {joined.slice(0, 3).map((b) => (
                      <button key={b.id} onClick={() => navigate(`/chi-tieu-nhom/${b.id}`)}
                        className="inline-flex items-center gap-1.5 h-6 rounded-md border border-line px-1.5 text-[12px] text-dim hover:bg-subtle">
                        <span className="size-2 rounded-full" style={{ background: b.color }} />{b.name}
                      </button>
                    ))}
                    {joined.length > 3 && <Badge size="sm">+{joined.length - 3}</Badge>}
                  </div>
                ) : <span className="text-faint">—</span>}
              </Td>
              <Td>
                {mine.length
                  ? <span className="inline-flex items-center gap-1.5 text-dim num"><CreditCard size={14} className="text-faint" />{mine.map((c) => '••' + c.last4).join(', ')}</span>
                  : <span className="text-faint">Chưa có thẻ</span>}
              </Td>
              <Td align="right"><Money value={spent} className={cn('font-[550]', !spent && 'text-faint')} /></Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

export default function TeamSpendPage() {
  const { budgets, team, cards, transactions, reimbursements } = useBank()
  const [tab, setTab] = useState('budgets')
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const live = budgets.filter((b) => b.status !== 'archived')
  const archived = budgets.filter((b) => b.status === 'archived')
  const sorted = [...live].sort((a, b) => (a.status === 'draft') - (b.status === 'draft') || usagePct(b) - usagePct(a))

  return (
    <div>
      <PageHeader
        title="Chi tiêu nhóm"
        desc="Cấp ngân sách cho từng nhóm, theo dõi chi tiêu và chứng từ theo thời gian thực."
        actions={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo ngân sách</Button>}
      />

      {live.length === 0 && archived.length === 0 ? (
        <Intro onCreate={() => setCreating(true)} />
      ) : (
        <div className="flex flex-col gap-6">
          <Summary budgets={budgets} reimbursements={reimbursements} />
          <Tabs value={tab} onChange={setTab} options={[
            { value: 'budgets', label: 'Ngân sách', count: live.length },
            { value: 'members', label: 'Thành viên', count: team.length },
          ]} />
          {tab === 'budgets' ? (
            <div className="flex flex-col gap-4">
              {live.length ? (
                <Card padded={false} className="overflow-hidden">
                  <div className={cn('hidden md:grid gap-x-4 px-5 h-10 items-center border-b border-line text-[12.5px] font-[550] text-muted', ROW_GRID)}>
                    <span /><span>Ngân sách</span><span>Thành viên</span><span>Đã chi / hạn mức</span><span />
                  </div>
                  {sorted.map((b) => <BudgetRow key={b.id} b={b} team={team} />)}
                </Card>
              ) : (
                <Card><EmptyState icon={Wallet} title="Chưa có ngân sách đang hoạt động" desc="Tạo ngân sách mới hoặc mở lại một ngân sách đã lưu trữ."
                  action={<Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo ngân sách</Button>} /></Card>
              )}
              {archived.length > 0 && (
                <div>
                  <button onClick={() => setShowArchived(!showArchived)} aria-expanded={showArchived}
                    className="inline-flex items-center gap-1.5 text-[13px] font-[550] text-muted hover:text-fg">
                    <Archive size={15} />Đã lưu trữ ({archived.length})
                    <ChevronDown size={15} className={cn('transition-transform', showArchived && 'rotate-180')} />
                  </button>
                  {showArchived && (
                    <Card padded={false} className="mt-3 overflow-hidden animate-fade-in">
                      {archived.map((b) => <BudgetRow key={b.id} b={b} team={team} />)}
                    </Card>
                  )}
                </div>
              )}
            </div>
          ) : (
            <MembersTable team={team} budgets={budgets} cards={cards} transactions={transactions} />
          )}
        </div>
      )}

      {creating && <CreateBudgetFlow onClose={() => setCreating(false)} />}
    </div>
  )
}
