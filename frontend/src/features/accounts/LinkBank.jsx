/* ==========================================================
   Liên kết tài khoản ở ngân hàng khác (mô phỏng Open Banking):
   chọn ngân hàng → xác thực → chọn tài khoản → hoàn tất
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { Link2, Plus, Check, ShieldCheck, Lock, Loader2, RefreshCw, Unlink, Eye, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatTime, TODAY } from '@/lib/format'
import { toast, newId } from '@/store'
import { BANKS } from '@/data/payments'
import { COMPANY } from '@/data/org'
import { Card, Button, IconButton, Modal, Confirm, Input, Checkbox, Avatar, Money, EmptyState, Callout, Badge } from '@/components/ui'
import { useLinked } from './linkedStore'

const BANK_COLORS = ['#007a3d', '#e2231a', '#1e3a8a', '#1f4fa0', '#00a651', '#006b68', '#0b5ea8', '#1c5fa8', '#6d2c91']
const OTHER_BANKS = BANKS.filter((b) => b !== COMPANY.partnerBank)
const bankColor = (name) => BANK_COLORS[Math.max(0, OTHER_BANKS.indexOf(name)) % BANK_COLORS.length]

/** Tạo tài khoản “tìm thấy” ở ngân hàng được chọn (cố định theo tên ngân hàng) */
function foundAccounts(bank) {
  let h = 0
  for (const ch of bank) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const n = (k) => String((h >> k) % 10000).padStart(4, '0')
  return [
    { key: 'a', name: 'Tài khoản thanh toán doanh nghiệp', last4: n(2), balance: 180000000 + (h % 420) * 1000000 },
    { key: 'b', name: 'Tiền gửi có kỳ hạn 6 tháng', last4: n(5), balance: 500000000 + (h % 9) * 100000000 },
  ]
}

function LinkFlow({ open, onClose }) {
  const link = useLinked((s) => s.link)
  const [step, setStep] = useState('bank')
  const [bank, setBank] = useState(null)
  const [q, setQ] = useState('')
  const [cred, setCred] = useState({ user: '', pass: '' })
  const [picked, setPicked] = useState([])
  useEffect(() => { if (open) { setStep('bank'); setBank(null); setQ(''); setCred({ user: '', pass: '' }); setPicked([]) } }, [open])
  const accounts = useMemo(() => (bank ? foundAccounts(bank) : []), [bank])

  useEffect(() => {
    if (step !== 'connecting') return
    const t = setTimeout(() => { setPicked(accounts.map((a) => a.key)); setStep('pick') }, 1400)
    return () => clearTimeout(t)
  }, [step, accounts])

  const finish = () => {
    const items = accounts.filter((a) => picked.includes(a.key)).map((a) => ({
      id: newId('lk'), bank, name: a.name, last4: a.last4, balance: a.balance, color: bankColor(bank), syncedAt: TODAY.toISOString(),
    }))
    link(items)
    toast({ title: `Đã liên kết ${items.length} tài khoản ${bank}`, tone: 'pos' })
    setStep('done')
  }

  const titles = {
    bank: ['Liên kết tài khoản ngân hàng khác', 'Xem số dư và giao dịch ở mọi ngân hàng ngay trong Mạch.'],
    login: [`Đăng nhập ${bank}`, 'Dùng thông tin Internet Banking doanh nghiệp của bạn.'],
    connecting: [`Đang kết nối ${bank}`, 'Việc này chỉ mất vài giây.'],
    pick: ['Chọn tài khoản muốn liên kết', `Mạch tìm thấy ${accounts.length} tài khoản tại ${bank}.`],
    done: [null, null],
  }[step]

  const footer = {
    bank: <Button variant="secondary" onClick={onClose}>Huỷ</Button>,
    login: <>
      <Button variant="secondary" onClick={() => setStep('bank')}>Quay lại</Button>
      <Button variant="primary" icon={Lock} disabled={cred.user.length < 3 || cred.pass.length < 4} onClick={() => setStep('connecting')}>Kết nối an toàn</Button>
    </>,
    connecting: null,
    pick: <>
      <Button variant="secondary" onClick={onClose}>Huỷ</Button>
      <Button variant="primary" disabled={!picked.length} onClick={finish}>Liên kết {picked.length} tài khoản</Button>
    </>,
    done: <Button variant="primary" onClick={onClose}>Xong</Button>,
  }[step]

  return (
    <Modal open={open} onClose={onClose} title={titles[0]} desc={titles[1]} footer={footer} hideClose={step === 'done'}>
      {step === 'bank' && (
        <div className="flex flex-col gap-3">
          <Input prefix={Search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm ngân hàng" autoFocus />
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
            {OTHER_BANKS.filter((b) => b.toLowerCase().includes(q.toLowerCase())).map((b) => (
              <button key={b} type="button" onClick={() => { setBank(b); setStep('login') }}
                className="flex items-center gap-3 rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-left hover:border-faint hover:bg-subtle transition-colors">
                <Avatar name={b.replace(/^Ngân hàng /, '')} color={bankColor(b)} size={32} square />
                <span className="text-[13.5px] font-[550] truncate">{b}</span>
              </button>
            ))}
          </div>
          <p className="ds-caption flex items-center gap-1.5"><ShieldCheck size={14} className="text-brand-ink" />Kết nối chỉ đọc — Mạch không thể chuyển tiền từ tài khoản liên kết.</p>
        </div>
      )}

      {step === 'login' && (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (cred.user.length >= 3 && cred.pass.length >= 4) setStep('connecting') }}>
          <div className="flex items-center gap-3 rounded-xl bg-subtle px-3.5 py-3">
            <Avatar name={bank.replace(/^Ngân hàng /, '')} color={bankColor(bank)} size={36} square />
            <div className="min-w-0">
              <div className="text-[14px] font-[600]">{bank}</div>
              <div className="ds-caption">Kết nối qua cổng Open API được mã hoá</div>
            </div>
          </div>
          <Input label="Tên đăng nhập" value={cred.user} onChange={(e) => setCred({ ...cred, user: e.target.value })} autoFocus autoComplete="off" placeholder="VD: senviet_admin" />
          <Input label="Mật khẩu" type="password" value={cred.pass} onChange={(e) => setCred({ ...cred, pass: e.target.value })} autoComplete="off" />
          <p className="ds-caption">Bản demo: nhập thông tin bất kỳ. Mạch không lưu mật khẩu ngân hàng của bạn.</p>
          <button type="submit" hidden />
        </form>
      )}

      {step === 'connecting' && (
        <div className="flex flex-col items-center text-center py-8 gap-4">
          <Loader2 size={34} className="animate-spin text-brand-500" />
          <div className="flex flex-col gap-1.5 text-[13.5px] text-dim">
            <span className="inline-flex items-center gap-2"><Check size={14} className="text-pos" />Đã xác thực thông tin đăng nhập</span>
            <span className="inline-flex items-center gap-2 text-muted"><Loader2 size={14} className="animate-spin" />Đang tải danh sách tài khoản…</span>
          </div>
        </div>
      )}

      {step === 'pick' && (
        <div className="flex flex-col gap-2">
          {accounts.map((a) => {
            const on = picked.includes(a.key)
            return (
              <div key={a.key} className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-3', on ? 'border-brand-400 bg-brand-50' : 'border-line-strong')}>
                <Checkbox checked={on} onChange={(v) => setPicked((p) => (v ? [...p, a.key] : p.filter((k) => k !== a.key)))}
                  label={a.name} desc={`${bank} ••${a.last4}`} className="flex-1" />
                <Money value={a.balance} className="text-[14px] font-[550]" />
              </div>
            )
          })}
        </div>
      )}

      {step === 'done' && (
        <div className="flex flex-col items-center text-center pt-6 pb-2">
          <span className="size-16 rounded-full bg-pos-soft text-pos grid place-items-center mb-4 animate-pop-in"><Check size={32} strokeWidth={2.6} /></span>
          <h2 className="ds-h2">Liên kết thành công</h2>
          <p className="text-muted mt-1.5 max-w-sm">Số dư {bank} sẽ được cập nhật mỗi 4 giờ và hiển thị cùng các tài khoản Mạch của bạn.</p>
        </div>
      )}
    </Modal>
  )
}

export function LinkBank() {
  const items = useLinked((s) => s.items)
  const unlink = useLinked((s) => s.unlink)
  const [open, setOpen] = useState(false)
  const [removing, setRemoving] = useState(null)

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <Card>
          <EmptyState icon={Link2} title="Chưa liên kết ngân hàng nào"
            desc="Liên kết tài khoản ở Vietcombank, Techcombank, MB Bank… để xem toàn bộ dòng tiền của công ty ở một nơi."
            action={<Button variant="primary" icon={Link2} onClick={() => setOpen(true)}>Liên kết tài khoản</Button>} />
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-muted text-[13.5px]">Tài khoản liên kết chỉ để xem — số dư không tính vào tổng số dư tại Mạch.</p>
            <Button variant="outline" icon={Plus} onClick={() => setOpen(true)}>Liên kết thêm</Button>
          </div>
          <Card padded={false}>
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-4 border-b border-line last:border-0">
                <Avatar name={a.bank.replace(/^Ngân hàng /, '')} color={a.color} size={38} square />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-[600] truncate">{a.name}</span>
                    <Badge size="sm" icon={Eye}>Chỉ xem</Badge>
                  </div>
                  <div className="ds-caption">{a.bank} ••{a.last4} · Đồng bộ lúc {formatTime(a.syncedAt)}</div>
                </div>
                <Money value={a.balance} className="text-[15px] font-[550] hidden min-[420px]:inline" />
                <IconButton icon={RefreshCw} size="sm" label={`Đồng bộ ${a.name}`} onClick={() => toast({ title: 'Đã đồng bộ', desc: `${a.bank} ••${a.last4} · số dư mới nhất` })} />
                <IconButton icon={Unlink} size="sm" label={`Huỷ liên kết ${a.name}`} onClick={() => setRemoving(a)} />
              </div>
            ))}
          </Card>
        </>
      )}
      <Callout tone="neutral" icon={ShieldCheck}>Kết nối được mã hoá và tuân thủ quy định Open API của Ngân hàng Nhà nước. Bạn có thể huỷ liên kết bất cứ lúc nào.</Callout>

      <LinkFlow open={open} onClose={() => setOpen(false)} />
      <Confirm open={!!removing} onClose={() => setRemoving(null)} danger confirmLabel="Huỷ liên kết"
        title="Huỷ liên kết tài khoản?" desc={removing ? `${removing.bank} ••${removing.last4} sẽ không còn hiển thị trong Mạch.` : ''}
        onConfirm={() => { unlink(removing.id); toast({ title: 'Đã huỷ liên kết', desc: `${removing.bank} ••${removing.last4}` }) }} />
    </div>
  )
}
