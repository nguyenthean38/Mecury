/* ==========================================================
   Danh sách giao dịch gọn (dùng ở Tổng quan, Tài khoản, Thẻ, Ngân sách…)
   <TxList transactions={list} onSelect={(tx) => setId(tx.id)} showAccount />
   ========================================================== */
import { formatDay } from '@/lib/format'
import { useBank } from '@/store'
import { txName } from '@/data/transactions'
import { cn } from '@/lib/cn'
import { TxAvatar, Money, Badge, CategoryTag, EmptyState } from '@/components/ui'

export function TxList({ transactions, onSelect, showAccount = true, showCategory = true, empty = 'Chưa có giao dịch', className }) {
  const accounts = useBank((s) => s.accounts)
  if (!transactions.length) return <EmptyState compact title={empty} desc="Giao dịch mới sẽ xuất hiện ở đây." />
  return (
    <div className={cn('flex flex-col', className)}>
      {transactions.map((t) => {
        const acc = accounts.find((a) => a.id === t.account)
        return (
          <button key={t.id} onClick={() => onSelect?.(t)}
            className="group flex items-center gap-3 px-5 py-3 text-left border-b border-line last:border-0 hover:bg-subtle transition-colors">
            <TxAvatar tx={t} size={34} />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate text-[14px] font-[520]">{txName(t)}</span>
                {t.status === 'pending' && <Badge size="sm" tone="warn">Đang xử lý</Badge>}
                {t.status === 'failed' && <Badge size="sm" tone="neg">Thất bại</Badge>}
              </span>
              <span className="block ds-caption truncate">
                {formatDay(t.date)}
                {showAccount && acc ? ` · ${acc.name} ••${acc.last4}` : ''}
                {t.card ? ` · Thẻ ••${t.card}` : ''}
              </span>
            </span>
            {showCategory && <CategoryTag id={t.category} className="hidden md:inline-flex w-48 shrink-0" />}
            <Money value={t.amount} sign tone strike={t.status === 'failed'} className="text-[14px] font-[550] w-36 text-right shrink-0" />
          </button>
        )
      })}
    </div>
  )
}
