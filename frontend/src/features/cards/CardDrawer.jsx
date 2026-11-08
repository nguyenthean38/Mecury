/* ==========================================================
   Ngăn kéo chi tiết thẻ: hình thẻ, thao tác nhanh, hạn mức, giao dịch
   ========================================================== */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Snowflake, Play, Gauge, Ban, Pencil, KeyRound, Trash2, Copy, Smartphone, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { useBank, useUI, toast } from '@/store'
import { CARD_STATUS } from '@/data/spend'
import { Drawer, PaymentCard, Toggle, StatusBadge, Money, Progress, KeyValue, Avatar, Confirm, Callout, Badge, MoreLink, DynIcon, Button } from '@/components/ui'
import { TxList } from '@/features/transactions/TxList'
import { TxDrawer } from '@/features/transactions/TxDrawer'
import { LimitModal, BlockModal, RenameCardModal, PinModal, periodLabel } from './CardModals'

function Action({ icon: Icon, label, onClick, disabled, danger }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={cn('flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-[12px] font-[550] text-center transition-colors disabled:opacity-40 disabled:pointer-events-none',
        danger ? 'text-neg hover:bg-neg-soft' : 'text-dim hover:bg-subtle hover:text-fg')}>
      <span className={cn('size-10 grid place-items-center rounded-full border', danger ? 'border-neg/30 bg-neg-soft' : 'border-line bg-surface')}><Icon size={17} /></span>
      <span className="leading-tight">{label}</span>
    </button>
  )
}

export function CardDrawer({ id, onClose }) {
  const card = useBank((s) => s.cards.find((c) => c.id === id))
  const team = useBank((s) => s.team)
  const accounts = useBank((s) => s.accounts)
  const budgets = useBank((s) => s.budgets)
  const transactions = useBank((s) => s.transactions)
  const update = useBank((s) => s.update)
  const hide = useUI((s) => s.hideBalances)
  const [show, setShow] = useState(false)
  const [modal, setModal] = useState(null) // limit | block | rename | pin | cancel
  const [txId, setTxId] = useState(null)
  const txs = useMemo(() => (card ? transactions.filter((t) => t.card === card.last4) : []), [transactions, card])

  if (!card) return null
  const holder = team.find((m) => m.id === card.member)
  const acc = accounts.find((a) => a.id === card.account)
  const budget = budgets.find((b) => b.id === card.budget)
  const cancelled = card.status === 'cancelled'
  const frozen = card.status === 'frozen'
  const left = Math.max(0, card.limit - card.spent)
  const fullNumber = `5284 61${card.last4.slice(0, 2)} 3307 ${card.last4}`

  const setStatus = (status) => {
    update('cards', card.id, { status })
    toast(status === 'frozen'
      ? { title: 'Đã tạm khoá thẻ', desc: `Thẻ ••${card.last4} sẽ từ chối mọi giao dịch mới.`, tone: 'info', action: { label: 'Hoàn tác', onClick: () => update('cards', card.id, { status: 'active' }) } }
      : { title: 'Đã mở khoá thẻ', desc: `Thẻ ••${card.last4} dùng lại được ngay.` })
  }

  return (
    <>
      <Drawer open={!!id} onClose={onClose} width={500}
        header={
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="ds-h2 truncate">{card.nickname}</h2>
              <StatusBadge map={CARD_STATUS} value={card.status} />
            </div>
            <div className="ds-caption mt-0.5">{card.type === 'virtual' ? 'Thẻ ảo' : 'Thẻ vật lý'} ••{card.last4} · {holder?.name}</div>
          </div>
        }
        footer={!cancelled && <>
          <Button variant="danger-soft" icon={Trash2} onClick={() => setModal('cancel')}>Huỷ thẻ</Button>
          <div className="flex-1" />
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </>}>
        <div className="flex flex-col gap-6">
          {/* ---- Hình thẻ ---- */}
          <div className="flex flex-col items-center gap-3">
            <PaymentCard card={card} holder={holder?.name} size="lg" showNumber={show} />
            {!cancelled && (
              <div className="w-full max-w-[380px] flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-[13px] text-dim cursor-pointer">
                  <Toggle size="sm" checked={show} onChange={setShow} />
                  Hiện số thẻ
                </label>
                {show && !hide && (
                  <div className="flex items-center gap-3 text-[12.5px] text-muted animate-fade-in">
                    <span>Hạn <b className="num text-fg font-[600]">{card.expiry}</b></span>
                    <span>CVV <b className="num text-fg font-[600]">{(Number(card.last4) * 7) % 900 + 100}</b></span>
                    <button type="button" aria-label="Sao chép số thẻ" className="text-faint hover:text-fg"
                      onClick={() => { navigator.clipboard?.writeText(fullNumber.replace(/ /g, '')); toast('Đã sao chép số thẻ') }}><Copy size={14} /></button>
                  </div>
                )}
              </div>
            )}
          </div>

          {cancelled ? (
            <Callout tone="neutral" icon={AlertTriangle} title="Thẻ đã bị huỷ">Thẻ không thể dùng lại. Lịch sử giao dịch vẫn được lưu để đối chiếu.</Callout>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              <Action icon={frozen ? Play : Snowflake} label={frozen ? 'Mở khoá' : 'Tạm khoá'} onClick={() => setStatus(frozen ? 'active' : 'frozen')} />
              <Action icon={Gauge} label="Hạn mức" onClick={() => setModal('limit')} />
              <Action icon={Ban} label="Chặn ngành" onClick={() => setModal('block')} />
              <Action icon={Pencil} label="Đổi tên" onClick={() => setModal('rename')} />
              {card.type === 'physical'
                ? <Action icon={KeyRound} label="Đặt lại PIN" onClick={() => setModal('pin')} />
                : <Action icon={Smartphone} label="Thêm vào ví" onClick={() => toast({ title: 'Đã gửi hướng dẫn', desc: `Mở ứng dụng Mạch trên điện thoại để thêm thẻ ••${card.last4} vào ví.`, tone: 'info' })} />}
              <Action icon={Trash2} label="Huỷ thẻ" danger onClick={() => setModal('cancel')} />
            </div>
          )}

          {/* ---- Chi tiêu & hạn mức ---- */}
          <div className="rounded-xl border border-line p-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="ds-caption">Đã chi {card.period === 'Trọn đời' ? 'từ khi tạo thẻ' : 'kỳ này'}</div>
                <Money value={card.spent} className="text-[22px] font-[500] tracking-tight" />
              </div>
              <div className="text-right">
                <div className="ds-caption">Hạn mức {periodLabel(card.period)}</div>
                <Money value={card.limit} className="text-[14px] font-[550]" />
              </div>
            </div>
            <Progress value={card.spent} max={card.limit} className="mt-3" />
            <div className="mt-2 ds-caption">Còn lại <Money value={left} className="font-[550] text-dim" /></div>
            {card.blocked?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line flex items-center gap-1.5 flex-wrap">
                <span className="ds-caption mr-1">Đang chặn:</span>
                {card.blocked.map((g) => <Badge key={g} size="sm" tone="neg">{g}</Badge>)}
              </div>
            )}
          </div>

          {budget && (
            <Link to={`/chi-tieu-nhom/${budget.id}`} className="flex items-center gap-3 rounded-xl border border-line p-3.5 hover:bg-subtle transition-colors">
              <span className="size-9 rounded-lg grid place-items-center shrink-0" style={{ background: `color-mix(in srgb, ${budget.color} 14%, var(--c-surface))`, color: budget.color }}>
                <DynIcon name={budget.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block ds-caption">Thuộc ngân sách</span>
                <span className="block text-[14px] font-[550] truncate">{budget.name}</span>
                <Progress value={budget.spent} max={budget.limit} height={4} className="mt-1.5" />
              </span>
              <ChevronRight size={16} className="text-faint" />
            </Link>
          )}

          <KeyValue items={[
            { label: 'Người dùng', value: holder ? <span className="inline-flex items-center gap-2"><Avatar name={holder.name} color={holder.color} size={20} />{holder.name}</span> : '—' },
            { label: 'Loại thẻ', value: card.type === 'virtual' ? 'Thẻ ảo · dùng online' : 'Thẻ vật lý · có chip & NFC' },
            { label: 'Hạn sử dụng', value: <span className="num">{card.expiry}</span> },
            { label: 'Tài khoản trừ tiền', value: acc ? `${acc.name} ••${acc.last4}` : '—' },
            { label: 'Ngày tạo', value: formatDate(card.created) },
            card.shipping && { label: 'Giao đến', value: card.shipping },
          ]} />

          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="ds-h3">Giao dịch gần đây</h3>
              {txs.length > 0 && <MoreLink to="/giao-dich">Tất cả giao dịch</MoreLink>}
            </div>
            <div className="-mx-6 border-t border-line">
              <TxList transactions={txs.slice(0, 6)} showAccount={false} showCategory={false} onSelect={(t) => setTxId(t.id)} empty="Thẻ chưa có giao dịch" />
            </div>
          </div>
        </div>
      </Drawer>

      <TxDrawer id={txId} onClose={() => setTxId(null)} />
      <LimitModal card={card} open={modal === 'limit'} onClose={() => setModal(null)} />
      <BlockModal card={card} open={modal === 'block'} onClose={() => setModal(null)} />
      <RenameCardModal card={card} open={modal === 'rename'} onClose={() => setModal(null)} />
      <PinModal card={card} open={modal === 'pin'} onClose={() => setModal(null)} />
      <Confirm open={modal === 'cancel'} onClose={() => setModal(null)} danger confirmLabel="Huỷ thẻ vĩnh viễn"
        title={`Huỷ thẻ ••${card.last4}?`}
        desc="Thẻ sẽ ngừng hoạt động ngay và không thể khôi phục. Các thuê bao định kỳ trên thẻ này sẽ bị từ chối."
        onConfirm={() => { update('cards', card.id, { status: 'cancelled' }); toast({ title: 'Đã huỷ thẻ', desc: `${card.nickname} ••${card.last4}` }) }} />
    </>
  )
}
