/* Thành viên & phân quyền — /cai-dat/thanh-vien */
import { useMemo, useState } from 'react'
import { UserPlus, Ellipsis, Send, Trash2, Undo2, Mail, ShieldCheck, Users, CreditCard, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatVND, TODAY } from '@/lib/format'
import { ROLES } from '@/data/org'
import { useBank, toast, newId } from '@/store'
import {
  Avatar, Badge, Button, Card, Confirm, EmptyState, IconButton, Input, KeyValue, Menu, Modal, MoneyInput, Popover,
  RadioCards, SearchInput, Segmented, Select, Table, THead, Th, Tr, Td, Toggle, Callout,
} from '@/components/ui'
import { SectionHeader, MEMBER_COLORS } from './shared'

const ROLE_OPTIONS = Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label }))
const ROLE_ICON = { admin: ShieldCheck, bookkeeper: Check, employee: Users, custom: CreditCard }

/* ---------- Mời thành viên (2 bước) ---------- */
function InviteModal({ open, onClose }) {
  const { team, add } = useBank()
  const blank = { email: '', name: '', title: '', role: 'employee', card: true, limit: 10000000 }
  const [step, setStep] = useState(0)
  const [f, setF] = useState(blank)
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())
  const exists = team.some((m) => m.email.toLowerCase() === f.email.trim().toLowerCase())
  const close = () => { onClose(); setTimeout(() => { setStep(0); setF(blank) }, 200) }

  const submit = () => {
    const name = f.name.trim() || f.email.split('@')[0]
    add('team', {
      id: newId('u'), name, email: f.email.trim().toLowerCase(), role: f.role, title: f.title.trim() || ROLES[f.role].label,
      dept: '—', status: 'invited', joined: TODAY.toISOString().slice(0, 10), color: MEMBER_COLORS[team.length % MEMBER_COLORS.length],
      cardLimit: f.card ? f.limit : null,
    }, { prepend: false })
    toast({ title: 'Đã gửi lời mời', desc: `${f.email.trim()} sẽ nhận email để tạo mật khẩu.`, tone: 'pos' })
    close()
  }

  return (
    <Modal open={open} onClose={close} size="md"
      title={step === 0 ? 'Mời thành viên' : 'Xem lại lời mời'}
      desc={step === 0 ? 'Người được mời nhận email kèm link kích hoạt có hiệu lực 7 ngày.' : 'Kiểm tra thông tin trước khi gửi.'}
      footer={step === 0
        ? <><Button variant="secondary" onClick={close}>Huỷ</Button><Button variant="primary" iconRight={ArrowRight} disabled={!emailOk || exists} onClick={() => setStep(1)}>Tiếp tục</Button></>
        : <><Button variant="secondary" onClick={() => setStep(0)}>Quay lại</Button><Button variant="primary" icon={Send} onClick={submit}>Gửi lời mời</Button></>}>
      <div className="flex gap-1.5 mb-5">{[0, 1].map((i) => <span key={i} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-brand-500' : 'bg-line')} />)}</div>
      {step === 0 ? (
        <div className="flex flex-col gap-4">
          <Input label="Email công việc" type="email" prefix={Mail} value={f.email} onChange={set('email')} placeholder="ten@senviet.vn" autoFocus
            error={exists ? 'Email này đã có trong danh sách thành viên.' : undefined} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input label="Họ và tên" optional value={f.name} onChange={set('name')} placeholder="Nguyễn Văn An" />
            <Input label="Chức danh" optional value={f.title} onChange={set('title')} placeholder="Chuyên viên kinh doanh" />
          </div>
          <div>
            <div className="text-[13px] font-[550] text-dim mb-1.5">Vai trò</div>
            <RadioCards value={f.role} onChange={set('role')} columns={2}
              options={Object.entries(ROLES).map(([value, r]) => ({ value, label: r.label, desc: r.desc }))} />
          </div>
          <div className="rounded-xl border border-line p-4 flex flex-col gap-3">
            <Toggle label="Cấp thẻ ảo khi kích hoạt" desc="Thẻ được phát hành ngay khi thành viên bật xác thực hai lớp." checked={f.card} onChange={set('card')} />
            {f.card && <MoneyInput label="Hạn mức chi tiêu hằng tháng" value={f.limit} onChange={set('limit')} className="animate-fade-in" />}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-subtle p-4">
            <Avatar name={f.name || f.email} color={MEMBER_COLORS[team.length % MEMBER_COLORS.length]} size={40} />
            <div className="min-w-0">
              <div className="text-[14px] font-[600] truncate">{f.name || f.email.split('@')[0]}</div>
              <div className="ds-caption truncate">{f.email}</div>
            </div>
          </div>
          <KeyValue items={[
            { label: 'Vai trò', value: ROLES[f.role].label },
            { label: 'Quyền hạn', value: <span className="text-dim">{ROLES[f.role].desc}</span> },
            f.title && { label: 'Chức danh', value: f.title },
            { label: 'Thẻ ảo', value: f.card ? `Có · hạn mức ${formatVND(f.limit)}/tháng` : 'Không cấp' },
            { label: 'Hiệu lực lời mời', value: '7 ngày' },
          ]} />
          {f.role === 'admin' && <Callout tone="warn" title="Cấp toàn quyền">Quản trị viên có thể chuyển tiền và thay đổi mọi cài đặt công ty.</Callout>}
        </div>
      )}
    </Modal>
  )
}

export function TeamSection() {
  const { team, update, remove } = useBank()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [inviting, setInviting] = useState(false)
  const [confirm, setConfirm] = useState(null) // { kind: 'remove' | 'revoke', member }

  const list = useMemo(() => team.filter((m) => {
    if (tab !== 'all' && m.status !== tab) return false
    const s = q.trim().toLowerCase()
    return !s || `${m.name} ${m.email} ${m.title}`.toLowerCase().includes(s)
  }), [team, q, tab])

  const counts = Object.keys(ROLES).map((r) => ({ role: r, n: team.filter((m) => m.role === r).length }))
  const invited = team.filter((m) => m.status === 'invited').length

  const changeRole = (m, role) => {
    update('team', m.id, { role })
    toast({ title: 'Đã đổi vai trò', desc: `${m.name} giờ là ${ROLES[role].label}.` })
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Thành viên & phân quyền" desc="Mời đồng nghiệp, chọn vai trò phù hợp và kiểm soát ai được chuyển tiền."
        action={<Button variant="primary" icon={UserPlus} onClick={() => setInviting(true)}>Mời thành viên</Button>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {counts.map(({ role, n }) => {
          const I = ROLE_ICON[role]
          return (
            <Card key={role} padded={false} className="p-4">
              <div className="flex items-center gap-2 text-[13px] text-muted"><I size={15} />{ROLES[role].label}</div>
              <div className="text-[22px] font-[500] num mt-1">{n}</div>
            </Card>
          )
        })}
      </div>

      <Card padded={false}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-line">
          <Segmented size="sm" value={tab} onChange={setTab} options={[
            { value: 'all', label: `Tất cả · ${team.length}` },
            { value: 'active', label: 'Đang hoạt động' },
            { value: 'invited', label: `Đã mời · ${invited}` },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Tìm theo tên, email" className="sm:ml-auto sm:max-w-[260px]" />
        </div>
        {list.length === 0 ? (
          <EmptyState compact icon={Users} title="Không có thành viên phù hợp" desc="Thử từ khoá khác hoặc mời thêm thành viên." />
        ) : (
          <Table minWidth={760}>
            <THead><Th>Thành viên</Th><Th>Chức danh</Th><Th width={180}>Vai trò</Th><Th>Trạng thái</Th><Th>Tham gia</Th><Th width={48}><span className="sr-only">Thao tác</span></Th></THead>
            <tbody>
              {list.map((m) => {
                const me = m.id === 'u1'
                return (
                  <Tr key={m.id}>
                    <Td>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={m.name} color={m.color} size={32} />
                        <div className="min-w-0">
                          <div className="font-[550] truncate">{m.name}{me && <span className="text-muted font-normal"> (bạn)</span>}</div>
                          <div className="ds-caption truncate">{m.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td><div className="text-dim">{m.title}</div>{m.dept && m.dept !== '—' && <div className="ds-caption">{m.dept}</div>}</Td>
                    <Td>
                      <Select size="sm" aria-label={`Vai trò của ${m.name}`} value={m.role} disabled={me} options={ROLE_OPTIONS} onChange={(e) => changeRole(m, e.target.value)} />
                    </Td>
                    <Td>{m.status === 'invited' ? <Badge tone="warn" dot>Đã mời</Badge> : <Badge tone="pos" dot>Đang hoạt động</Badge>}</Td>
                    <Td className="num text-dim">{formatDate(m.joined)}</Td>
                    <Td align="right">
                      {!me && (
                        <Popover align="end" width={220} trigger={(p) => <IconButton {...p} icon={Ellipsis} size="sm" label={`Thao tác với ${m.name}`} />}>
                          {(close) => <Menu onClose={close} items={m.status === 'invited' ? [
                            { label: 'Gửi lại lời mời', icon: Send, onClick: () => toast({ title: 'Đã gửi lại lời mời', desc: m.email }) },
                            { divider: true },
                            { label: 'Thu hồi lời mời', icon: Undo2, danger: true, onClick: () => setConfirm({ kind: 'revoke', member: m }) },
                          ] : [
                            { label: 'Gửi email', icon: Mail, onClick: () => { window.location.href = `mailto:${m.email}` } },
                            { divider: true },
                            { label: 'Xoá khỏi công ty', icon: Trash2, danger: true, onClick: () => setConfirm({ kind: 'remove', member: m }) },
                          ]} />}
                        </Popover>
                      )}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <h3 className="ds-h3 mb-3">Vai trò làm được gì?</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {Object.entries(ROLES).map(([k, r]) => (
            <div key={k} className="rounded-xl bg-subtle p-4">
              <div className="text-[14px] font-[600]">{r.label}</div>
              <p className="ds-caption mt-1">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <InviteModal open={inviting} onClose={() => setInviting(false)} />

      <Confirm open={!!confirm} onClose={() => setConfirm(null)} danger
        title={confirm?.kind === 'revoke' ? 'Thu hồi lời mời?' : `Xoá ${confirm?.member.name}?`}
        desc={confirm?.kind === 'revoke'
          ? `Link kích hoạt gửi tới ${confirm?.member.email} sẽ hết hiệu lực ngay.`
          : 'Thành viên mất quyền truy cập ngay lập tức. Các thẻ của họ sẽ bị huỷ, lịch sử giao dịch vẫn được giữ.'}
        confirmLabel={confirm?.kind === 'revoke' ? 'Thu hồi' : 'Xoá thành viên'}
        onConfirm={() => {
          remove('team', confirm.member.id)
          toast({ title: confirm.kind === 'revoke' ? 'Đã thu hồi lời mời' : 'Đã xoá thành viên', desc: confirm.member.name })
        }} />
    </div>
  )
}
