/* ==========================================================
   Kế toán — Sổ nhật ký chung: danh sách bút toán, tạo bút toán, ghi sổ
   ========================================================== */
import { Fragment, useMemo, useState } from 'react'
import { ChevronRight, Plus, Trash2, CheckCircle2, AlertTriangle, MoreHorizontal, Undo2, BookCheck, FileText } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, TODAY } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import {
  Card, Button, IconButton, Modal, Confirm, Input, Select, MoneyInput, SearchInput, Segmented, StatusBadge, Money, EmptyState, Menu, Popover, Callout,
} from '@/components/ui'
import { JOURNAL_STATUS, POSTABLE_LEDGER, ledgerName, sumLines } from './shared'

const iso = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const ACC_OPTIONS = POSTABLE_LEDGER.map((a) => ({ value: a.code, label: `${a.code} — ${a.name}` }))

export function nextJournalNo(journal) {
  const max = journal.reduce((m, j) => Math.max(m, Number(String(j.no).replace(/\D/g, '')) || 0), 1100)
  return `BT-${max + 1}`
}

/* ---------- Mẫu bút toán nhanh ---------- */
const TEMPLATES = [
  { label: 'Khấu hao TSCĐ', desc: 'Khấu hao TSCĐ tháng 11', lines: [{ acc: '6428', debit: 8000000 }, { acc: '214', credit: 8000000 }] },
  { label: 'Phân bổ chi phí trả trước', desc: 'Phân bổ chi phí trả trước tháng 11', lines: [{ acc: '6427', debit: 3500000 }, { acc: '242', credit: 3500000 }] },
  { label: 'Trích lương', desc: 'Trích lương phải trả tháng 11', lines: [{ acc: '6421', debit: 0 }, { acc: '334', credit: 0 }] },
]

const blankLine = (p = {}) => ({ id: newId('l'), acc: '', debit: 0, credit: 0, ...p })

/* ---------- Hộp thoại tạo bút toán ---------- */
function NewEntryModal({ onClose }) {
  const journal = useBank((s) => s.journal)
  const add = useBank((s) => s.add)
  const [f, setF] = useState({ date: iso(TODAY), desc: '', ref: '' })
  const [lines, setLines] = useState([blankLine(), blankLine()])
  const no = nextJournalNo(journal)

  const setLine = (id, patch) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  const totalD = sumLines(lines, 'debit')
  const totalC = sumLines(lines, 'credit')
  const diff = totalD - totalC
  const used = lines.filter((l) => l.debit || l.credit)
  const missingAcc = used.some((l) => !l.acc)
  const balanced = totalD > 0 && diff === 0
  const valid = balanced && !missingAcc && used.length >= 2 && f.desc.trim().length > 2

  const applyTemplate = (t) => {
    setF((x) => ({ ...x, desc: t.desc }))
    setLines(t.lines.map((l) => blankLine({ acc: l.acc, debit: l.debit || 0, credit: l.credit || 0 })))
  }

  const save = (status) => {
    const entry = {
      id: newId('j'), date: f.date, no, desc: f.desc.trim(), status,
      source: f.ref.trim() || 'Nhập tay',
      lines: used.map((l) => (l.debit ? { acc: l.acc, debit: l.debit } : { acc: l.acc, credit: l.credit })),
    }
    add('journal', entry)
    toast({ title: status === 'posted' ? 'Đã ghi sổ bút toán' : 'Đã lưu bút toán nháp', desc: `${no} · ${formatNumber(totalD)} ₫`, tone: 'pos' })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="xl" title="Tạo bút toán" desc={`Số chứng từ ${no} · tổng phát sinh Nợ phải bằng tổng phát sinh Có.`}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Huỷ</Button>
        <Button variant="secondary" disabled={!valid} onClick={() => save('draft')}>Lưu nháp</Button>
        <Button variant="primary" icon={BookCheck} disabled={!valid} onClick={() => save('posted')}>Ghi sổ</Button>
      </>}>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
          <Input type="date" label="Ngày hạch toán" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <Input label="Diễn giải" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="VD: Trích trước chi phí điện tháng 11" autoFocus />
        </div>
        <Input label="Chứng từ gốc" optional value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="VD: Hợp đồng 08/2026/HĐDV" />

        <div className="flex flex-wrap items-center gap-2">
          <span className="ds-caption">Mẫu nhanh:</span>
          {TEMPLATES.map((t) => (
            <button key={t.label} type="button" onClick={() => applyTemplate(t)} className="h-7 rounded-full border border-line px-3 text-[12.5px] text-dim hover:bg-subtle">{t.label}</button>
          ))}
        </div>

        <div className="rounded-xl border border-line overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[1fr_150px_150px_36px] gap-2 px-3 h-9 items-center bg-subtle border-b border-line text-[12.5px] font-[550] text-muted">
              <span>Tài khoản</span><span className="text-right">Nợ</span><span className="text-right">Có</span><span />
            </div>
            {lines.map((l) => (
              <div key={l.id} className="grid grid-cols-[1fr_150px_150px_36px] gap-2 px-3 py-2 items-center border-b border-line">
                <Select aria-label="Tài khoản" size="sm" value={l.acc} onChange={(e) => setLine(l.id, { acc: e.target.value })} placeholder="Chọn tài khoản" options={ACC_OPTIONS} />
                <MoneyInput size="sm" value={l.debit} onChange={(v) => setLine(l.id, { debit: v, credit: v ? 0 : l.credit })} />
                <MoneyInput size="sm" value={l.credit} onChange={(v) => setLine(l.id, { credit: v, debit: v ? 0 : l.debit })} />
                <IconButton icon={Trash2} size="sm" label="Xoá dòng" disabled={lines.length <= 2} onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} />
              </div>
            ))}
            <div className="grid grid-cols-[1fr_150px_150px_36px] gap-2 px-3 h-11 items-center text-[13.5px]">
              <button type="button" onClick={() => setLines((ls) => [...ls, blankLine()])} className="inline-flex items-center gap-1.5 text-brand-ink font-[550] hover:underline underline-offset-4 justify-self-start">
                <Plus size={15} />Thêm dòng
              </button>
              <span className="text-right num font-[600] pr-3">{formatNumber(totalD)}</span>
              <span className="text-right num font-[600] pr-3">{formatNumber(totalC)}</span>
              <span />
            </div>
          </div>
        </div>

        {totalD + totalC > 0 && (balanced
          ? <Callout tone="pos" icon={CheckCircle2}>Bút toán cân: tổng Nợ = tổng Có = {formatNumber(totalD)} ₫.</Callout>
          : <Callout tone="warn" icon={AlertTriangle}>Chưa cân: {diff > 0 ? 'Nợ lớn hơn Có' : 'Có lớn hơn Nợ'} {formatNumber(Math.abs(diff))} ₫.</Callout>)}
        {missingAcc && <p className="text-[12.5px] text-neg -mt-2">Có dòng chưa chọn tài khoản.</p>}
      </div>
    </Modal>
  )
}

/* ---------- Chi tiết dòng Nợ / Có ---------- */
function Lines({ entry }) {
  const total = sumLines(entry.lines, 'debit')
  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-subtle text-muted text-[12px]">
            <th className="h-8 px-3 text-left font-[550] w-16">TK</th>
            <th className="h-8 px-3 text-left font-[550]">Tên tài khoản</th>
            <th className="h-8 px-3 text-right font-[550] w-36">Nợ</th>
            <th className="h-8 px-3 text-right font-[550] w-36">Có</th>
          </tr>
        </thead>
        <tbody>
          {entry.lines.map((l, i) => (
            <tr key={i} className="border-t border-line">
              <td className="h-9 px-3 font-mono text-[12.5px]">{l.acc}</td>
              <td className={cn('h-9 px-3', l.credit && 'pl-8 text-dim')}>{ledgerName(l.acc)}</td>
              <td className="h-9 px-3 text-right">{l.debit ? <Money value={l.debit} /> : ''}</td>
              <td className="h-9 px-3 text-right">{l.credit ? <Money value={l.credit} /> : ''}</td>
            </tr>
          ))}
          <tr className="border-t border-line bg-subtle/60 font-[600]">
            <td className="h-9 px-3" colSpan={2}>Cộng phát sinh</td>
            <td className="h-9 px-3 text-right"><Money value={total} /></td>
            <td className="h-9 px-3 text-right"><Money value={sumLines(entry.lines, 'credit')} /></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

/* ---------- Tab Bút toán ---------- */
export function JournalTab() {
  const journal = useBank((s) => s.journal)
  const { update, add, remove } = useBank()
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState({})
  const [creating, setCreating] = useState(false)
  const [delId, setDelId] = useState(null)

  const drafts = journal.filter((j) => j.status === 'draft').length
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    return [...journal]
      .filter((j) => status === 'all' || j.status === status)
      .filter((j) => !k || `${j.no} ${j.desc} ${j.source} ${j.lines.map((l) => l.acc).join(' ')}`.toLowerCase().includes(k))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.no.localeCompare(a.no)))
  }, [journal, status, q])

  const post = (j) => { update('journal', j.id, { status: 'posted' }); toast({ title: 'Đã ghi sổ', desc: `${j.no} · ${j.desc}`, tone: 'pos' }) }
  const reverse = (j) => {
    const no = nextJournalNo(journal)
    add('journal', {
      id: newId('j'), date: iso(TODAY), no, desc: `Đảo bút toán ${j.no} — ${j.desc}`, source: `Đảo từ ${j.no}`, status: 'draft',
      lines: j.lines.map((l) => (l.debit ? { acc: l.acc, credit: l.debit } : { acc: l.acc, debit: l.credit })),
    })
    toast({ title: 'Đã tạo bút toán đảo', desc: `${no} ở trạng thái nháp, kiểm tra rồi ghi sổ.` })
  }
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const delEntry = journal.find((j) => j.id === delId)

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented size="sm" value={status} onChange={setStatus} options={[
            { value: 'all', label: `Tất cả · ${journal.length}` },
            { value: 'posted', label: 'Đã ghi sổ' },
            { value: 'draft', label: `Nháp${drafts ? ' · ' + drafts : ''}` },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Tìm số CT, diễn giải, tài khoản" className="w-full sm:w-72" />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setCreating(true)}>Tạo bút toán</Button>
      </div>

      <Card padded={false} className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={FileText} title="Không có bút toán phù hợp" desc="Thử đổi bộ lọc hoặc từ khoá tìm kiếm." action={<Button variant="secondary" onClick={() => { setQ(''); setStatus('all') }}>Xoá bộ lọc</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px] min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-[12.5px] text-muted">
                  <th className="h-10 pl-5 w-8" aria-label="Mở rộng" />
                  <th className="h-10 px-3 text-left font-[550] w-28">Ngày</th>
                  <th className="h-10 px-3 text-left font-[550] w-24">Số CT</th>
                  <th className="h-10 px-3 text-left font-[550]">Diễn giải</th>
                  <th className="h-10 px-3 text-right font-[550] w-40">Số tiền</th>
                  <th className="h-10 px-3 text-left font-[550] w-28">Trạng thái</th>
                  <th className="h-10 pr-5 w-28" aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {list.map((j) => {
                  const isOpen = !!open[j.id]
                  return (
                    <Fragment key={j.id}>
                      <tr onClick={() => toggle(j.id)} className={cn('border-b border-line cursor-pointer hover:bg-subtle transition-colors', isOpen && 'bg-subtle/60')}>
                        <td className="h-[52px] pl-5">
                          <button type="button" aria-expanded={isOpen} aria-label={isOpen ? 'Thu gọn' : 'Xem dòng Nợ/Có'} onClick={(e) => { e.stopPropagation(); toggle(j.id) }} className="size-6 grid place-items-center rounded text-faint hover:text-fg">
                            <ChevronRight size={16} className={cn('transition-transform', isOpen && 'rotate-90')} />
                          </button>
                        </td>
                        <td className="px-3 num text-dim">{formatDate(j.date)}</td>
                        <td className="px-3 font-mono text-[12.5px]">{j.no}</td>
                        <td className="px-3">
                          <div className="font-[520] leading-snug">{j.desc}</div>
                          <div className="ds-caption">{j.source} · {j.lines.map((l) => l.acc).join(', ')}</div>
                        </td>
                        <td className="px-3 text-right font-[550]"><Money value={sumLines(j.lines, 'debit')} /></td>
                        <td className="px-3"><StatusBadge map={JOURNAL_STATUS} value={j.status} /></td>
                        <td className="pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {j.status === 'draft' && <Button size="xs" variant="outline" onClick={() => post(j)}>Ghi sổ</Button>}
                            <Popover align="end" width={220} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} size="sm" label={`Thao tác cho ${j.no}`} />}>
                              {(close) => <Menu onClose={close} items={[
                                { label: isOpen ? 'Thu gọn chi tiết' : 'Xem chi tiết Nợ/Có', icon: ChevronRight, onClick: () => toggle(j.id) },
                                j.status === 'posted' && { label: 'Đảo bút toán', icon: Undo2, onClick: () => reverse(j) },
                                j.status === 'draft' && { label: 'Ghi sổ', icon: BookCheck, onClick: () => post(j) },
                                j.status === 'draft' && { divider: true },
                                j.status === 'draft' && { label: 'Xoá bút toán nháp', icon: Trash2, danger: true, onClick: () => setDelId(j.id) },
                              ]} />}
                            </Popover>
                          </div>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-line bg-subtle/60">
                          <td />
                          <td colSpan={6} className="pr-5 pb-4 pt-1 animate-fade-in"><Lines entry={j} /></td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {creating && <NewEntryModal onClose={() => setCreating(false)} />}
      <Confirm open={!!delId} onClose={() => setDelId(null)} danger confirmLabel="Xoá bút toán"
        title="Xoá bút toán nháp?" desc={delEntry ? `${delEntry.no} · ${delEntry.desc}. Thao tác này không thể hoàn tác.` : ''}
        onConfirm={() => { remove('journal', delId); toast({ title: 'Đã xoá bút toán nháp', desc: delEntry?.no }) }} />
    </div>
  )
}
