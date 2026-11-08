import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, CreditCard } from 'lucide-react'
import { formatPercent, TODAY } from '@/lib/format'
import { sum } from '@/lib/selectors'
import { useBank } from '@/store'
import { CARD_STATUS } from '@/data/spend'
import {
  PageHeader, Button, Card, Money, Tabs, SearchInput, Select, Table, THead, Th, Tr, Td, Avatar, StatusBadge, Progress, EmptyState,
} from '@/components/ui'
import { CardThumb } from '@/features/cards/CardThumb'
import { CardDrawer } from '@/features/cards/CardDrawer'
import { CreateCardFlow } from '@/features/cards/CreateCardFlow'

const TABS = {
  all: () => true,
  virtual: (c) => c.type === 'virtual' && c.status !== 'cancelled',
  physical: (c) => c.type === 'physical' && c.status !== 'cancelled',
  inactive: (c) => c.status !== 'active',
}

function Summary({ cards, transactions, credit }) {
  const monthSpend = useMemo(() => sum(
    transactions.filter((t) => {
      if (t.method !== 'card' || t.status === 'failed' || t.amount >= 0) return false
      const d = new Date(t.date)
      return d.getMonth() === TODAY.getMonth() && d.getFullYear() === TODAY.getFullYear()
    }),
    (t) => -t.amount,
  ), [transactions])
  const active = cards.filter((c) => c.status === 'active')
  return (
    <Card padded={false} className="grid sm:grid-cols-3 mb-6">
      <div className="px-5 py-4 sm:py-5 border-b sm:border-b-0 sm:border-r border-line">
        <div className="text-[13px] text-muted">Chi trên thẻ tháng {TODAY.getMonth() + 1}</div>
        <Money value={monthSpend} className="block mt-1 text-[24px] font-[500] tracking-tight" />
        <div className="ds-caption mt-1">Tính đến {TODAY.getDate()}/{TODAY.getMonth() + 1}, gồm giao dịch đang xử lý</div>
      </div>
      <div className="px-5 py-4 sm:py-5 border-b sm:border-b-0 sm:border-r border-line">
        <div className="text-[13px] text-muted">Thẻ đang hoạt động</div>
        <div className="mt-1 text-[24px] font-[500] tracking-tight num">{active.length}<span className="text-faint text-[16px]"> / {cards.length}</span></div>
        <div className="ds-caption mt-1">{active.filter((c) => c.type === 'virtual').length} thẻ ảo · {active.filter((c) => c.type === 'physical').length} thẻ vật lý</div>
      </div>
      <div className="px-5 py-4 sm:py-5">
        <div className="text-[13px] text-muted">Hoàn tiền đã nhận</div>
        <Money value={credit.cashbackEarned} className="block mt-1 text-[24px] font-[500] tracking-tight text-pos" />
        <div className="ds-caption mt-1">{formatPercent(credit.cashback)} trên mọi giao dịch thẻ</div>
      </div>
    </Card>
  )
}

export default function CardsPage() {
  const cards = useBank((s) => s.cards)
  const team = useBank((s) => s.team)
  const transactions = useBank((s) => s.transactions)
  const credit = useBank((s) => s.credit)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')
  const [member, setMember] = useState('')
  const [openId, setOpenId] = useState(null)
  const [creatingLocal, setCreatingLocal] = useState(false)
  const creating = creatingLocal || params.get('tao') === '1'

  const closeCreate = () => {
    setCreatingLocal(false)
    if (params.has('tao')) { const p = new URLSearchParams(params); p.delete('tao'); setParams(p, { replace: true }) }
  }

  const counts = Object.fromEntries(Object.entries(TABS).map(([k, f]) => [k, cards.filter(f).length]))
  const list = cards.filter((c) => {
    if (!TABS[tab](c)) return false
    if (member && c.member !== member) return false
    if (q) {
      const holder = team.find((m) => m.id === c.member)?.name || ''
      const hay = `${c.nickname} ${c.last4} ${holder}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const filtered = q || member

  return (
    <div>
      <PageHeader title="Thẻ" desc="Thẻ ảo và thẻ vật lý cho từng thành viên, từng mục đích chi tiêu."
        actions={<Button variant="primary" icon={Plus} onClick={() => setCreatingLocal(true)}>Tạo thẻ</Button>} />

      <Summary cards={cards} transactions={transactions} credit={credit} />

      <Tabs className="mb-4" value={tab} onChange={setTab} options={[
        { value: 'all', label: 'Tất cả', count: counts.all },
        { value: 'virtual', label: 'Thẻ ảo', count: counts.virtual },
        { value: 'physical', label: 'Thẻ vật lý', count: counts.physical },
        { value: 'inactive', label: 'Đã khoá / huỷ', count: counts.inactive },
      ]} />

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên thẻ, 4 số cuối, người dùng" className="sm:max-w-[340px]" />
        <Select size="sm" aria-label="Lọc theo thành viên" value={member} onChange={(e) => setMember(e.target.value)} className="sm:w-[220px] [&>div]:h-9"
          placeholder="Tất cả thành viên" options={team.map((m) => ({ value: m.id, label: m.name }))} />
      </div>

      <Card padded={false}>
        {list.length === 0 ? (
          <EmptyState icon={CreditCard}
            title={filtered ? 'Không có thẻ phù hợp' : tab === 'inactive' ? 'Không có thẻ nào bị khoá hay huỷ' : 'Chưa có thẻ nào'}
            desc={filtered ? 'Thử đổi từ khoá hoặc bộ lọc thành viên.' : 'Tạo thẻ ảo trong vài giây cho quảng cáo, phần mềm hay công tác phí.'}
            action={filtered
              ? <Button variant="secondary" onClick={() => { setQ(''); setMember('') }}>Xoá bộ lọc</Button>
              : <Button variant="primary" icon={Plus} onClick={() => setCreatingLocal(true)}>Tạo thẻ</Button>} />
        ) : (
          <Table minWidth={860}>
            <THead>
              <Th>Thẻ</Th>
              <Th>Người dùng</Th>
              <Th>Loại</Th>
              <Th width={230}>Đã chi / hạn mức</Th>
              <Th>Chu kỳ</Th>
              <Th>Trạng thái</Th>
            </THead>
            <tbody>
              {list.map((c) => {
                const holder = team.find((m) => m.id === c.member)
                return (
                  <Tr key={c.id} onClick={() => setOpenId(c.id)} selected={openId === c.id}>
                    <Td>
                      <button type="button" className="flex items-center gap-3 text-left min-w-0" onClick={(e) => { e.stopPropagation(); setOpenId(c.id) }}
                        aria-label={`Xem chi tiết thẻ ${c.nickname} ••${c.last4}`}>
                        <CardThumb card={c} />
                        <span className="min-w-0">
                          <span className="block font-[550] truncate max-w-[220px]">{c.nickname}</span>
                          <span className="block ds-caption num">•••• {c.last4}</span>
                        </span>
                      </button>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-2 min-w-0">
                        <Avatar name={holder?.name || '?'} color={holder?.color} size={24} />
                        <span className="truncate">{holder?.name || '—'}</span>
                      </span>
                    </Td>
                    <Td className="text-dim">{c.type === 'virtual' ? 'Thẻ ảo' : 'Thẻ vật lý'}</Td>
                    <Td>
                      <div className="flex flex-col gap-1.5 pr-2">
                        <span className="text-[13px]"><Money value={c.spent} className="font-[550]" /> <span className="text-faint">/</span> <Money value={c.limit} className="text-muted" /></span>
                        <Progress value={c.spent} max={c.limit} height={4} />
                      </div>
                    </Td>
                    <Td className="text-dim">{c.period}</Td>
                    <Td><StatusBadge map={CARD_STATUS} value={c.status} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <CardDrawer id={openId} onClose={() => setOpenId(null)} />
      {creating && <CreateCardFlow open onClose={closeCreate} onCreated={(card) => setOpenId(card.id)} />}
    </div>
  )
}
