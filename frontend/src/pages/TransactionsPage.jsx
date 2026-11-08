/* ==========================================================
   Giao dịch — bảng giao dịch đầy đủ: tìm kiếm, bộ lọc, chế độ xem đã lưu,
   chọn nhiều để phân loại hàng loạt, xuất CSV, ngăn kéo chi tiết.
   ========================================================== */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Filter, CalendarDays, Coins, Bookmark, Download, ReceiptText, Paperclip, Plus, X, ChevronDown, CreditCard, ArrowDownLeft, ArrowUpRight,
  ArrowLeftRight, Repeat, Tag, StickyNote, Check, Save, Trash2, Percent,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { TODAY, addDays, formatDay, formatDate, formatNumber } from '@/lib/format'
import { filterTransactions, sum } from '@/lib/selectors'
import { useBank, toast, newId } from '@/store'
import { CATEGORIES, METHOD_LABEL, STATUS_LABEL, categoryList, txName } from '@/data/transactions'
import {
  Button, Card, PageHeader, SearchInput, Popover, Menu, Checkbox, Input, MoneyInput, Badge, Money, TxAvatar, CategoryTag,
  Table, THead, Th, Tr, Td, EmptyState, Modal, Textarea, Segmented, FileDrop, Avatar, Callout,
} from '@/components/ui'
import { TxDrawer } from '@/features/transactions/TxDrawer'

const PAGE = 50

/* ---------- Khoảng ngày ---------- */
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1)
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const DATE_PRESETS = [
  { id: 'month', label: 'Tháng này', range: () => [startOfMonth(TODAY), TODAY] },
  { id: 'last-month', label: 'Tháng trước', range: () => [new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1), addDays(startOfMonth(TODAY), -1)] },
  { id: '30', label: '30 ngày qua', range: () => [addDays(TODAY, -30), TODAY] },
  { id: '90', label: '90 ngày qua', range: () => [addDays(TODAY, -90), TODAY] },
  { id: 'q3', label: 'Quý 3/2026', range: () => [new Date(2026, 6, 1), new Date(2026, 8, 30)] },
  { id: 'year', label: 'Từ đầu năm', range: () => [new Date(TODAY.getFullYear(), 0, 1), TODAY] },
]

/** Nút lọc dạng viên: hiện giá trị đang chọn */
function FilterButton({ icon: Icon, label, value, active, ...p }) {
  return (
    <button {...p} className={cn(
      'inline-flex items-center gap-1.5 h-9 rounded-[10px] border px-3 text-[13px] font-[550] transition-colors whitespace-nowrap',
      active ? 'border-brand-200 bg-brand-50 text-brand-ink' : 'border-line-strong bg-surface text-dim hover:bg-subtle',
    )}>
      <Icon size={15} />{active && value ? value : label}<ChevronDown size={14} className="opacity-60" />
    </button>
  )
}

function CheckList({ options, value = [], onChange }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto px-1 py-1">
      {options.map((o) => <Checkbox key={o.value} label={o.label} checked={value.includes(o.value)} onChange={() => toggle(o.value)} />)}
    </div>
  )
}

/* ---------- Bộ lọc nâng cao ---------- */
function FiltersPanel({ f, setF, accounts, team, close }) {
  const [tab, setTab] = useState('category')
  const sections = {
    category: { label: 'Danh mục', el: <CheckList value={f.category} onChange={(v) => setF({ ...f, category: v })} options={[...categoryList.map((c) => ({ value: c.id, label: c.label })), { value: 'uncategorized', label: 'Chưa phân loại' }]} /> },
    account: { label: 'Tài khoản', el: <CheckList value={f.account} onChange={(v) => setF({ ...f, account: v })} options={accounts.map((a) => ({ value: a.id, label: `${a.name} ••${a.last4}` }))} /> },
    method: { label: 'Phương thức', el: <CheckList value={f.method} onChange={(v) => setF({ ...f, method: v })} options={Object.entries(METHOD_LABEL).map(([value, label]) => ({ value, label }))} /> },
    status: { label: 'Trạng thái', el: <CheckList value={f.status} onChange={(v) => setF({ ...f, status: v })} options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))} /> },
    member: { label: 'Người dùng thẻ', el: <CheckList value={f.member} onChange={(v) => setF({ ...f, member: v })} options={team.map((m) => ({ value: m.id, label: m.name }))} /> },
    receipt: { label: 'Chứng từ', el: (
      <div className="flex flex-col gap-2.5 px-1 py-1">
        {[['', 'Tất cả'], ['missing', 'Thiếu chứng từ'], ['attached', 'Đã có chứng từ']].map(([v, l]) => (
          <Checkbox key={v} label={l} checked={(f.receipt || '') === v} onChange={() => setF({ ...f, receipt: v || null })} />
        ))}
      </div>
    ) },
  }
  return (
    <div className="flex w-[min(520px,calc(100vw-32px))]">
      <div className="w-40 shrink-0 border-r border-line pr-1.5 flex flex-col gap-0.5">
        {Object.entries(sections).map(([k, s]) => {
          const n = Array.isArray(f[k]) ? f[k].length : f[k] ? 1 : 0
          return (
            <button key={k} onClick={() => setTab(k)} className={cn('flex items-center justify-between rounded-lg px-2.5 h-9 text-[13px] text-left', tab === k ? 'bg-hover font-[600]' : 'text-dim hover:bg-hover')}>
              {s.label}{n > 0 && <span className="num text-[11px] rounded bg-brand-500 text-white dark:text-[#06140f] px-1.5">{n}</span>}
            </button>
          )
        })}
      </div>
      <div className="flex-1 min-w-0 pl-3 flex flex-col">
        <div className="ds-label mb-2 mt-1">{sections[tab].label}</div>
        <div className="flex-1">{sections[tab].el}</div>
        <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-line">
          <Button size="sm" variant="ghost" onClick={() => setF({ ...f, category: [], account: [], method: [], status: [], member: [], receipt: null })}>Xoá lọc</Button>
          <Button size="sm" variant="primary" onClick={close}>Xong</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Xuất CSV thật ---------- */
function exportCSV(rows, accounts) {
  const head = ['Ngày', 'Đối tác', 'Số tiền (VND)', 'Tài khoản', 'Phương thức', 'Danh mục', 'Trạng thái', 'Ghi chú', 'Mã giao dịch']
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.map((t) => {
    const a = accounts.find((x) => x.id === t.account)
    return [formatDate(t.date), txName(t), t.amount, a ? `${a.name} ••${a.last4}` : '', t.card ? `Thẻ ••${t.card}` : METHOD_LABEL[t.method], CATEGORIES[t.category]?.label || 'Chưa phân loại', STATUS_LABEL[t.status], t.note, t.id.toUpperCase()].map(esc).join(',')
  })
  const blob = new Blob(['﻿' + [head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `giao-dich-sen-viet-${iso(TODAY)}.csv`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const EMPTY = { q: '', category: [], account: [], method: [], status: [], member: [], receipt: null, direction: null, min: '', max: '', from: null, to: null, preset: null }

export default function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const { transactions, accounts, team, savedViews, updateMany, add, remove } = useBank()
  const [f, setF] = useState(() => {
    const init = { ...EMPTY }
    const loc = params.get('loc')
    if (loc === 'chua-phan-loai') init.category = ['uncategorized']
    if (loc === 'thieu-chung-tu') init.receipt = 'missing'
    if (params.get('danh-muc')) init.category = [params.get('danh-muc')]
    if (params.get('the')) init.method = ['card']
    if (params.get('tai-khoan')) init.account = [params.get('tai-khoan')]
    return init
  })
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })
  const [limit, setLimit] = useState(PAGE)
  const [sel, setSel] = useState([])
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [matchOpen, setMatchOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [viewName, setViewName] = useState('')
  const [activeView, setActiveView] = useState(null)
  const openId = params.get('id')
  const setOpen = (id) => { const p = new URLSearchParams(params); id ? p.set('id', id) : p.delete('id'); setParams(p, { replace: true }) }

  useEffect(() => { setLimit(PAGE) }, [f, sort])

  const rows = useMemo(() => {
    const list = filterTransactions(transactions, f)
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...list].sort((a, b) => sort.key === 'amount' ? (Math.abs(a.amount) - Math.abs(b.amount)) * dir : (a.date < b.date ? -1 : 1) * dir)
  }, [transactions, f, sort])

  const stats = useMemo(() => {
    const real = rows.filter((t) => t.status !== 'failed' && t.category !== 'transfer')
    const inflow = sum(real.filter((t) => t.amount > 0), (t) => t.amount)
    const outflow = sum(real.filter((t) => t.amount < 0), (t) => t.amount)
    return { inflow, outflow, net: inflow + outflow }
  }, [rows])

  const shown = rows.slice(0, limit)
  const allSel = shown.length > 0 && shown.every((t) => sel.includes(t.id))
  const someSel = sel.length > 0 && !allSel

  const filterCount = ['category', 'account', 'method', 'status', 'member'].reduce((n, k) => n + (f[k].length ? 1 : 0), 0) + (f.receipt ? 1 : 0)
  const dateLabel = f.preset ? DATE_PRESETS.find((p) => p.id === f.preset)?.label : f.from || f.to ? `${f.from ? formatDay(f.from) : '…'} – ${f.to ? formatDay(f.to) : '…'}` : null
  const amountLabel = f.min || f.max || f.direction
    ? [f.direction === 'in' ? 'Tiền vào' : f.direction === 'out' ? 'Tiền ra' : null, f.min || f.max ? `${f.min ? formatNumber(f.min) : '0'} – ${f.max ? formatNumber(f.max) : '∞'} ₫` : null].filter(Boolean).join(' · ')
    : null
  const dirty = JSON.stringify({ ...f }) !== JSON.stringify(EMPTY)

  const chips = [
    ...f.category.map((c) => ({ k: 'category', v: c, label: c === 'uncategorized' ? 'Chưa phân loại' : CATEGORIES[c]?.label })),
    ...f.account.map((a) => ({ k: 'account', v: a, label: accounts.find((x) => x.id === a)?.name })),
    ...f.method.map((m) => ({ k: 'method', v: m, label: METHOD_LABEL[m] })),
    ...f.status.map((s) => ({ k: 'status', v: s, label: STATUS_LABEL[s] })),
    ...f.member.map((m) => ({ k: 'member', v: m, label: team.find((x) => x.id === m)?.name })),
    f.receipt && { k: 'receipt', label: f.receipt === 'missing' ? 'Thiếu chứng từ' : 'Đã có chứng từ' },
  ].filter(Boolean)
  const dropChip = (c) => setF(c.k === 'receipt' ? { ...f, receipt: null } : { ...f, [c.k]: f[c.k].filter((x) => x !== c.v) })

  const bulkCategory = (cat) => {
    updateMany('transactions', sel, { category: cat })
    toast({ title: `Đã gán “${CATEGORIES[cat].label}” cho ${sel.length} giao dịch` })
    setSel([])
  }
  const applyView = (v) => { setF({ ...EMPTY, ...v.filters }); setActiveView(v.id) }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Giao dịch" actions={<>
        <Button variant="secondary" icon={ReceiptText} onClick={() => setMatchOpen(true)}>Khớp chứng từ</Button>
        <Popover align="end" width={240} trigger={(p) => <Button {...p} variant="secondary" icon={Download}>Xuất dữ liệu</Button>}>
          {(close) => <Menu onClose={close} items={[
            { label: `Tệp CSV (${rows.length} giao dịch)`, desc: 'Mở được bằng Excel, Google Sheets', onClick: () => { exportCSV(rows, accounts); toast('Đã tải tệp CSV') } },
            { label: 'Sao kê PDF theo tháng', onClick: () => toast({ title: 'Đang tạo sao kê', desc: 'Sao kê tháng 10/2026 sẽ được gửi vào email của bạn.' }) },
            { label: 'Đồng bộ sang MISA', onClick: () => toast({ title: 'Đã đồng bộ', desc: `${rows.length} giao dịch đã được gửi sang MISA AMIS.` }) },
          ]} />}
        </Popover>
      </>} />

      {/* ---- Thanh lọc ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover width={260} trigger={(p) => <FilterButton {...p} icon={Bookmark} label="Chế độ xem" value={savedViews.find((v) => v.id === activeView)?.name} active={!!activeView} />}>
          {(close) => (
            <Menu onClose={close} items={[
              { heading: 'Đã lưu' },
              ...savedViews.map((v) => ({ label: v.name, checked: activeView === v.id, onClick: () => applyView(v) })),
              { divider: true },
              { label: 'Lưu bộ lọc hiện tại…', icon: Save, disabled: !dirty, onClick: () => setSaveOpen(true) },
              activeView && { label: 'Xoá chế độ xem này', icon: Trash2, danger: true, onClick: () => { remove('savedViews', activeView); setActiveView(null); setF(EMPTY); toast('Đã xoá chế độ xem') } },
            ]} />
          )}
        </Popover>
        <span className="hidden sm:block h-6 w-px bg-line mx-0.5" />
        <Popover width={undefined} trigger={(p) => <FilterButton {...p} icon={Filter} label="Bộ lọc" value={`Bộ lọc · ${filterCount}`} active={filterCount > 0} />}>
          {(close) => <FiltersPanel f={f} setF={(x) => { setF(x); setActiveView(null) }} accounts={accounts} team={team} close={close} />}
        </Popover>
        <Popover width={300} trigger={(p) => <FilterButton {...p} icon={CalendarDays} label="Thời gian" value={dateLabel} active={!!dateLabel} />}>
          {(close) => (
            <div className="p-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                {DATE_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => { const [from, to] = p.range(); setF({ ...f, from: iso(from), to: iso(to), preset: p.id }); close() }}
                    className={cn('h-9 rounded-lg text-[13px] border', f.preset === p.id ? 'border-brand-300 bg-brand-50 text-brand-ink font-[600]' : 'border-line hover:bg-subtle')}>{p.label}</button>
                ))}
              </div>
              <div className="ds-label mt-4 mb-2">Tuỳ chọn</div>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" size="sm" value={f.from || ''} onChange={(e) => setF({ ...f, from: e.target.value || null, preset: null })} aria-label="Từ ngày" />
                <Input type="date" size="sm" value={f.to || ''} onChange={(e) => setF({ ...f, to: e.target.value || null, preset: null })} aria-label="Đến ngày" />
              </div>
              {(f.from || f.to) && <Button size="sm" variant="ghost" className="mt-2" onClick={() => setF({ ...f, from: null, to: null, preset: null })}>Xoá khoảng ngày</Button>}
            </div>
          )}
        </Popover>
        <Popover width={300} trigger={(p) => <FilterButton {...p} icon={Coins} label="Số tiền" value={amountLabel} active={!!amountLabel} />}>
          {() => (
            <div className="p-1.5 flex flex-col gap-3">
              <Segmented size="sm" value={f.direction || 'all'} onChange={(v) => setF({ ...f, direction: v === 'all' ? null : v })}
                options={[{ value: 'all', label: 'Tất cả' }, { value: 'in', label: 'Tiền vào', icon: ArrowDownLeft }, { value: 'out', label: 'Tiền ra', icon: ArrowUpRight }]} />
              <div className="grid grid-cols-2 gap-2">
                <MoneyInput size="sm" label="Từ" value={Number(f.min) || 0} onChange={(v) => setF({ ...f, min: v || '' })} />
                <MoneyInput size="sm" label="Đến" value={Number(f.max) || 0} onChange={(v) => setF({ ...f, max: v || '' })} />
              </div>
            </div>
          )}
        </Popover>
        <div className="flex-1" />
        <SearchInput value={f.q} onChange={(q) => setF({ ...f, q })} placeholder="Tìm đối tác, ghi chú, số tiền" className="w-full sm:w-72 order-first sm:order-none" />
      </div>

      {(chips.length > 0 || dirty) && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {chips.map((c) => (
            <span key={c.k + (c.v || '')} className="inline-flex items-center gap-1 h-7 rounded-full bg-subtle border border-line pl-2.5 pr-1 text-[12.5px]">
              {c.label}<button onClick={() => dropChip(c)} className="size-5 grid place-items-center rounded-full hover:bg-hover text-muted" aria-label={'Bỏ lọc ' + c.label}><X size={12} /></button>
            </span>
          ))}
          {dirty && <button onClick={() => { setF(EMPTY); setActiveView(null) }} className="text-[12.5px] font-[550] text-brand-ink hover:underline ml-1">Xoá tất cả bộ lọc</button>}
        </div>
      )}

      {/* ---- Bảng ---- */}
      <Card padded={false} className="mt-4 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 border-b border-line">
          <div><div className="text-[12.5px] text-muted">Thay đổi ròng</div><Money value={stats.net} sign className="text-[19px] font-[520]" /></div>
          <div><div className="text-[12.5px] text-muted">Tiền vào</div><Money value={stats.inflow} className="text-[19px] font-[520] text-pos" /></div>
          <div><div className="text-[12.5px] text-muted">Tiền ra</div><Money value={stats.outflow} className="text-[19px] font-[520]" /></div>
          <div><div className="text-[12.5px] text-muted">Số giao dịch</div><div className="text-[19px] font-[520] num">{formatNumber(rows.length)}</div></div>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Không có giao dịch phù hợp" desc="Thử bỏ bớt bộ lọc hoặc đổi từ khoá tìm kiếm." action={<Button onClick={() => setF(EMPTY)}>Xoá bộ lọc</Button>} />
        ) : (
          <Table minWidth={980} fixed>
            <THead>
              <Th width={44}><Checkbox checked={allSel} indeterminate={someSel} onChange={() => setSel(allSel ? [] : shown.map((t) => t.id))} /></Th>
              <Th width={84} sort={sort.key === 'date' ? sort.dir : null} onSort={() => setSort({ key: 'date', dir: sort.key === 'date' && sort.dir === 'desc' ? 'asc' : 'desc' })}>Ngày</Th>
              <Th>Đối tác</Th>
              <Th align="right" width={150} sort={sort.key === 'amount' ? sort.dir : null} onSort={() => setSort({ key: 'amount', dir: sort.key === 'amount' && sort.dir === 'desc' ? 'asc' : 'desc' })}>Số tiền</Th>
              <Th width={178}>Tài khoản</Th>
              <Th width={158}>Phương thức</Th>
              <Th width={180}>Danh mục</Th>
              <Th width={84} align="right">Chứng từ</Th>
            </THead>
            <tbody>
              {shown.map((t) => {
                const acc = accounts.find((a) => a.id === t.account)
                const on = sel.includes(t.id)
                const MIcon = t.card ? CreditCard : t.method === 'internal' ? ArrowLeftRight : t.method === 'direct_debit' ? Repeat : t.method === 'interest' ? Percent : t.amount > 0 ? ArrowDownLeft : ArrowUpRight
                return (
                  <Tr key={t.id} selected={on || openId === t.id} onClick={() => setOpen(t.id)}>
                    <Td onClick={(e) => e.stopPropagation()}><Checkbox checked={on} onChange={() => setSel(on ? sel.filter((x) => x !== t.id) : [...sel, t.id])} /></Td>
                    <Td className="text-dim whitespace-nowrap">{formatDay(t.date)}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TxAvatar tx={t} size={28} />
                        <span className="truncate font-[520]">{txName(t)}</span>
                        {t.status === 'pending' && <Badge size="sm" tone="warn">Đang xử lý</Badge>}
                        {t.status === 'failed' && <Badge size="sm" tone="neg">Thất bại</Badge>}
                        {t.note && <StickyNote size={13} className="text-faint shrink-0" title={t.note} />}
                      </div>
                    </Td>
                    <Td align="right"><Money value={t.amount} sign tone strike={t.status === 'failed'} className="font-[550]" /></Td>
                    <Td className="text-dim truncate">{acc ? `${acc.name} ••${acc.last4}` : '—'}</Td>
                    <Td className="text-dim"><span className="flex items-center gap-1.5 min-w-0"><MIcon size={14} className="text-faint shrink-0" /><span className="truncate">{t.card ? `Thẻ ••${t.card}` : METHOD_LABEL[t.method]}</span></span></Td>
                    <Td onClick={(e) => e.stopPropagation()}>
                      {t.category === 'transfer' ? <CategoryTag id="transfer" /> : (
                        <Popover width={240} trigger={(p) => (
                          <button {...p} className="w-full flex items-center justify-between gap-1 rounded-lg px-2 -mx-2 h-8 hover:bg-hover text-left">
                            <CategoryTag id={t.category} /><ChevronDown size={13} className="text-faint opacity-0 group-hover:opacity-100 shrink-0" />
                          </button>
                        )}>
                          {(close) => <Menu onClose={close} items={categoryList.filter((c) => c.id !== 'transfer').map((c) => ({
                            label: c.label, checked: t.category === c.id,
                            onClick: () => { useBank.getState().update('transactions', t.id, { category: c.id }); toast({ title: 'Đã cập nhật danh mục', desc: `${txName(t)} → ${c.label}` }) },
                          }))} />}
                        </Popover>
                      )}
                    </Td>
                    <Td align="right">
                      {t.amount < 0 && t.category !== 'transfer'
                        ? t.receipt
                          ? <span className="inline-grid place-items-center size-7 rounded-lg bg-pos-soft text-pos" title="Đã có chứng từ"><Paperclip size={14} /></span>
                          : <span className="inline-grid place-items-center size-7 rounded-lg border border-dashed border-line-strong text-faint" title="Chưa có chứng từ"><Plus size={14} /></span>
                        : null}
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
        {rows.length > limit && (
          <div className="flex items-center justify-center gap-3 py-4 border-t border-line">
            <span className="ds-caption">Đang hiện {shown.length}/{rows.length}</span>
            <Button size="sm" onClick={() => setLimit(limit + PAGE)}>Tải thêm</Button>
          </div>
        )}
      </Card>

      {/* ---- Thanh hành động hàng loạt ---- */}
      {sel.length > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 lg:ml-[124px] z-50 flex items-center gap-1 rounded-2xl bg-[#17201c] text-white dark:bg-[#e9efec] dark:text-[#0c120f] pl-4 pr-1.5 py-1.5 shadow-lg animate-slide-up max-w-[calc(100vw-24px)] overflow-x-auto">
          <span className="text-[13.5px] font-[600] whitespace-nowrap pr-2">Đã chọn {sel.length}</span>
          <Popover width={240} trigger={(p) => <button {...p} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-[550] hover:bg-white/10 dark:hover:bg-black/10 whitespace-nowrap"><Tag size={15} />Gán danh mục</button>}>
            {(close) => <Menu onClose={close} items={categoryList.filter((c) => c.id !== 'transfer').map((c) => ({ label: c.label, onClick: () => bulkCategory(c.id) }))} />}
          </Popover>
          <button onClick={() => setNoteOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-[550] hover:bg-white/10 dark:hover:bg-black/10 whitespace-nowrap"><StickyNote size={15} />Ghi chú</button>
          <button onClick={() => { exportCSV(rows.filter((t) => sel.includes(t.id)), accounts); toast(`Đã xuất ${sel.length} giao dịch`) }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-[550] hover:bg-white/10 dark:hover:bg-black/10 whitespace-nowrap"><Download size={15} />Xuất</button>
          <button onClick={() => setSel([])} className="size-9 grid place-items-center rounded-xl hover:bg-white/10 dark:hover:bg-black/10" aria-label="Bỏ chọn"><X size={16} /></button>
        </div>
      )}

      <TxDrawer id={openId} onClose={() => setOpen(null)} />

      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={`Thêm ghi chú cho ${sel.length} giao dịch`} size="sm"
        footer={<><Button variant="secondary" onClick={() => setNoteOpen(false)}>Huỷ</Button><Button variant="primary" disabled={!note.trim()} onClick={() => { updateMany('transactions', sel, { note }); toast(`Đã thêm ghi chú cho ${sel.length} giao dịch`); setSel([]); setNote(''); setNoteOpen(false) }}>Lưu ghi chú</Button></>}>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Chi phí dự án Tre Việt Xanh" autoFocus />
      </Modal>

      <Modal open={saveOpen} onClose={() => setSaveOpen(false)} title="Lưu chế độ xem" desc="Mở lại nhanh bộ lọc này từ nút Chế độ xem." size="sm"
        footer={<><Button variant="secondary" onClick={() => setSaveOpen(false)}>Huỷ</Button><Button variant="primary" icon={Check} disabled={!viewName.trim()} onClick={() => {
          const v = { id: newId('v'), name: viewName.trim(), filters: { ...f, q: '' } }
          add('savedViews', v, { prepend: false }); setActiveView(v.id); setViewName(''); setSaveOpen(false); toast({ title: 'Đã lưu chế độ xem', desc: v.name })
        }}>Lưu</Button></>}>
        <Input label="Tên chế độ xem" value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="VD: Chi phí đi lại quý 4" autoFocus />
      </Modal>

      <ReceiptMatch open={matchOpen} onClose={() => setMatchOpen(false)} />
    </div>
  )
}

/* ---------- Khớp chứng từ tự động (mô phỏng) ---------- */
function ReceiptMatch({ open, onClose }) {
  const transactions = useBank((s) => s.transactions)
  const updateMany = useBank((s) => s.updateMany)
  const [file, setFile] = useState(null)
  const [phase, setPhase] = useState('idle')
  const missing = transactions.filter((t) => t.amount < -200000 && !t.receipt && t.category !== 'transfer' && t.status === 'posted')
  const matched = missing.slice(0, 4)
  useEffect(() => { if (!open) { setFile(null); setPhase('idle') } }, [open])
  const start = (f) => { setFile(f); if (f) { setPhase('reading'); setTimeout(() => setPhase('done'), 1400) } }
  return (
    <Modal open={open} onClose={onClose} title="Khớp chứng từ" desc="Tải lên ảnh hoặc PDF hoá đơn, Mạch sẽ tự tìm giao dịch tương ứng." size="md"
      footer={phase === 'done'
        ? <><Button variant="secondary" onClick={onClose}>Để sau</Button><Button variant="primary" onClick={() => { updateMany('transactions', matched.map((t) => t.id), { receipt: true }); toast(`Đã đính kèm chứng từ cho ${matched.length} giao dịch`); onClose() }}>Xác nhận {matched.length} kết quả</Button></>
        : <Button variant="secondary" onClick={onClose}>Đóng</Button>}>
      {phase === 'idle' && (
        <div className="flex flex-col gap-4">
          <FileDrop value={file} onChange={start} label="Kéo thả nhiều hoá đơn vào đây" hint="Hỗ trợ PDF, JPG, PNG · hoặc chuyển tiếp email đến hoadon@senviet.mach.vn" />
          <Callout tone="neutral">Hiện có <b>{missing.length} giao dịch</b> trên 200.000 ₫ chưa có chứng từ.</Callout>
        </div>
      )}
      {phase === 'reading' && (
        <div className="flex flex-col gap-3 py-2">
          <div className="text-[13.5px] text-muted">Đang đọc hoá đơn bằng AI…</div>
          {[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      )}
      {phase === 'done' && (
        <div className="flex flex-col gap-2">
          <Callout tone="pos" icon={Check}>Đã tìm thấy {matched.length} giao dịch khớp với chứng từ.</Callout>
          {matched.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5">
              <TxAvatar tx={t} size={30} />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-[550] truncate">{txName(t)}</div><div className="ds-caption">{formatDay(t.date)}</div></div>
              <Money value={t.amount} className="text-[13.5px] font-[550]" />
              <Avatar name="AI" color="#138f66" size={22} />
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
