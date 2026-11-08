import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Settings2, Paperclip, Check, X, Receipt, CircleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatVND, TODAY } from '@/lib/format'
import { sum } from '@/lib/selectors'
import { useBank, toast } from '@/store'
import { REIMB_STATUS } from '@/data/spend'
import {
  PageHeader, Button, Card, Tabs, Table, THead, Th, Tr, Td, Avatar, Money, CategoryTag, StatusBadge, Checkbox, EmptyState, Tooltip,
} from '@/components/ui'
import { ReimbursementDrawer, RejectModal } from '@/features/spend/ReimbursementDrawer'
import { SubmitReimbursementFlow } from '@/features/spend/SubmitReimbursementFlow'
import { ReimbursementSettings, loadPolicy } from '@/features/spend/ReimbursementSettings'

const TABS = [
  { value: 'pending', label: 'Chờ duyệt', match: (r) => r.status === 'pending' },
  { value: 'approved', label: 'Đã duyệt', match: (r) => r.status === 'approved' },
  { value: 'paid', label: 'Đã hoàn tiền', match: (r) => r.status === 'paid' },
  { value: 'rejected', label: 'Từ chối', match: (r) => r.status === 'rejected' },
  { value: 'mine', label: 'Của tôi', match: (r) => r.member === 'u1' },
]
const EMPTY = {
  pending: ['Không có yêu cầu chờ duyệt', 'Bạn đã xử lý hết. Yêu cầu mới sẽ xuất hiện ở đây.'],
  approved: ['Chưa có yêu cầu đã duyệt', 'Yêu cầu được duyệt sẽ chờ hoàn tiền tại đây.'],
  paid: ['Chưa hoàn tiền khoản nào', 'Các khoản đã chuyển trả cho nhân viên sẽ hiện ở đây.'],
  rejected: ['Không có yêu cầu bị từ chối', 'Tốt lắm — mọi chứng từ đều hợp lệ.'],
  mine: ['Bạn chưa nộp hoàn ứng', 'Tự chi cho công việc? Nộp chứng từ để được hoàn tiền.'],
}
const todayISO = () => TODAY.toISOString().slice(0, 10)

export default function ReimbursementsPage() {
  const [params, setParams] = useSearchParams()
  const { reimbursements, team, updateMany } = useBank()
  const [tab, setTab] = useState('pending')
  const [selected, setSelected] = useState([])
  const [openId, setOpenId] = useState(null)
  const [bulkReject, setBulkReject] = useState(false)
  const [settings, setSettings] = useState(false)
  const [policy, setPolicy] = useState(loadPolicy)
  const submitting = params.get('nop') === '1'
  const setSubmitting = (v) => setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('nop', '1'); else n.delete('nop'); return n }, { replace: true })

  const approverName = team.find((m) => m.id === policy.approver)?.name
  const current = TABS.find((t) => t.value === tab)
  const rows = useMemo(() => reimbursements.filter(current.match).sort((a, b) => (a.submitted < b.submitted ? 1 : -1)), [reimbursements, current])
  const selectable = tab === 'pending'
  const picked = selected.filter((id) => rows.some((r) => r.id === id))
  const allOn = picked.length > 0 && picked.length === rows.length
  const memberOf = (id) => team.find((m) => m.id === id)

  const changeTab = (v) => { setTab(v); setSelected([]) }
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const approveSelected = () => {
    const total = sum(rows.filter((r) => picked.includes(r.id)), (r) => r.amount)
    updateMany('reimbursements', picked, { status: 'approved', approver: 'u1', approvedAt: todayISO() })
    toast({ title: `Đã duyệt ${picked.length} yêu cầu`, desc: `Tổng ${formatVND(total)} sẵn sàng hoàn tiền.` })
    setSelected([])
  }
  const rejectSelected = (reason) => {
    updateMany('reimbursements', picked, { status: 'rejected', approver: 'u1', reason, rejectedAt: todayISO() })
    toast({ title: `Đã từ chối ${picked.length} yêu cầu`, desc: 'Người nộp đã nhận được lý do.' })
    setSelected([])
  }

  return (
    <div>
      <PageHeader
        title="Hoàn ứng"
        desc="Nhân viên tự chi cho công việc rồi nộp chứng từ — duyệt và hoàn tiền chỉ trong vài cú bấm."
        actions={<>
          <Button variant="secondary" icon={Settings2} onClick={() => setSettings(true)}>Cài đặt</Button>
          <Button variant="primary" icon={Plus} onClick={() => setSubmitting(true)}>Nộp hoàn ứng</Button>
        </>}
      />

      <Tabs value={tab} onChange={changeTab} className="mb-4"
        options={TABS.map((t) => ({ value: t.value, label: t.label, count: t.value === 'pending' || t.value === 'mine' ? reimbursements.filter(t.match).length : undefined }))} />

      {selectable && picked.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 animate-fade-in">
          <span className="text-[13.5px] text-brand-ink font-[550]">
            Đã chọn {picked.length} · <Money value={sum(rows.filter((r) => picked.includes(r.id)), (r) => r.amount)} />
          </span>
          <button onClick={() => setSelected([])} className="text-[13px] text-muted hover:text-fg">Bỏ chọn</button>
          <div className="flex-1" />
          <Button size="sm" variant="danger-soft" icon={X} onClick={() => setBulkReject(true)}>Từ chối</Button>
          <Button size="sm" variant="primary" icon={Check} onClick={approveSelected}>Duyệt ({picked.length})</Button>
        </div>
      )}

      <Card padded={false}>
        {rows.length ? (
          <Table minWidth={860}>
            <THead>
              {selectable && (
                <Th width={44}>
                  <Checkbox checked={allOn} indeterminate={!allOn && picked.length > 0}
                    onChange={() => setSelected(allOn ? [] : rows.map((r) => r.id))} />
                </Th>
              )}
              <Th>Thành viên</Th>
              <Th>Nơi chi tiêu</Th>
              <Th>Ngày</Th>
              <Th>Danh mục</Th>
              <Th align="right">Số tiền</Th>
              <Th width={80}><span className="block text-center">Chứng từ</span></Th>
              <Th>Trạng thái</Th>
            </THead>
            <tbody>
              {rows.map((r) => {
                const m = memberOf(r.member)
                const on = picked.includes(r.id)
                return (
                  <Tr key={r.id} onClick={() => setOpenId(r.id)} selected={on}>
                    {selectable && (
                      <Td onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={on} onChange={() => toggle(r.id)} />
                      </Td>
                    )}
                    <Td>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m?.name} color={m?.color} size={28} />
                        <span className="truncate font-[520]">{m?.name}{r.member === 'u1' && <span className="text-muted font-normal"> (bạn)</span>}</span>
                      </div>
                    </Td>
                    <Td>
                      <div className="min-w-0 max-w-[240px]">
                        <button type="button" className="block max-w-full truncate rounded-md text-left">{r.merchant}</button>
                        {r.note && <div className="ds-caption truncate">{r.note}</div>}
                      </div>
                    </Td>
                    <Td className="text-dim whitespace-nowrap">{formatDate(r.date)}</Td>
                    <Td><CategoryTag id={r.category} /></Td>
                    <Td align="right"><Money value={r.amount} className="font-[550]" /></Td>
                    <Td>
                      <span className="flex justify-center">
                        {r.receipt
                          ? <Tooltip content={r.receipt}><span className="size-7 grid place-items-center rounded-lg bg-subtle text-dim" aria-label="Có chứng từ"><Paperclip size={14} /></span></Tooltip>
                          : <Tooltip content="Thiếu chứng từ"><span className="size-7 grid place-items-center rounded-lg bg-warn-soft text-warn" aria-label="Thiếu chứng từ"><CircleAlert size={14} /></span></Tooltip>}
                      </span>
                    </Td>
                    <Td><StatusBadge map={REIMB_STATUS} value={r.status} /></Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        ) : (
          <EmptyState icon={Receipt} title={EMPTY[tab][0]} desc={EMPTY[tab][1]}
            action={tab === 'mine' && <Button variant="primary" icon={Plus} onClick={() => setSubmitting(true)}>Nộp hoàn ứng</Button>} />
        )}
      </Card>
      {rows.length > 0 && (
        <p className={cn('ds-caption mt-3')}>
          Người duyệt: {approverName} · Hạn nộp chứng từ {policy.deadline} ngày kể từ ngày chi.
        </p>
      )}

      <ReimbursementDrawer id={openId} onClose={() => setOpenId(null)} />
      <RejectModal open={bulkReject} onClose={() => setBulkReject(false)} onConfirm={rejectSelected} count={picked.length} />
      {settings && <ReimbursementSettings open policy={policy} onChange={setPolicy} onClose={() => setSettings(false)} />}
      {submitting && <SubmitReimbursementFlow policy={{ ...policy, approverName }} onClose={() => setSubmitting(false)} />}
    </div>
  )
}
