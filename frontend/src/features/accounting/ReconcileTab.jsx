/* ==========================================================
   Kế toán — Đối soát ngân hàng: danh sách kỳ + màn hình khớp sao kê với sổ
   ========================================================== */
import { useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Landmark, BookOpen, Link2, Plus, Undo2, Sparkles, FileDown, Scale } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDate, formatNumber, TODAY } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import { RECONCILIATION, CATEGORY_LEDGER } from '@/data/books'
import { Card, Button, Badge, Progress, Money, Callout, IconButton } from '@/components/ui'
import { RECON_BASE, useReconLines } from './shared'
import { nextJournalNo } from './JournalTab'

const iso = (d) => new Date(d).toISOString().slice(0, 10)

/* ---------- Màn hình khớp ---------- */
function MatchView({ lines, matched, setMatched, onBack, onFinish }) {
  const journal = useBank((s) => s.journal)
  const add = useBank((s) => s.add)
  const done = lines.filter((l) => matched[l.id]).length
  const left = lines.length - done
  const suggestions = lines.filter((l) => l.book && !matched[l.id])

  const match = (l) => { setMatched((m) => ({ ...m, [l.id]: 'matched' })); toast({ title: 'Đã khớp giao dịch', desc: `${l.name} · ${formatNumber(Math.abs(l.amount))} ₫` }) }
  const unmatch = (l) => setMatched((m) => { const n = { ...m }; delete n[l.id]; return n })
  const matchAll = () => {
    setMatched((m) => ({ ...m, ...Object.fromEntries(suggestions.map((l) => [l.id, 'matched'])) }))
    toast({ title: `Đã khớp ${suggestions.length} giao dịch theo gợi ý`, tone: 'pos' })
  }
  const createEntry = (l) => {
    const inflow = l.amount > 0
    const counter = CATEGORY_LEDGER[l.tx.category] || (inflow ? '131' : '6428')
    const amt = Math.abs(l.amount)
    const no = nextJournalNo(journal)
    add('journal', {
      id: newId('j'), date: iso(l.date), no, desc: `${inflow ? 'Thu' : 'Chi'} — ${l.name}`, source: 'Đối soát ngân hàng', status: 'posted',
      lines: inflow ? [{ acc: '1121', debit: amt }, { acc: counter, credit: amt }] : [{ acc: counter, debit: amt }, { acc: '1121', credit: amt }],
    })
    setMatched((m) => ({ ...m, [l.id]: no }))
    toast({ title: 'Đã tạo và ghi sổ bút toán', desc: `${no} · Nợ ${inflow ? '1121' : counter} / Có ${inflow ? counter : '1121'}`, tone: 'pos' })
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton icon={ArrowLeft} label="Quay lại danh sách kỳ đối soát" onClick={onBack} />
          <div className="min-w-0">
            <h3 className="ds-h3">Đối soát tháng 11/2026</h3>
            <p className="ds-caption">Thanh toán chính ••2502 ↔ TK 1121 · đã khớp {RECON_BASE.matched + done}/{RECON_BASE.total}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.length > 0 && <Button variant="secondary" icon={Sparkles} onClick={matchAll}>Khớp tất cả gợi ý ({suggestions.length})</Button>}
          <Button variant="primary" icon={CheckCircle2} disabled={left > 0} onClick={onFinish}>Hoàn tất đối soát</Button>
        </div>
      </div>

      <Progress value={RECON_BASE.matched + done} max={RECON_BASE.total} auto={false} tone={left ? 'brand' : 'pos'} />

      {left === 0 && (
        <Callout tone="pos" icon={CheckCircle2} title="Mọi giao dịch đã khớp">Số dư sổ kế toán TK 1121 bằng số dư sao kê ngân hàng. Bấm “Hoàn tất đối soát” để khoá kỳ.</Callout>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_150px_1fr] gap-4 px-5 h-10 items-center border-b border-line bg-subtle text-[12.5px] font-[550] text-muted">
          <span className="inline-flex items-center gap-1.5"><Landmark size={14} />Sao kê ngân hàng</span>
          <span className="text-center">Đối chiếu</span>
          <span className="inline-flex items-center gap-1.5"><BookOpen size={14} />Sổ kế toán · TK 1121</span>
        </div>
        {lines.map((l) => {
          const state = matched[l.id]
          return (
            <div key={l.id} className={cn('grid md:grid-cols-[1fr_150px_1fr] gap-3 md:gap-4 px-5 py-4 border-b border-line last:border-0 items-center transition-colors', state && 'bg-pos-soft/40')}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-[550] truncate">{l.name}</div>
                  <div className="ds-caption">{formatDate(l.date)} · {l.tx.ref || l.tx.id.toUpperCase()}</div>
                </div>
                <Money value={l.amount} sign tone className="text-[13.5px] font-[550]" />
              </div>

              <div className="flex md:justify-center">
                {state ? (
                  <div className="flex items-center gap-1">
                    <Badge tone="pos" icon={Check}>{state === 'matched' ? 'Đã khớp' : 'Đã ghi sổ'}</Badge>
                    {state === 'matched' && <IconButton icon={Undo2} size="xs" label="Bỏ khớp" onClick={() => unmatch(l)} />}
                  </div>
                ) : l.book ? (
                  <Button size="sm" variant="outline" icon={Link2} onClick={() => match(l)}>Khớp</Button>
                ) : (
                  <Button size="sm" variant="secondary" icon={Plus} onClick={() => createEntry(l)}>Tạo bút toán</Button>
                )}
              </div>

              {l.book ? (
                <div className="flex items-center gap-3 min-w-0 rounded-xl border border-line bg-surface px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] truncate">{l.book.desc}</div>
                    <div className="ds-caption">{formatDate(l.book.date)} · <span className="font-mono">{l.book.no}</span>{!state && <> · <span className="text-pos">gợi ý khớp {l.book.score}%</span></>}</div>
                  </div>
                  <Money value={l.book.amount} sign tone className="text-[13.5px] font-[550]" />
                </div>
              ) : state ? (
                <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[13.5px]">
                  Bút toán <span className="font-mono">{state}</span> vừa tạo từ giao dịch này
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-muted">
                  Chưa có bút toán tương ứng trong sổ — tạo bút toán để ghi nhận.
                </div>
              )}
            </div>
          )
        })}
      </Card>
    </div>
  )
}

/* ---------- Tab Đối soát ---------- */
export function ReconcileTab({ matched, setMatched, finished, setFinished }) {
  const lines = useReconLines()
  const [view, setView] = useState(false)
  const done = lines.filter((l) => matched[l.id]).length

  if (view) {
    return <MatchView lines={lines} matched={matched} setMatched={setMatched} onBack={() => setView(false)}
      onFinish={() => { setFinished(true); setView(false); toast({ title: 'Đã hoàn tất đối soát tháng 11', desc: `${RECON_BASE.total}/${RECON_BASE.total} giao dịch khớp, chênh lệch 0 ₫.`, tone: 'pos' }) }} />
  }

  const periods = RECONCILIATION.map((r) => (r.status === 'in_progress'
    ? { ...r, matched: RECON_BASE.matched + done, status: finished ? 'done' : 'in_progress', closedAt: finished ? TODAY : null }
    : r))

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Callout tone="neutral" icon={Scale}>
        Mạch tự gợi ý khớp giao dịch ngân hàng với bút toán theo số tiền, ngày và nội dung. Kỳ đã hoàn tất sẽ được khoá, không sửa được bút toán trong kỳ.
      </Callout>
      <div className="grid gap-4 md:grid-cols-2">
        {periods.map((r) => {
          const active = r.status === 'in_progress'
          const pct = Math.round((r.matched / r.total) * 100)
          return (
            <Card key={r.month} className={cn('flex flex-col gap-4', active && 'ring-1 ring-brand-200')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="ds-h3">{r.month}</div>
                  <div className="ds-caption mt-0.5">Thanh toán chính ••2502 · TK 1121</div>
                </div>
                {active ? <Badge tone="warn" dot>Đang đối soát</Badge> : <Badge tone="pos" icon={CheckCircle2}>Đã hoàn tất</Badge>}
              </div>
              <div>
                <div className="flex items-baseline justify-between text-[13px] mb-1.5">
                  <span className="text-muted">Đã khớp <b className="text-fg font-[600] num">{r.matched}</b>/{r.total} giao dịch</span>
                  <span className="num font-[550]">{pct}%</span>
                </div>
                <Progress value={r.matched} max={r.total} auto={false} tone={active ? 'brand' : 'pos'} />
              </div>
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="ds-caption">Chênh lệch: <span className="num text-fg">{formatNumber(r.diff)} ₫</span></span>
                {active
                  ? <Button size="sm" variant="primary" onClick={() => setView(true)}>{done ? 'Tiếp tục đối soát' : 'Bắt đầu đối soát'}</Button>
                  : <Button size="sm" variant="ghost" icon={FileDown} onClick={() => toast({ title: 'Đang tải biên bản đối soát', desc: `doi-soat-${r.month.replace(/\D+/g, '-').replace(/^-|-$/g, '')}.pdf` })}>Biên bản</Button>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
