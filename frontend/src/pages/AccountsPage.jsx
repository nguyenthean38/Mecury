import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Download, Plus } from 'lucide-react'
import { useBank, useUI } from '@/store'
import { balanceSeries, totalBalance } from '@/lib/selectors'
import { formatPercent } from '@/lib/format'
import { PageHeader, Button, Card, Money, Tabs } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { AccountTile, CreditTile } from '@/features/accounts/AccountTiles'
import { NewAccountModal, RenameAccountModal } from '@/features/accounts/AccountModals'
import { AutoRules } from '@/features/accounts/AutoRules'
import { LinkBank } from '@/features/accounts/LinkBank'
import { useLinked } from '@/features/accounts/linkedStore'

const TAB_KEYS = { accounts: 'tai-khoan', rules: 'quy-tac', linked: 'lien-ket' }

function BalanceHero({ accounts, transactions }) {
  const total = totalBalance(accounts)
  const series = useMemo(() => balanceSeries(transactions, accounts, 90), [transactions, accounts])
  const change = total - series[0].value
  const pct = series[0].value ? (change / series[0].value) * 100 : 0
  const share = (a) => (total ? Math.round((a.balance / total) * 100) : 0)
  return (
    <Card padded={false} className="p-5 sm:p-6">
      <div className="grid lg:grid-cols-[minmax(0,300px)_1fr] gap-6 items-stretch">
        <div className="flex flex-col min-w-0">
          <div className="ds-label">Tổng số dư</div>
          <Money value={total} className="ds-amount mt-1.5" />
          <div className="mt-1.5 text-[13px] text-muted">
            <Money value={change} sign className={change >= 0 ? 'text-pos font-[550]' : 'text-neg font-[550]'} />
            <span> ({change >= 0 ? '+' : '−'}{formatPercent(Math.abs(pct))}) trong 90 ngày</span>
          </div>
          {/* tỷ trọng từng tài khoản */}
          <div className="mt-auto pt-6">
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-subtle gap-[2px]" aria-hidden>
              {accounts.filter((a) => a.balance > 0).map((a) => (
                <span key={a.id} title={`${a.name}: ${share(a)}%`} className="block h-full first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${(a.balance / total) * 100}%`, background: a.color, minWidth: 4 }} />
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-[12.5px] min-w-0">
                  <span className="size-2 rounded-full shrink-0" style={{ background: a.color }} />
                  <span className="truncate text-dim">{a.name}</span>
                  <span className="ml-auto num text-muted">{share(a)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="ds-caption">Số dư 90 ngày qua</span>
          </div>
          <AreaChart data={series} height={210} />
        </div>
      </div>
    </Card>
  )
}

export default function AccountsPage() {
  const accounts = useBank((s) => s.accounts)
  const credit = useBank((s) => s.credit)
  const rules = useBank((s) => s.rules)
  const transactions = useBank((s) => s.transactions)
  const openMoveMoney = useUI((s) => s.openMoveMoney)
  const linked = useLinked((s) => s.items)
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState(null)

  const tab = Object.keys(TAB_KEYS).find((k) => TAB_KEYS[k] === params.get('tab')) || 'accounts'
  const setTab = (t) => setParams(t === 'accounts' ? {} : { tab: TAB_KEYS[t] }, { replace: true })

  const sparks = useMemo(() => {
    const out = {}
    accounts.forEach((a) => { out[a.id] = balanceSeries(transactions, accounts, 30, [a.id]) })
    return out
  }, [transactions, accounts])

  return (
    <div>
      <PageHeader title="Tài khoản" desc="Các tài khoản ngân hàng Sen Việt Digital đã kết nối với Mạch, cùng quy tắc tự động."
        actions={<>
          <Button variant="outline" icon={ArrowLeftRight} onClick={() => openMoveMoney('transfer')}>Chuyển giữa tài khoản</Button>
          <Button variant="outline" icon={Download} onClick={() => openMoveMoney('deposit')}>Nhận tiền</Button>
          <Button variant="primary" icon={Plus} onClick={() => setTab('linked')}>Kết nối ngân hàng</Button>
        </>} />

      <BalanceHero accounts={accounts} transactions={transactions} />

      <Tabs className="mt-8 mb-5" value={tab} onChange={setTab} options={[
        { value: 'accounts', label: 'Tài khoản', count: accounts.length + 1 },
        { value: 'rules', label: 'Quy tắc tự động', count: rules.filter((r) => r.active).length },
        { value: 'linked', label: 'Kết nối thêm ngân hàng', count: linked.length || undefined },
      ]} />

      {tab === 'accounts' && (
        <div className="grid md:grid-cols-2 gap-4 animate-fade-in">
          {accounts.map((a) => <AccountTile key={a.id} account={a} series={sparks[a.id] || []} onRename={setRenaming} />)}
          <CreditTile credit={credit} />
          <button type="button" onClick={() => setTab('linked')}
            className="min-h-[148px] rounded-2xl border border-dashed border-line-strong flex flex-col items-center justify-center gap-2 px-4 text-center text-muted hover:bg-subtle hover:text-fg transition-colors">
            <span className="size-10 rounded-full bg-subtle grid place-items-center"><Plus size={18} /></span>
            <span className="text-[13.5px] font-[550]">Kết nối thêm tài khoản ngân hàng</span>
            <span className="ds-caption">Theo dõi số dư ở mọi ngân hàng của công ty tại một nơi</span>
          </button>
        </div>
      )}
      {tab === 'rules' && <div className="animate-fade-in"><AutoRules /></div>}
      {tab === 'linked' && <div className="animate-fade-in"><LinkBank /></div>}

      <NewAccountModal open={creating} onClose={() => setCreating(false)} />
      <RenameAccountModal account={renaming} onClose={() => setRenaming(null)} />
    </div>
  )
}
