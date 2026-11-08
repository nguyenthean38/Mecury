/* ==========================================================
   Kế toán — sổ sách theo Thông tư 200/2014/TT-BTC
   Tab đồng bộ với ?tab= để có thể dẫn link thẳng tới từng phần.
   ========================================================== */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Download, FileSpreadsheet, FileText, FileCode2, RefreshCw } from 'lucide-react'
import { toast, useBank } from '@/store'
import { buildPnL } from '@/data/books'
import { PageHeader, Segmented, Tabs, Button, Popover, Menu, Badge } from '@/components/ui'
import { Overview } from '@/features/accounting/Overview'
import { PnLTab } from '@/features/accounting/PnLTab'
import { BalanceSheetTab } from '@/features/accounting/BalanceSheetTab'
import { JournalTab } from '@/features/accounting/JournalTab'
import { ReconcileTab } from '@/features/accounting/ReconcileTab'
import { ChartOfAccountsTab } from '@/features/accounting/ChartOfAccountsTab'
import { PERIODS, periodOf, useReconLines } from '@/features/accounting/shared'

const TABS = [
  { value: 'tong-quan', label: 'Tổng quan' },
  { value: 'ket-qua', label: 'Kết quả kinh doanh' },
  { value: 'can-doi', label: 'Cân đối kế toán' },
  { value: 'but-toan', label: 'Bút toán' },
  { value: 'doi-soat', label: 'Đối soát' },
  { value: 'he-thong', label: 'Hệ thống tài khoản' },
]

const REPORT_NAME = { 'ket-qua': 'ket-qua-kinh-doanh', 'can-doi': 'can-doi-ke-toan', 'but-toan': 'so-nhat-ky-chung' }

export default function AccountingPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'tong-quan'
  const setTab = (v) => setParams((p) => {
    const n = new URLSearchParams(p)
    if (v === 'tong-quan') n.delete('tab')
    else n.set('tab', v)
    return n
  }, { replace: true })

  const [period, setPeriod] = useState('month')
  const pnl = useMemo(() => buildPnL(), [])
  const drafts = useBank((s) => s.journal.filter((j) => j.status === 'draft').length)

  // trạng thái đối soát tháng 11 giữ ở cấp trang để không mất khi đổi tab
  const reconLines = useReconLines()
  const [matched, setMatched] = useState({})
  const [finished, setFinished] = useState(false)
  const remaining = finished ? 0 : reconLines.filter((l) => !matched[l.id]).length

  const exportReport = (kind) => {
    const base = `${REPORT_NAME[tab] || 'bao-cao-tai-chinh'}-${period === 'month' ? 'thang-11' : period === 'quarter' ? 'quy-4' : '7-thang'}-2026`
    const file = { xlsx: `${base}.xlsx`, pdf: `${base}.pdf`, xml: `${base}-misa.xml` }[kind]
    toast({ title: kind === 'xml' ? 'Đã tạo tệp nhập liệu cho MISA' : 'Đang chuẩn bị báo cáo', desc: `${file} · ${periodOf(period).caption}`, tone: 'pos' })
  }

  const tabs = TABS.map((t) => (t.value === 'but-toan' && drafts ? { ...t, count: drafts } : t.value === 'doi-soat' && remaining ? { ...t, count: remaining } : t))

  return (
    <div>
      <PageHeader
        title="Kế toán"
        desc="Sổ sách tự động từ giao dịch ngân hàng, hạch toán theo Thông tư 200/2014/TT-BTC."
        badge={<Badge tone="brand" icon={RefreshCw}>Đã đồng bộ MISA · 09:25</Badge>}
        actions={<>
          <Segmented value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p.value, label: p.label, title: p.caption }))} />
          <Popover align="end" width={260} trigger={(p) => <Button {...p} variant="outline" icon={Download}>Xuất báo cáo</Button>}>
            {(close) => <Menu onClose={close} items={[
              { heading: periodOf(period).caption },
              { label: 'Excel (.xlsx)', desc: 'Bảng tính có công thức', icon: FileSpreadsheet, onClick: () => exportReport('xlsx') },
              { label: 'PDF', desc: 'Có chữ ký số, sẵn sàng in', icon: FileText, onClick: () => exportReport('pdf') },
              { divider: true },
              { label: 'XML cho MISA', desc: 'Nhập thẳng vào MISA AMIS Kế toán', icon: FileCode2, onClick: () => exportReport('xml') },
            ]} />}
          </Popover>
        </>}
      />

      <Tabs value={tab} onChange={setTab} options={tabs} className="mb-5" />

      {tab === 'tong-quan' && <Overview pnl={pnl} period={period} remaining={remaining} onTab={setTab} />}
      {tab === 'ket-qua' && <PnLTab pnl={pnl} period={period} />}
      {tab === 'can-doi' && <BalanceSheetTab />}
      {tab === 'but-toan' && <JournalTab />}
      {tab === 'doi-soat' && <ReconcileTab matched={matched} setMatched={setMatched} finished={finished} setFinished={setFinished} />}
      {tab === 'he-thong' && <ChartOfAccountsTab />}
    </div>
  )
}
