import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CheckCircle2, Tags, Receipt, AlarmClock, ShieldCheck, ListChecks, Check, CalendarClock, ArrowRight, PartyPopper, RotateCcw, Circle, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { daysBetween, formatDate, formatRelative, TODAY } from '@/lib/format'
import { useBank, toast } from '@/store'
import { DONE_TASKS } from '@/data/workspace'
import { PageHeader, Card, Button, Badge, Tabs, Progress, EmptyState } from '@/components/ui'
import { useLinked } from '@/features/accounts/linkedStore'

/* Danh sách việc đã xong — lưu trong trình duyệt, khởi tạo từ dữ liệu mẫu */
const useDone = create(
  persist(
    (set) => ({
      items: DONE_TASKS,
      push: (item) => set((s) => ({ items: [item, ...s.items] })),
      drop: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'mach-tasks-done' },
  ),
)

const KIND = {
  approve: { icon: CheckCircle2, tone: 'bg-brand-50 text-brand-ink', action: 'Xem và duyệt' },
  categorize: { icon: Tags, tone: 'bg-info-soft text-info', action: 'Phân loại' },
  receipt: { icon: Receipt, tone: 'bg-gold-soft text-gold', action: 'Bổ sung chứng từ' },
  overdue: { icon: AlarmClock, tone: 'bg-neg-soft text-neg', action: 'Gửi nhắc thanh toán' },
  security: { icon: ShieldCheck, tone: 'bg-subtle text-dim', action: 'Mở cài đặt' },
}
const PRIORITY = {
  high: { label: 'Ưu tiên cao', tone: 'neg' },
  medium: { label: 'Trung bình', tone: 'warn' },
  low: { label: 'Thấp', tone: 'neutral' },
}
const ORDER = { high: 0, medium: 1, low: 2 }

function DueLabel({ due }) {
  if (!due) return <span className="ds-caption">Không có hạn</span>
  const diff = daysBetween(TODAY, due)
  const late = diff < 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12.5px]', late ? 'text-neg font-[550]' : diff <= 2 ? 'text-warn font-[550]' : 'text-muted')} title={formatDate(due)}>
      <CalendarClock size={13} />
      {late ? `Quá hạn · ${formatRelative(due)}` : diff === 0 ? 'Hạn hôm nay' : `Hạn: ${formatRelative(due)}`}
    </span>
  )
}

function TaskRow({ task, onDone }) {
  const navigate = useNavigate()
  const K = KIND[task.kind] || KIND.approve
  const P = PRIORITY[task.priority] || PRIORITY.low
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 border-b border-line last:border-0 animate-fade-in">
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <span className={cn('size-10 shrink-0 grid place-items-center rounded-xl', K.tone)}><K.icon size={19} /></span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-[600]">{task.title}</span>
            <Badge size="sm" tone={P.tone}>{P.label}</Badge>
          </div>
          <p className="text-[13.5px] text-dim mt-0.5">{task.desc}</p>
          <div className="mt-1.5"><DueLabel due={task.due} /></div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 pl-[54px] sm:pl-0">
        <Button variant="ghost" size="sm" icon={Check} onClick={() => onDone(task)}>Đánh dấu xong</Button>
        <Button variant="primary" size="sm" iconRight={ArrowRight} onClick={() => navigate(task.to)}>{K.action}</Button>
      </div>
    </div>
  )
}

function SetupChecklist() {
  const navigate = useNavigate()
  const rules = useBank((s) => s.rules)
  const tasks = useBank((s) => s.tasks)
  const linked = useLinked((s) => s.items)
  const steps = [
    { label: 'Xác minh danh tính chủ sở hữu', done: true },
    { label: 'Kết nối tài khoản ngân hàng chính', done: true },
    { label: 'Mời thành viên vào công ty', done: true },
    { label: 'Kết nối phần mềm kế toán', done: true },
    { label: 'Tự động trích tiền thuế', done: rules.some((r) => r.type === 'percent' && r.active), to: '/tai-khoan?tab=quy-tac' },
    { label: 'Liên kết ngân hàng khác', done: linked.length > 0, to: '/tai-khoan?tab=lien-ket' },
    { label: 'Bật xác thực hai lớp cho mọi thành viên', done: !tasks.some((t) => t.kind === 'security'), to: '/cai-dat/thanh-vien' },
  ]
  const n = steps.filter((s) => s.done).length
  const all = n === steps.length
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="ds-h3">{all ? 'Thiết lập đã hoàn tất' : 'Hoàn thiện thiết lập'}</h3>
          <p className="ds-caption mt-0.5">{all ? 'Công ty của bạn đã sẵn sàng vận hành trên Mạch.' : 'Vài bước nữa để Mạch tự động hoá trọn vẹn.'}</p>
        </div>
        <span className="num text-[13px] font-[600] text-dim shrink-0">{n}/{steps.length}</span>
      </div>
      <Progress value={n} max={steps.length} auto={false} tone="pos" className="mt-4" />
      <ul className="mt-4 flex flex-col -mx-2">
        {steps.map((s) => (
          <li key={s.label}>
            <button type="button" disabled={s.done} onClick={() => s.to && navigate(s.to)}
              className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13.5px] enabled:hover:bg-subtle disabled:cursor-default">
              {s.done
                ? <span className="size-5 rounded-full bg-pos text-white dark:text-[#06140f] grid place-items-center shrink-0"><Check size={12} strokeWidth={3} /></span>
                : <Circle size={20} className="text-line-strong shrink-0" />}
              <span className={cn('flex-1', s.done ? 'text-muted line-through decoration-faint' : 'text-fg font-[520]')}>{s.label}</span>
              {!s.done && <ChevronRight size={15} className="text-faint" />}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function TasksPage() {
  const tasks = useBank((s) => s.tasks)
  const { add, remove } = useBank()
  const done = useDone((s) => s.items)
  const { push, drop } = useDone()
  const [tab, setTab] = useState('open')

  const sorted = [...tasks].sort((a, b) => ORDER[a.priority] - ORDER[b.priority] || (a.due || '9999').localeCompare(b.due || '9999'))
  const urgent = tasks.filter((t) => t.priority === 'high').length

  const markDone = (task) => {
    remove('tasks', task.id)
    push({ id: task.id, title: task.title, doneAt: TODAY.toISOString(), task })
    toast({
      title: 'Đã đánh dấu xong', desc: task.title,
      action: { label: 'Hoàn tác', onClick: () => reopen(task.id, task) },
    })
  }
  const reopen = (id, task) => {
    drop(id)
    if (task && !useBank.getState().tasks.some((t) => t.id === task.id)) add('tasks', task, { prepend: false })
  }

  return (
    <div>
      <PageHeader title="Việc cần làm"
        desc={tasks.length ? `Bạn có ${tasks.length} việc cần xử lý${urgent ? `, trong đó ${urgent} việc ưu tiên cao` : ''}.` : 'Mọi việc đã được xử lý. Mạch sẽ báo khi có việc mới.'} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
        <div className="min-w-0">
          <Tabs className="mb-4" value={tab} onChange={setTab} options={[
            { value: 'open', label: 'Cần xử lý', count: tasks.length },
            { value: 'done', label: 'Đã xong', count: done.length },
          ]} />

          {tab === 'open' && (
            sorted.length ? (
              <Card padded={false}>
                {sorted.map((t) => <TaskRow key={t.id} task={t} onDone={markDone} />)}
              </Card>
            ) : (
              <Card className="overflow-hidden relative">
                <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" aria-hidden />
                <div className="relative flex flex-col items-center text-center py-14 px-6">
                  <span className="size-16 rounded-2xl bg-brand-50 text-brand-ink grid place-items-center mb-4 animate-pop-in"><PartyPopper size={30} /></span>
                  <h2 className="ds-h2">Xong hết rồi!</h2>
                  <p className="text-muted mt-1.5 max-w-sm">Bạn đã xử lý mọi việc cần làm. Hãy tận hưởng một tách cà phê — Mạch sẽ báo ngay khi có việc mới.</p>
                  <Button variant="outline" className="mt-5" onClick={() => setTab('done')}>Xem việc đã xong</Button>
                </div>
              </Card>
            )
          )}

          {tab === 'done' && (
            done.length ? (
              <Card padded={false}>
                {done.map((d) => (
                  <div key={d.id} className="flex items-center gap-3.5 px-5 py-3.5 border-b border-line last:border-0 animate-fade-in">
                    <span className="size-8 shrink-0 rounded-full bg-pos-soft text-pos grid place-items-center"><Check size={16} strokeWidth={2.6} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] text-dim truncate">{d.title}</div>
                      <div className="ds-caption">Hoàn thành {formatRelative(d.doneAt).toLowerCase() === 'hôm nay' ? 'hôm nay' : `ngày ${formatDate(d.doneAt)}`}</div>
                    </div>
                    {d.task && (
                      <Button variant="ghost" size="sm" icon={RotateCcw} onClick={() => { reopen(d.id, d.task); toast({ title: 'Đã mở lại việc', desc: d.title }) }}>Mở lại</Button>
                    )}
                  </div>
                ))}
              </Card>
            ) : (
              <Card><EmptyState icon={ListChecks} title="Chưa có việc nào hoàn thành" desc="Việc bạn đánh dấu xong sẽ được lưu ở đây." /></Card>
            )
          )}
        </div>

        <SetupChecklist />
      </div>
    </div>
  )
}
