import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronRight, Pencil, Archive, UserPlus, UserMinus, CreditCard, Plus, ArchiveRestore, SearchX } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatVND, TODAY } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import {
  Card, CardHeader, Button, Badge, Money, Progress, KeyValue, Avatar, IconButton, Confirm, EmptyState, PaymentCard,
  Table, THead, Th, Tr, Td, CategoryTag,
} from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { TxList } from '@/features/transactions/TxList'
import { TxDrawer } from '@/features/transactions/TxDrawer'
import { BudgetIcon } from '@/features/spend/BudgetBits'
import { BudgetEditModal, AddMembersModal } from '@/features/spend/BudgetModals'
import { PERIOD_LABEL, periodRange, periodRemaining, usagePct, usageTone, budgetCards, budgetTransactions, budgetSpend, randomLast4 } from '@/features/spend/budgetUtils'

function Breadcrumb({ name }) {
  return (
    <nav aria-label="Đường dẫn" className="flex items-center gap-1 text-[13px] text-muted mb-4">
      <Link to="/chi-tieu-nhom" className="hover:text-fg">Chi tiêu nhóm</Link>
      <ChevronRight size={14} className="text-faint" />
      <span className="text-fg truncate">{name}</span>
    </nav>
  )
}

export default function BudgetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { budgets, team, cards, transactions, update, add } = useBank()
  const b = budgets.find((x) => x.id === id)
  const [modal, setModal] = useState(null) // 'edit' | 'members' | 'archive'
  const [removing, setRemoving] = useState(null)
  const [txId, setTxId] = useState(null)

  const linked = useMemo(() => (b ? budgetCards(cards, b.id) : []), [cards, b])
  const txs = useMemo(() => (b ? budgetTransactions(transactions, cards, b.id) : []), [transactions, cards, b])
  const spend = useMemo(() => (b ? budgetSpend(b, txs) : null), [b, txs])

  if (!b) {
    return (
      <div>
        <Breadcrumb name="Không tìm thấy" />
        <Card>
          <EmptyState icon={SearchX} title="Không tìm thấy ngân sách" desc="Ngân sách này có thể đã bị xoá hoặc đường dẫn không đúng."
            action={<Button variant="primary" to="/chi-tieu-nhom">Về Chi tiêu nhóm</Button>} />
        </Card>
      </div>
    )
  }

  const pct = usagePct(b)
  const tone = usageTone(pct)
  const remaining = b.limit - b.spent
  const owner = team.find((m) => m.id === b.owner)
  const members = team.filter((m) => b.members.includes(m.id))
  const holder = (c) => team.find((m) => m.id === c.member)?.name
  const range = periodRange(b)

  const archive = () => {
    update('budgets', b.id, { status: 'archived' })
    toast({ title: 'Đã lưu trữ ngân sách', desc: b.name, action: { label: 'Hoàn tác', onClick: () => update('budgets', b.id, { status: 'active' }) } })
    navigate('/chi-tieu-nhom')
  }
  const restore = () => { update('budgets', b.id, { status: 'active' }); toast({ title: 'Đã khôi phục ngân sách', desc: b.name }) }
  const activate = () => { update('budgets', b.id, { status: 'active' }); toast({ title: 'Ngân sách đã bắt đầu', desc: 'Thành viên có thể chi tiêu ngay.' }) }
  const removeMember = (m) => {
    update('budgets', b.id, { members: b.members.filter((x) => x !== m.id) })
    toast({ title: 'Đã gỡ thành viên', desc: `${m.name} không còn chi tiêu trong ngân sách này.` })
  }
  const issueCard = () => {
    const card = {
      id: newId('c'), last4: randomLast4(), nickname: b.name, member: 'u1', type: 'virtual', status: 'active', limit: b.limit,
      period: b.period, spent: 0, account: 'acc-main', expiry: '11/29', style: 'jade', budget: b.id, created: TODAY.toISOString().slice(0, 10),
    }
    add('cards', card)
    toast({ title: 'Đã cấp thẻ ảo', desc: `Thẻ ••${card.last4} gắn với ${b.name}` })
  }

  return (
    <div>
      <Breadcrumb name={b.name} />

      {/* ---- Tiêu đề ---- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <BudgetIcon icon={b.icon} color={b.color} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="ds-h1 truncate">{b.name}</h1>
              {b.status === 'draft' && <Badge>Bản nháp</Badge>}
              {b.status === 'archived' && <Badge>Đã lưu trữ</Badge>}
            </div>
            <p className="text-muted mt-0.5">{PERIOD_LABEL[b.period]} · {range.label}{b.desc ? ` · ${b.desc}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {b.status === 'archived' ? (
            <Button variant="primary" icon={ArchiveRestore} onClick={restore}>Khôi phục</Button>
          ) : (
            <>
              <Button variant="secondary" icon={UserPlus} onClick={() => setModal('members')}>Thêm thành viên</Button>
              <Button variant="secondary" icon={Pencil} onClick={() => setModal('edit')}>Chỉnh sửa</Button>
              <Button variant="ghost" icon={Archive} onClick={() => setModal('archive')}>Lưu trữ</Button>
              {b.status === 'draft' && <Button variant="primary" onClick={activate}>Bắt đầu ngân sách</Button>}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-5">
        {/* ---- Đã chi / hạn mức ---- */}
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[13px] text-muted">Đã chi kỳ này</div>
              <Money value={b.spent} className="ds-amount block mt-1" />
              <div className="text-[13px] text-muted mt-1">trên hạn mức <Money value={b.limit} className="text-fg font-[550]" /></div>
            </div>
            <div className="text-right">
              <div className="text-[13px] text-muted">{remaining >= 0 ? 'Còn lại' : 'Vượt hạn mức'}</div>
              <Money value={Math.abs(remaining)} className={cn('block text-[20px] font-[500] mt-1', remaining < 0 && 'text-neg')} />
              <div className="ds-caption mt-1">{periodRemaining(b)}</div>
            </div>
          </div>
          <Progress value={b.spent} max={b.limit} height={10} className="mt-5" />
          <div className="flex justify-between mt-1.5 ds-caption">
            <span className={cn(tone === 'neg' && 'text-neg font-[550]', tone === 'warn' && 'text-warn font-[550]')}>
              {pct}% đã dùng{tone === 'neg' ? ' · sắp chạm hạn mức' : tone === 'warn' ? ' · cần theo dõi' : ''}
            </span>
            <span>{formatDate(range.start)}{range.end ? ` – ${formatDate(range.end)}` : ''}</span>
          </div>
          <div className="mt-6 pt-5 border-t border-line">
            <div className="ds-label mb-2">Chi tiêu luỹ kế</div>
            <AreaChart data={spend.series} height={170} color={b.color} baseline="zero" />
          </div>
        </Card>

        {/* ---- Chính sách ---- */}
        <Card>
          <CardHeader title="Chính sách" desc="Áp dụng cho mọi thẻ gắn với ngân sách" action={b.status !== 'archived' && <IconButton icon={Pencil} label="Chỉnh sửa chính sách" size="sm" onClick={() => setModal('edit')} />} />
          <KeyValue items={[
            { label: 'Yêu cầu chứng từ', value: b.receiptRequired ? <Badge tone="brand">Bắt buộc</Badge> : <span className="text-muted">Không bắt buộc</span> },
            {
              label: 'Danh mục cho phép',
              value: b.categories?.length
                ? <span className="flex flex-col items-end gap-1">{b.categories.map((c) => <CategoryTag key={c} id={c} />)}</span>
                : 'Tất cả danh mục',
            },
            { label: 'Người duyệt', value: <span className="inline-flex items-center gap-2"><Avatar name={owner?.name} color={owner?.color} size={20} />{owner?.name}{b.owner !== 'u1' && ', Nguyễn Minh Anh'}</span> },
            { label: 'Chu kỳ', value: PERIOD_LABEL[b.period] },
            { label: 'Ngày tạo', value: formatDate(b.created) },
          ]} />
          {b.categories?.length > 0 && <p className="ds-caption mt-3">Giao dịch ngoài {b.categories.length} danh mục trên sẽ bị từ chối tự động.</p>}
        </Card>
      </div>

      {/* ---- Thành viên ---- */}
      <Card padded={false} className="mt-5">
        <div className="px-5 pt-5">
          <CardHeader title="Thành viên" desc={`${members.length} người được chi tiêu`}
            action={b.status !== 'archived' && <Button size="sm" variant="ghost" icon={UserPlus} onClick={() => setModal('members')}>Thêm</Button>} />
        </div>
        {members.length ? (
          <Table minWidth={640}>
            <THead>
              <Th>Thành viên</Th>
              <Th>Thẻ</Th>
              <Th align="right">Đã chi</Th>
              <Th width={180}>Tỷ trọng</Th>
              <Th width={56}><span className="sr-only">Thao tác</span></Th>
            </THead>
            <tbody>
              {members.map((m) => {
                const spent = Math.round(spend.perMember[m.id] || 0)
                const mc = linked.filter((c) => c.member === m.id && c.status !== 'cancelled')
                const lim = b.memberLimits?.[m.id]
                return (
                  <Tr key={m.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} color={m.color} size={30} />
                        <div className="min-w-0">
                          <div className="font-[550] truncate">{m.name}{m.id === b.owner && <span className="ml-1.5 text-[12px] text-muted font-normal">Chủ ngân sách</span>}</div>
                          <div className="ds-caption">{lim ? `Hạn mức riêng ${formatVND(lim)}` : m.title}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{mc.length ? <span className="inline-flex items-center gap-1.5 num text-dim"><CreditCard size={14} className="text-faint" />{mc.map((c) => '••' + c.last4).join(', ')}</span> : <span className="text-faint">Chưa có thẻ</span>}</Td>
                    <Td align="right"><Money value={spent} className={cn('font-[550]', !spent && 'text-faint')} /></Td>
                    <Td><Progress value={spent} max={b.spent || 1} auto={false} /></Td>
                    <Td align="right">
                      {b.status !== 'archived' && m.id !== b.owner && (
                        <IconButton icon={UserMinus} label={`Gỡ ${m.name}`} size="sm" onClick={() => setRemoving(m)} />
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState compact title="Chưa có thành viên" desc="Thêm người để họ bắt đầu chi tiêu." />
        )}
      </Card>

      {/* ---- Thẻ liên kết ---- */}
      <Card className="mt-5">
        <CardHeader title="Thẻ liên kết" desc="Giao dịch trên các thẻ này được tính vào ngân sách"
          action={b.status !== 'archived' && <Button size="sm" variant="ghost" icon={Plus} onClick={issueCard}>Cấp thẻ ảo</Button>} />
        {linked.length ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {linked.map((c) => (
              <Link key={c.id} to={`/the?id=${c.id}`} className="shrink-0 rounded-xl" aria-label={`Thẻ ••${c.last4} của ${holder(c)}`}>
                <PaymentCard card={c} holder={holder(c)} size="sm" className="transition-transform hover:-translate-y-0.5" />
                <div className="mt-2 text-[12.5px] text-muted">{c.status === 'cancelled' ? 'Đã huỷ' : c.status === 'frozen' ? 'Tạm khoá' : `Hạn mức ${formatVND(c.limit)}`}</div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState compact icon={CreditCard} title="Chưa có thẻ nào" desc="Cấp thẻ ảo để thành viên chi tiêu trực tiếp từ ngân sách." />
        )}
      </Card>

      {/* ---- Giao dịch gần đây ---- */}
      <Card padded={false} className="mt-5">
        <div className="px-5 pt-5"><CardHeader title="Giao dịch gần đây" desc={txs.length ? `${txs.length} giao dịch trên thẻ liên kết` : undefined} className="mb-2" /></div>
        <TxList transactions={txs.slice(0, 10)} onSelect={(t) => setTxId(t.id)} showAccount={false} empty="Chưa có giao dịch trong ngân sách này" />
      </Card>

      {modal === 'edit' && <BudgetEditModal budget={b} open onClose={() => setModal(null)} />}
      {modal === 'members' && <AddMembersModal budget={b} open onClose={() => setModal(null)} />}
      <Confirm open={modal === 'archive'} onClose={() => setModal(null)} onConfirm={archive} title="Lưu trữ ngân sách?" confirmLabel="Lưu trữ"
        desc="Thẻ liên kết sẽ không thể chi thêm từ ngân sách này. Bạn vẫn xem được lịch sử và có thể khôi phục bất cứ lúc nào." />
      <Confirm open={!!removing} onClose={() => setRemoving(null)} onConfirm={() => removeMember(removing)} danger confirmLabel="Gỡ thành viên"
        title={`Gỡ ${removing?.name}?`} desc="Thành viên sẽ không thể chi tiêu trong ngân sách này nữa. Giao dịch cũ vẫn được giữ lại." />
      <TxDrawer id={txId} onClose={() => setTxId(null)} />
    </div>
  )
}
