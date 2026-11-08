/* ==========================================================
   Ngăn kéo chi tiết giao dịch — dùng ở trang Giao dịch, Tài khoản, Thẻ…
   <TxDrawer id={txId} onClose={() => setId(null)} />
   ========================================================== */
import { useState } from 'react'
import { Copy, Paperclip, CreditCard, Landmark, Repeat, Flag, Download, Split, MessageSquare, AlertTriangle } from 'lucide-react'
import { formatDateTime, readVND } from '@/lib/format'
import { useBank, toast } from '@/store'
import { CATEGORIES, METHOD_LABEL, STATUS_LABEL, categoryList, txName } from '@/data/transactions'
import { memberById } from '@/data/org'
import { Drawer, Badge, KeyValue, Select, Textarea, FileDrop, Button, TxAvatar, Money, Callout, Avatar, Menu, Popover } from '@/components/ui'

export function TxDrawer({ id, onClose }) {
  const tx = useBank((s) => s.transactions.find((t) => t.id === id))
  const accounts = useBank((s) => s.accounts)
  const update = useBank((s) => s.update)
  const [note, setNote] = useState(null)
  if (!tx) return <Drawer open={!!id} onClose={onClose} title="Không tìm thấy giao dịch" />
  const acc = accounts.find((a) => a.id === tx.account)
  const member = tx.member && memberById(tx.member)
  const noteVal = note ?? tx.note ?? ''
  const isIn = tx.amount > 0
  const statusTone = tx.status === 'failed' ? 'neg' : tx.status === 'pending' ? 'warn' : 'pos'
  const setCat = (category) => { update('transactions', tx.id, { category: category || null }); toast({ title: 'Đã cập nhật danh mục', desc: CATEGORIES[category]?.label }) }

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={480}
      header={
        <div className="flex items-start gap-3.5">
          <TxAvatar tx={tx} size={44} />
          <div className="min-w-0">
            <div className="text-[15px] font-[600] leading-snug">{txName(tx)}</div>
            <div className="ds-caption mt-0.5">{formatDateTime(tx.date)}</div>
          </div>
        </div>
      }
      footer={<>
        <Popover align="start" width={230} trigger={(p) => <Button {...p} variant="secondary" icon={Flag}>Báo cáo vấn đề</Button>}>
          {(close) => <Menu onClose={close} items={[
            { label: 'Tôi không thực hiện giao dịch này', onClick: () => toast({ title: 'Đã gửi báo cáo', desc: 'Đội hỗ trợ sẽ liên hệ trong 15 phút.' }) },
            { label: 'Sai số tiền', onClick: () => toast('Đã gửi báo cáo cho đội hỗ trợ') },
            { label: 'Bị trừ tiền hai lần', onClick: () => toast('Đã gửi báo cáo cho đội hỗ trợ') },
          ]} />}
        </Popover>
        <div className="flex-1" />
        <Button variant="ghost" icon={Download} onClick={() => toast({ title: 'Đã tải biên lai', desc: `bien-lai-${tx.id}.pdf` })}>Biên lai</Button>
      </>}
    >
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={statusTone} dot>{STATUS_LABEL[tx.status]}</Badge>
            {tx.rule && <Badge tone="brand" icon={Repeat}>Quy tắc tự động</Badge>}
          </div>
          <div className="mt-3 text-[34px] font-[480] tracking-tight leading-none">
            <Money value={tx.amount} sign tone strike={tx.status === 'failed'} />
          </div>
          <p className="ds-caption mt-2 italic">{readVND(tx.amount)}</p>
        </div>

        {tx.status === 'failed' && (
          <Callout tone="neg" icon={AlertTriangle} title="Giao dịch bị từ chối">
            Thẻ ••{tx.card} bị từ chối vì vượt hạn mức theo giao dịch. Bạn có thể nâng hạn mức trong trang Thẻ.
          </Callout>
        )}

        <KeyValue items={[
          { label: 'Tài khoản', value: <span className="inline-flex items-center gap-1.5"><Landmark size={14} className="text-faint" />{acc ? `${acc.name} ••${acc.last4}` : '—'}</span> },
          { label: 'Phương thức', value: tx.card ? <span className="inline-flex items-center gap-1.5"><CreditCard size={14} className="text-faint" />Thẻ ••{tx.card}</span> : METHOD_LABEL[tx.method] },
          member && { label: 'Người dùng thẻ', value: <span className="inline-flex items-center gap-2"><Avatar name={member.name} color={member.color} size={20} />{member.name}</span> },
          tx.ref && { label: 'Mã tham chiếu', value: <span className="font-mono text-[12.5px]">{tx.ref}</span> },
          { label: 'Mã giao dịch', value: <button onClick={() => { navigator.clipboard?.writeText(tx.id.toUpperCase()); toast('Đã sao chép mã giao dịch') }} className="inline-flex items-center gap-1.5 font-mono text-[12.5px] hover:text-brand-ink">{tx.id.toUpperCase()}<Copy size={12} /></button> },
        ]} />

        {tx.category !== 'transfer' && (
          <div className="flex flex-col gap-4">
            <Select
              label="Danh mục"
              value={tx.category || ''}
              onChange={(e) => setCat(e.target.value)}
              placeholder="Chưa phân loại"
              options={categoryList.filter((c) => c.id !== 'transfer').map((c) => ({ value: c.id, label: c.label }))}
              hint={!tx.category ? 'Gợi ý từ trợ lý AI: ' + (isIn ? 'Doanh thu' : 'Đi lại & Công tác') : undefined}
            />
            <Textarea label="Ghi chú" value={noteVal} onChange={(e) => setNote(e.target.value)}
              onBlur={() => { if (noteVal !== (tx.note || '')) { update('transactions', tx.id, { note: noteVal }); toast('Đã lưu ghi chú') } }}
              placeholder="VD: Tiếp khách dự án Tre Việt" rows={2} />
            {!isIn && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-[550] text-dim inline-flex items-center gap-1.5"><Paperclip size={14} />Chứng từ</span>
                  {!tx.receipt && Math.abs(tx.amount) >= 200000 && <span className="text-[12px] text-warn font-[550]">Cần bổ sung hoá đơn VAT</span>}
                </div>
                <FileDrop compact
                  value={tx.receipt ? (typeof tx.receipt === 'object' ? tx.receipt : { name: `hoa-don-${tx.id}.pdf` }) : null}
                  onChange={(f) => { update('transactions', tx.id, { receipt: f || false }); toast(f ? 'Đã đính kèm chứng từ' : 'Đã gỡ chứng từ') }} />
              </div>
            )}
          </div>
        )}

        <div className="rounded-xl border border-line p-4">
          <div className="flex items-center gap-2 text-[13px] font-[550] text-dim"><MessageSquare size={14} />Hoạt động</div>
          <ol className="mt-3 flex flex-col gap-3 text-[13px]">
            <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 rounded-full bg-brand-500 shrink-0" /><span><b className="font-[600]">{tx.status === 'posted' ? 'Hoàn tất' : STATUS_LABEL[tx.status]}</b> · {formatDateTime(tx.date)}</span></li>
            {tx.category && tx.category !== 'transfer' && <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 rounded-full bg-faint shrink-0" /><span>Trợ lý AI gán danh mục “{CATEGORIES[tx.category]?.label}”</span></li>}
            {tx.receipt && <li className="flex gap-2.5"><span className="mt-1.5 size-1.5 rounded-full bg-faint shrink-0" /><span>Đã khớp chứng từ tự động từ email ketoan@senviet.vn</span></li>}
          </ol>
        </div>

        {tx.method === 'card' && tx.status === 'posted' && !isIn && Math.abs(tx.amount) > 1000000 && (
          <Button variant="ghost" icon={Split} className="self-start" onClick={() => toast({ title: 'Tách giao dịch', desc: 'Tính năng tách theo nhiều danh mục có ở gói Doanh nghiệp.', tone: 'info' })}>Tách thành nhiều danh mục</Button>
        )}
      </div>
    </Drawer>
  )
}
