/* ==========================================================
   Thẻ hiển thị từng tài khoản và thẻ tín dụng doanh nghiệp
   ========================================================== */
import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Pencil, Eye, ArrowLeftRight, Send, CreditCard, CalendarClock, Star } from 'lucide-react'
import { formatDate, daysBetween, TODAY, formatPercent } from '@/lib/format'
import { useUI } from '@/store'
import { ACCOUNT_KIND } from '@/data/org'
import { Card, AccountIcon, Money, Badge, IconButton, Popover, Menu, Progress, Button } from '@/components/ui'
import { Sparkline } from '@/components/charts'

/** Một tài khoản: biểu tượng, tên, số dư, đường xu hướng 30 ngày, menu thao tác */
export function AccountTile({ account: a, series, onRename }) {
  const navigate = useNavigate()
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const values = series.map((p) => p.value)
  const change = values.length ? values[values.length - 1] - values[0] : 0
  const open = () => navigate(`/tai-khoan/${a.id}`)

  return (
    <Card padded={false} interactive
      className="group relative flex flex-col p-5 cursor-pointer focus-within:shadow-sm"
      onClick={open}>
      <div className="flex items-start gap-3">
        <AccountIcon kind={a.kind} color={a.color} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <a href={`/tai-khoan/${a.id}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); open() }}
              className="truncate text-[14.5px] font-[600] text-fg hover:underline underline-offset-4">
              {a.name}
            </a>
            <span className="text-muted text-[13.5px] shrink-0">••{a.last4}</span>
            {a.primary && <Star size={13} className="text-gold fill-current shrink-0" aria-label="Tài khoản chính" />}
          </div>
          <div className="ds-caption truncate">{ACCOUNT_KIND[a.kind]} · {a.bank}</div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Popover align="end" width={220} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} size="sm" label={`Thao tác với ${a.name}`} />}>
            {(close) => <Menu onClose={close} items={[
              { label: 'Xem chi tiết', icon: Eye, onClick: open },
              { label: 'Đổi tên', icon: Pencil, onClick: () => onRename(a) },
              { divider: true },
              { label: 'Chuyển tiền đi', icon: Send, onClick: () => openMoveMoney('send', { from: a.id }) },
              { label: 'Chuyển giữa tài khoản', icon: ArrowLeftRight, onClick: () => openMoveMoney('transfer', { from: a.id, to: a.id === 'acc-main' ? 'acc-reserve' : 'acc-main' }) },
            ]} />}
          </Popover>
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <Money value={a.balance} className="text-[24px] font-[500] tracking-tight" />
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {a.apy && <Badge tone="gold" size="sm">Lãi {formatPercent(a.apy)}/năm</Badge>}
            <span className="ds-caption">
              {change === 0 ? 'Không đổi trong 30 ngày' : <><Money value={change} sign className={change > 0 ? 'text-pos' : 'text-dim'} /> 30 ngày</>}
            </span>
          </div>
        </div>
        {values.length > 1 && (
          <div className="shrink-0 hidden min-[420px]:block" aria-hidden>
            <Sparkline values={values} width={96} height={34} color={a.color} />
          </div>
        )}
      </div>
    </Card>
  )
}

/** Tóm tắt thẻ tín dụng doanh nghiệp: hạn mức đã dùng, ngày đến hạn */
export function CreditTile({ credit }) {
  const navigate = useNavigate()
  const used = credit.balance
  const left = credit.limit - used
  const days = daysBetween(TODAY, credit.statementDue)
  return (
    <Card padded={false} className="p-5 flex flex-col">
      <div className="flex items-start gap-3">
        <AccountIcon kind="credit" color="#2b3a33" size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-[600] truncate">{credit.name}</div>
          <div className="ds-caption">Hoàn tiền {formatPercent(credit.cashback)} mọi giao dịch</div>
        </div>
        <Badge tone="brand" size="sm">Tín dụng</Badge>
      </div>
      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="ds-caption">Dư nợ hiện tại</div>
            <Money value={used} className="text-[24px] font-[500] tracking-tight" />
          </div>
          <div className="text-right">
            <div className="ds-caption">Còn khả dụng</div>
            <Money value={left} className="text-[14px] font-[550]" />
          </div>
        </div>
        <Progress value={used} max={credit.limit} className="mt-3" />
        <div className="mt-2 flex items-center justify-between gap-2 ds-caption">
          <span>Đã dùng {Math.round((used / credit.limit) * 100)}% hạn mức <Money value={credit.limit} /></span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-line flex items-center justify-between gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-dim">
          <CalendarClock size={15} className={days <= 7 ? 'text-warn' : 'text-faint'} />
          Đến hạn {formatDate(credit.statementDue)} · tối thiểu <Money value={credit.minDue} className="font-[550]" />
        </span>
        <Button size="sm" variant="outline" icon={CreditCard} onClick={() => navigate('/the')}>Quản lý thẻ</Button>
      </div>
    </Card>
  )
}
