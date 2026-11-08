/* Tích hợp & API — /cai-dat/tich-hop */
import { useState } from 'react'
import { Plus, Copy, Check, Key, Trash2, Unplug, ShieldCheck, ExternalLink, AlertTriangle, Code2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatRelative, TODAY, addDays } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import {
  Badge, Button, Callout, Card, CardHeader, Checkbox, Confirm, EmptyState, IconButton, Input, Modal, Segmented, Select, Table, THead, Th, Tr, Td,
} from '@/components/ui'
import { SectionHeader, BrandTile } from './shared'

const PERMS = {
  'Kế toán': ['Đọc giao dịch và số dư', 'Đẩy chứng từ, hoá đơn đính kèm', 'Đồng bộ danh mục và tài khoản kế toán'],
  'Hoá đơn': ['Phát hành hoá đơn GTGT thay bạn', 'Đọc thông tin khách hàng và mã số thuế'],
  'Thông báo': ['Gửi tin nhắn vào kênh đã chọn', 'Đọc tên thành viên để gắn thẻ'],
  'Dữ liệu': ['Đọc giao dịch và số dư', 'Ghi vào bảng tính được chọn'],
  'Bán hàng': ['Đọc đơn hàng và trạng thái thanh toán', 'Đọc giao dịch tiền vào'],
  'Nhân sự': ['Đọc bảng lương đã duyệt', 'Tạo lệnh chi lương từ Quỹ lương'],
}

const seedTokens = [
  { id: 'tk1', name: 'Đồng bộ kho Haravan', scope: 'read', prefix: 'mach_live_7Hq2', created: '2026-08-14', last: '2026-11-08T07:12:00', expires: null },
  { id: 'tk2', name: 'Báo cáo nội bộ (Metabase)', scope: 'read', prefix: 'mach_live_k9Zp', created: '2026-03-02', last: '2026-11-06T22:40:00', expires: '2027-03-02' },
]

function randomSecret() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'mach_live_' + s
}

/* ---------- Kết nối dịch vụ ---------- */
function ConnectModal({ item, onClose }) {
  const { accounts, update } = useBank()
  const perms = PERMS[item.group] || ['Đọc giao dịch và số dư']
  const [agree, setAgree] = useState(true)
  const [acc, setAcc] = useState(accounts[0].id)
  const [loading, setLoading] = useState(false)
  const connect = () => {
    setLoading(true)
    setTimeout(() => {
      update('integrations', item.id, { connected: true })
      toast({ title: `Đã kết nối ${item.name}`, desc: 'Lần đồng bộ đầu tiên sẽ hoàn tất trong vài phút.', tone: 'pos' })
      onClose()
    }, 900)
  }
  return (
    <Modal open onClose={onClose} size="md" title={`Kết nối ${item.name}`} desc={item.desc}
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" loading={loading} disabled={!agree} onClick={connect}>Cho phép & kết nối</Button></>}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <BrandTile name="Mạch" color="#138f66" size={40} />
          <span className="flex-1 border-t border-dashed border-line-strong" />
          <BrandTile name={item.name} color={item.color} size={40} />
        </div>
        <div>
          <div className="text-[13px] font-[550] text-dim mb-2">{item.name} sẽ được phép</div>
          <ul className="flex flex-col gap-2">
            {perms.map((p) => <li key={p} className="flex items-start gap-2 text-[13.5px]"><Check size={16} className="text-pos mt-0.5 shrink-0" />{p}</li>)}
          </ul>
        </div>
        {['Kế toán', 'Dữ liệu', 'Bán hàng'].includes(item.group) && (
          <Select label="Tài khoản đồng bộ" value={acc} onChange={(e) => setAcc(e.target.value)} options={[...accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))]} />
        )}
        <Checkbox checked={agree} onChange={setAgree} label="Tôi đồng ý chia sẻ dữ liệu trên với nhà cung cấp" desc="Bạn có thể ngắt kết nối bất cứ lúc nào, dữ liệu đã đồng bộ không bị xoá." />
      </div>
    </Modal>
  )
}

/* ---------- Tạo khoá API ---------- */
function TokenModal({ onClose, onCreate }) {
  const [f, setF] = useState({ name: '', scope: 'read', exp: '90' })
  const [secret, setSecret] = useState(null)
  const [copied, setCopied] = useState(false)
  const create = () => {
    const s = randomSecret()
    setSecret(s)
    onCreate({ id: newId('tk'), name: f.name.trim(), scope: f.scope, prefix: s.slice(0, 14), created: TODAY.toISOString().slice(0, 10), last: null, expires: f.exp === 'never' ? null : addDays(TODAY, Number(f.exp)).toISOString().slice(0, 10) })
  }
  const copy = () => { navigator.clipboard?.writeText(secret); setCopied(true); toast('Đã sao chép khoá API') }
  return (
    <Modal open onClose={onClose} size="md" title={secret ? 'Khoá API đã được tạo' : 'Tạo khoá API'}
      desc={secret ? 'Hãy lưu khoá này ở nơi an toàn.' : 'Dùng khoá để hệ thống của bạn đọc giao dịch hoặc tạo lệnh chi qua API.'}
      footer={secret
        ? <Button variant="primary" onClick={onClose}>Tôi đã lưu khoá</Button>
        : <><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" icon={Key} disabled={f.name.trim().length < 2} onClick={create}>Tạo khoá</Button></>}>
      {secret ? (
        <div className="flex flex-col gap-4">
          <Callout tone="warn" icon={AlertTriangle} title="Khoá chỉ hiển thị một lần">Sau khi đóng hộp thoại, Mạch sẽ không hiển thị lại khoá này. Nếu làm mất, hãy thu hồi và tạo khoá mới.</Callout>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-subtle p-2 pl-3.5">
            <code className="flex-1 min-w-0 font-mono text-[12.5px] break-all">{secret}</code>
            <Button size="sm" variant={copied ? 'secondary' : 'outline'} icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Đã chép' : 'Sao chép'}</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Input label="Tên khoá" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="VD: Đồng bộ phần mềm bán hàng" autoFocus />
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-[550] text-dim">Quyền</span>
            <Segmented value={f.scope} onChange={(scope) => setF({ ...f, scope })} options={[{ value: 'read', label: 'Chỉ đọc' }, { value: 'write', label: 'Đọc & ghi' }]} />
            <p className="ds-caption">{f.scope === 'read' ? 'Đọc tài khoản, giao dịch, hoá đơn. Không thể tạo lệnh chi.' : 'Có thể tạo lệnh chi — lệnh vẫn phải qua quy tắc duyệt chi.'}</p>
          </div>
          <Select label="Hết hạn sau" value={f.exp} onChange={(e) => setF({ ...f, exp: e.target.value })}
            options={[{ value: '30', label: '30 ngày' }, { value: '90', label: '90 ngày' }, { value: '365', label: '1 năm' }, { value: 'never', label: 'Không hết hạn' }]} />
        </div>
      )}
    </Modal>
  )
}

export function IntegrationsSection() {
  const { integrations, update } = useBank()
  const [connecting, setConnecting] = useState(null)
  const [disconnect, setDisconnect] = useState(null)
  const [tokens, setTokens] = useState(seedTokens)
  const [creating, setCreating] = useState(false)
  const [revoke, setRevoke] = useState(null)
  const groups = [...new Set(integrations.map((i) => i.group))]
  const connected = integrations.filter((i) => i.connected).length

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Tích hợp" desc={`Kết nối Mạch với phần mềm kế toán, hoá đơn điện tử và công cụ của đội. Đang kết nối ${connected}/${integrations.length} dịch vụ.`} />

      {groups.map((g) => (
        <div key={g}>
          <div className="ds-label mb-2.5">{g}</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {integrations.filter((i) => i.group === g).map((i) => (
              <Card key={i.id} padded={false} className="p-4 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <BrandTile name={i.name} color={i.color} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-[600]">{i.name}</span>
                      {i.connected && <Badge tone="pos" dot size="sm">Đã kết nối</Badge>}
                    </div>
                    <p className="ds-caption mt-0.5">{i.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                  <span className="ds-caption">{i.connected ? 'Đồng bộ lần cuối 15 phút trước' : 'Chưa kết nối'}</span>
                  {i.connected
                    ? <Button size="sm" variant="ghost" icon={Unplug} onClick={() => setDisconnect(i)}>Ngắt kết nối</Button>
                    : <Button size="sm" variant="outline" onClick={() => setConnecting(i)}>Kết nối</Button>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card padded={false}>
        <div className="p-5 pb-0">
          <CardHeader title="Khoá API" icon={Code2} desc="Cho phép hệ thống nội bộ truy cập dữ liệu của công ty qua API REST của Mạch."
            action={<Button size="sm" variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo khoá</Button>} />
        </div>
        {tokens.length === 0 ? (
          <EmptyState compact icon={Key} title="Chưa có khoá API" desc="Tạo khoá để kết nối hệ thống của bạn với Mạch." />
        ) : (
          <Table minWidth={640}>
            <THead><Th>Tên khoá</Th><Th>Quyền</Th><Th>Tạo ngày</Th><Th>Dùng lần cuối</Th><Th>Hết hạn</Th><Th width={48}><span className="sr-only">Thao tác</span></Th></THead>
            <tbody>
              {tokens.map((t) => (
                <Tr key={t.id}>
                  <Td><div className="font-[550]">{t.name}</div><div className="font-mono text-[12px] text-muted">{t.prefix}••••</div></Td>
                  <Td><Badge tone={t.scope === 'write' ? 'warn' : 'neutral'}>{t.scope === 'write' ? 'Đọc & ghi' : 'Chỉ đọc'}</Badge></Td>
                  <Td className="num text-dim">{formatDate(t.created)}</Td>
                  <Td className="text-dim">{t.last ? formatRelative(t.last) : 'Chưa dùng'}</Td>
                  <Td className="num text-dim">{t.expires ? formatDate(t.expires) : 'Không'}</Td>
                  <Td align="right"><IconButton size="sm" icon={Trash2} label={`Thu hồi khoá ${t.name}`} onClick={() => setRevoke(t)} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-line ds-caption">
          <ShieldCheck size={14} /> Khoá được mã hoá khi lưu trữ. Mọi lệnh gọi API đều được ghi vào nhật ký hoạt động.
          <button onClick={() => toast('Tài liệu API sẽ mở trong tab mới')} className={cn('ml-auto inline-flex items-center gap-1 font-[550] text-brand-ink hover:underline shrink-0')}>Tài liệu API <ExternalLink size={13} /></button>
        </div>
      </Card>

      {connecting && <ConnectModal item={connecting} onClose={() => setConnecting(null)} />}
      {creating && <TokenModal onClose={() => setCreating(false)} onCreate={(t) => { setTokens((x) => [t, ...x]); toast({ title: 'Đã tạo khoá API', desc: t.name, tone: 'pos' }) }} />}

      <Confirm open={!!disconnect} onClose={() => setDisconnect(null)} danger confirmLabel="Ngắt kết nối"
        title={`Ngắt kết nối ${disconnect?.name}?`} desc="Mạch sẽ dừng đồng bộ ngay. Dữ liệu đã đồng bộ trước đó vẫn được giữ ở cả hai bên."
        onConfirm={() => { update('integrations', disconnect.id, { connected: false }); toast({ title: `Đã ngắt kết nối ${disconnect.name}` }) }} />
      <Confirm open={!!revoke} onClose={() => setRevoke(null)} danger confirmLabel="Thu hồi khoá"
        title="Thu hồi khoá API?" desc={revoke ? `Mọi hệ thống đang dùng “${revoke.name}” sẽ bị từ chối truy cập ngay lập tức.` : ''}
        onConfirm={() => { setTokens((x) => x.filter((t) => t.id !== revoke.id)); toast('Đã thu hồi khoá API') }} />
    </div>
  )
}
