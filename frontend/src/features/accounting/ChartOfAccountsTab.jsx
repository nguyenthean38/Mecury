/* ==========================================================
   Kế toán — Hệ thống tài khoản (Thông tư 200/2014/TT-BTC) & ánh xạ danh mục
   ========================================================== */
import { Fragment, useMemo, useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBank, toast } from '@/store'
import { CATEGORY_LEDGER } from '@/data/books'
import { CATEGORIES } from '@/data/transactions'
import { Card, CardHeader, Badge, Button, Callout, Input, Modal, Select, SearchInput, EmptyState, CategoryTag } from '@/components/ui'
import { ALL_LEDGER, LEDGER_TYPES, POSTABLE_LEDGER, balanceSide, ledgerName } from './shared'

function NewAccountModal({ existing, onClose, onSave }) {
  const [f, setF] = useState({ code: '', name: '', type: 'Chi phí' })
  const taken = existing.some((a) => a.code === f.code.trim())
  const ok = /^\d{3,5}$/.test(f.code.trim()) && !taken && f.name.trim().length > 2
  return (
    <Modal open onClose={onClose} size="sm" title="Thêm tài khoản" desc="Thêm tài khoản chi tiết (cấp 2, cấp 3) dưới tài khoản theo Thông tư 200."
      footer={<><Button variant="ghost" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={() => onSave({ code: f.code.trim(), name: f.name.trim(), type: f.type, custom: true })}>Thêm tài khoản</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Số hiệu tài khoản" value={f.code} inputMode="numeric" onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '').slice(0, 5) })} placeholder="VD: 6429" autoFocus
          error={taken ? 'Số hiệu này đã tồn tại.' : undefined} hint="3 – 5 chữ số" />
        <Input label="Tên tài khoản" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="VD: Chi phí đào tạo nhân sự" />
        <Select label="Loại tài khoản" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} options={LEDGER_TYPES} />
      </div>
    </Modal>
  )
}

export function ChartOfAccountsTab() {
  const transactions = useBank((s) => s.transactions)
  const journal = useBank((s) => s.journal)
  const [accounts, setAccounts] = useState(ALL_LEDGER)
  const [mapping, setMapping] = useState(CATEGORY_LEDGER)
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)

  const used = useMemo(() => new Set([...Object.values(mapping), ...journal.flatMap((j) => j.lines.map((l) => l.acc))]), [mapping, journal])
  const txCount = useMemo(() => {
    const m = {}
    transactions.forEach((t) => { if (t.category) m[t.category] = (m[t.category] || 0) + 1 })
    return m
  }, [transactions])

  const k = q.trim().toLowerCase()
  const shown = accounts.filter((a) => !k || `${a.code} ${a.name}`.toLowerCase().includes(k))
  const groups = LEDGER_TYPES.map((type) => ({ type, items: shown.filter((a) => a.type === type).sort((a, b) => a.code.localeCompare(b.code)) })).filter((g) => g.items.length)
  const accOptions = [...POSTABLE_LEDGER, ...accounts.filter((a) => a.custom)].map((a) => ({ value: a.code, label: `${a.code} — ${a.name}` }))

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Callout tone="brand" icon={BookOpen} title="Theo Thông tư 200/2014/TT-BTC">
        Hệ thống tài khoản rút gọn cho doanh nghiệp dịch vụ. Mạch tự hạch toán giao dịch ngân hàng theo bảng ánh xạ danh mục bên dưới và xuất được sang MISA, Fast.
      </Callout>

      <div className="grid gap-4 lg:grid-cols-[1fr_400px] items-start">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-line">
            <div>
              <h3 className="ds-h3">Hệ thống tài khoản</h3>
              <p className="ds-caption mt-0.5">{accounts.length} tài khoản · {used.size} đang được sử dụng</p>
            </div>
            <div className="flex items-center gap-2">
              <SearchInput value={q} onChange={setQ} placeholder="Số hiệu hoặc tên" className="flex-1 sm:w-56" />
              <Button variant="outline" icon={Plus} onClick={() => setAdding(true)}>Thêm</Button>
            </div>
          </div>
          {groups.length === 0 ? (
            <EmptyState compact title="Không tìm thấy tài khoản" desc={`Không có tài khoản nào khớp “${q}”.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px] min-w-[520px]">
                <thead>
                  <tr className="border-b border-line text-[12.5px] text-muted">
                    <th className="h-10 pl-5 pr-3 text-left font-[550] w-24">Số hiệu</th>
                    <th className="h-10 px-3 text-left font-[550]">Tên tài khoản</th>
                    <th className="h-10 px-3 text-left font-[550] w-24">Tính chất</th>
                    <th className="h-10 pl-3 pr-5 text-right font-[550] w-32">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <Fragment key={g.type}>
                      <tr className="bg-subtle border-b border-line">
                        <td colSpan={4} className="h-8 pl-5 ds-label">{g.type} <span className="text-faint normal-case tracking-normal font-normal">· {g.items.length}</span></td>
                      </tr>
                      {g.items.map((a) => {
                        const child = a.code.length > 3 && accounts.some((p) => p.code === a.code.slice(0, 3))
                        return (
                          <tr key={a.code} className="border-b border-line last:border-0 hover:bg-subtle transition-colors">
                            <td className={cn('h-11 pl-5 pr-3 font-mono text-[12.5px]', child && 'pl-9 text-dim', a.parent && 'font-[650]')}>{a.code}</td>
                            <td className={cn('h-11 px-3', a.parent && 'font-[600]')}>{a.name}</td>
                            <td className="h-11 px-3 text-dim">{a.parent ? '' : balanceSide(a)}</td>
                            <td className="h-11 pl-3 pr-5 text-right">
                              {a.custom ? <Badge size="sm" tone="info">Mới thêm</Badge>
                                : a.parent ? <span className="ds-caption">Tổng hợp</span>
                                : used.has(a.code) ? <Badge size="sm" tone="brand">Đang dùng</Badge> : <span className="ds-caption">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Ánh xạ danh mục → tài khoản" desc="Giao dịch thuộc danh mục sẽ được ghi Nợ/Có vào tài khoản tương ứng." />
          <div className="flex flex-col -mx-1">
            {Object.entries(mapping).map(([cat, code]) => (
              <div key={cat} className="flex items-center gap-3 px-1 py-2 border-b border-line last:border-0">
                <div className="min-w-0 flex-1">
                  <CategoryTag id={cat} />
                  <div className="ds-caption mt-0.5 pl-[26px]">{txCount[cat] || 0} giao dịch</div>
                </div>
                <Select aria-label={`Tài khoản cho danh mục ${CATEGORIES[cat]?.label || cat}`} size="sm" className="w-[170px] shrink-0" value={code}
                  onChange={(e) => {
                    const v = e.target.value
                    setMapping((m) => ({ ...m, [cat]: v }))
                    toast({ title: 'Đã cập nhật ánh xạ', desc: `Giao dịch mới sẽ hạch toán vào TK ${v} — ${ledgerName(v)}` })
                  }}
                  options={accOptions} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {adding && <NewAccountModal existing={accounts} onClose={() => setAdding(false)}
        onSave={(a) => { setAccounts((xs) => [...xs, a]); setAdding(false); toast({ title: 'Đã thêm tài khoản', desc: `${a.code} — ${a.name}`, tone: 'pos' }) }} />}
    </div>
  )
}
