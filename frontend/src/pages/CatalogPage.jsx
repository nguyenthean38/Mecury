/* ==========================================================
   Sản phẩm & dịch vụ — danh mục dùng khi lập hoá đơn
   ========================================================== */
import { useMemo, useState } from 'react'
import { Plus, Package, MoreHorizontal, Pencil, Trash2, FilePlus2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatVND } from '@/lib/format'
import { useBank, toast, newId } from '@/store'
import {
  PageHeader, Button, IconButton, Card, Money, SearchInput, EmptyState, Modal, Confirm, Input, Textarea, Select, MoneyInput, Segmented, Field, Badge, Popover, Menu,
} from '@/components/ui'
import { UNITS, VAT_RATES } from '@/features/invoicing/helpers'

const empty = { name: '', desc: '', unit: 'Gói', price: 0, vat: 8 }

function ItemModal({ initial, onClose }) {
  const { add, update } = useBank()
  const [f, setF] = useState({ ...empty, ...initial })
  const editing = !!initial?.id
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const ok = f.name.trim().length > 1 && f.price > 0

  const save = () => {
    if (editing) {
      update('catalog', initial.id, f)
      toast({ title: 'Đã cập nhật', desc: f.name })
    } else {
      add('catalog', { id: newId('i'), ...f }, { prepend: false })
      toast({ title: 'Đã thêm vào danh mục', desc: f.name, tone: 'pos' })
    }
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={editing ? 'Sửa sản phẩm, dịch vụ' : 'Thêm sản phẩm, dịch vụ'} desc="Đơn giá và thuế suất được điền sẵn khi bạn lập hoá đơn."
      footer={<><Button variant="secondary" onClick={onClose}>Huỷ</Button><Button variant="primary" disabled={!ok} onClick={save}>{editing ? 'Lưu thay đổi' : 'Thêm vào danh mục'}</Button></>}>
      <div className="flex flex-col gap-4">
        <Input label="Tên" value={f.name} onChange={set('name')} placeholder="VD: Thiết kế website doanh nghiệp" autoFocus />
        <Textarea label="Mô tả" optional rows={2} value={f.desc} onChange={set('desc')} placeholder="Hiện dưới tên trên hoá đơn và link thanh toán" />
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <Select label="Đơn vị tính" value={f.unit} onChange={set('unit')} options={UNITS} />
          <MoneyInput label="Đơn giá (chưa VAT)" value={f.price} onChange={set('price')} />
        </div>
        <Field label="Thuế suất GTGT" hint={f.price ? `Giá đã gồm VAT: ${formatVND(Math.round(f.price * (1 + f.vat / 100)))}` : 'Phần lớn dịch vụ phần mềm áp dụng 8% theo chính sách giảm thuế hiện hành.'}>
          <Segmented value={f.vat} onChange={set('vat')} options={VAT_RATES.map((r) => ({ value: r, label: r + '%' }))} className="self-start" />
        </Field>
      </div>
    </Modal>
  )
}

export default function CatalogPage() {
  const navigate = useNavigate()
  const catalog = useBank((s) => s.catalog)
  const invoices = useBank((s) => s.invoices)
  const remove = useBank((s) => s.remove)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  /** Số lần xuất hoá đơn và doanh thu theo từng mục */
  const usage = useMemo(() => {
    const m = {}
    invoices.forEach((inv) => {
      if (inv.status === 'void') return
      inv.items.forEach((it) => {
        if (!it.catalog) return
        const u = (m[it.catalog] ||= { times: 0, revenue: 0 })
        u.times++
        u.revenue += it.qty * it.price
      })
    })
    return m
  }, [invoices])

  const list = catalog.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <div>
      <PageHeader
        title="Sản phẩm & dịch vụ"
        desc="Danh mục bán ra với đơn giá, đơn vị tính và thuế suất GTGT."
        actions={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Thêm mới</Button>}
      />

      <div className="flex items-center justify-between gap-3 mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Tìm sản phẩm, dịch vụ" className="sm:max-w-[340px] flex-1" />
        <span className="ds-caption hidden sm:block">{catalog.length} mục</span>
      </div>

      {list.length === 0 ? (
        <Card>
          {q
            ? <EmptyState icon={Package} title="Không tìm thấy" desc={`Không có sản phẩm, dịch vụ nào khớp với “${q}”.`} action={<Button size="sm" variant="secondary" onClick={() => setQ('')}>Xoá tìm kiếm</Button>} />
            : <EmptyState icon={Package} title="Danh mục đang trống" desc="Thêm sản phẩm, dịch vụ để lập hoá đơn chỉ với vài lần bấm." action={<Button variant="primary" icon={Plus} onClick={() => setEditing({})}>Thêm mới</Button>} />}
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => {
            const u = usage[c.id]
            return (
              <Card key={c.id} interactive className="flex flex-col gap-3 cursor-pointer" onClick={() => setEditing(c)}
                role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setEditing(c) }} aria-label={`Sửa ${c.name}`}>
                <div className="flex items-start gap-3">
                  <span className="size-10 shrink-0 rounded-xl bg-brand-50 text-brand-ink grid place-items-center"><Package size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="ds-h3 leading-snug">{c.name}</div>
                    <div className="ds-caption mt-0.5">{u ? `Đã xuất ${u.times} lần` : 'Chưa xuất hoá đơn'}</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Popover align="end" width={200} trigger={(p) => <IconButton {...p} icon={MoreHorizontal} label="Thao tác" size="sm" className="-mr-1.5 -mt-1" />}>
                      {(close) => <Menu onClose={close} items={[
                        { label: 'Sửa', icon: Pencil, onClick: () => setEditing(c) },
                        { label: 'Lập hoá đơn', icon: FilePlus2, onClick: () => navigate('/hoa-don?tao=1') },
                        { divider: true },
                        { label: 'Xoá', icon: Trash2, danger: true, onClick: () => setDeleting(c) },
                      ]} />}
                    </Popover>
                  </div>
                </div>
                <p className="text-[13px] text-muted line-clamp-2 min-h-[2.6em]">{c.desc || 'Chưa có mô tả.'}</p>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-3">
                  <div>
                    <Money value={c.price} hideable={false} className="text-[17px] font-[550]" />
                    <span className="text-muted text-[13px]"> / {c.unit.toLowerCase()}</span>
                  </div>
                  <Badge tone="neutral" size="sm">VAT {c.vat}%</Badge>
                </div>
                {u && <div className="ds-caption -mt-1">Doanh thu: <Money value={u.revenue} className="text-dim" /></div>}
              </Card>
            )
          })}
        </div>
      )}

      {editing && <ItemModal initial={editing} onClose={() => setEditing(null)} />}
      <Confirm open={!!deleting} onClose={() => setDeleting(null)} danger confirmLabel="Xoá"
        title={`Xoá “${deleting?.name}”?`}
        desc={usage[deleting?.id] ? `Mục này đã xuất ${usage[deleting.id].times} lần. Các hoá đơn cũ vẫn giữ nguyên nội dung.` : 'Mục này sẽ bị xoá khỏi danh mục.'}
        onConfirm={() => { remove('catalog', deleting.id); toast({ title: 'Đã xoá khỏi danh mục', desc: deleting.name }) }} />
    </div>
  )
}
