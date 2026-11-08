/* ==========================================================
   Kho trạng thái (Zustand)
   - useUI: giao diện (chủ đề, ẩn số dư, các lớp phủ)
   - useBank: dữ liệu ngân hàng mô phỏng, lưu vào localStorage
     để thao tác của người xem (khoá thẻ, duyệt hoá đơn…) còn sau khi tải lại.
   ========================================================== */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACCOUNTS, CREDIT, AUTO_RULES, TEAM } from '@/data/org'
import { TRANSACTIONS } from '@/data/transactions'
import { CARDS, BUDGETS, REIMBURSEMENTS } from '@/data/spend'
import { BILLS, RECIPIENTS } from '@/data/payments'
import { INVOICES, CUSTOMERS, CATALOG } from '@/data/invoicing'
import { TASKS, NOTIFICATIONS, INTEGRATIONS, APPROVAL_RULES } from '@/data/workspace'
import { JOURNAL } from '@/data/books'
import { TODAY } from '@/lib/format'

/* ---------------- Giao diện ---------------- */
function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#0c0e0d' : '#fbfbf9')
}

export const useUI = create(
  persist(
    (set, get) => ({
      theme: 'system',
      hideBalances: false,
      sidebarOpen: false,
      command: false,
      assistant: false,
      moveMoney: null, // null | { mode, preset }
      setTheme: (theme) => { applyTheme(theme); set({ theme }) },
      toggleHide: () => set({ hideBalances: !get().hideBalances }),
      setSidebar: (v) => set({ sidebarOpen: v }),
      setCommand: (v) => set({ command: v }),
      setAssistant: (v) => set({ assistant: v }),
      openMoveMoney: (mode = 'send', preset = {}) => set({ moveMoney: { mode, preset } }),
      closeMoveMoney: () => set({ moveMoney: null }),
    }),
    { name: 'mach-ui', partialize: (s) => ({ theme: s.theme, hideBalances: s.hideBalances }) },
  ),
)

if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useUI.getState().theme === 'system') applyTheme('system')
  })
}

/* ---------------- Thông báo nhanh (toast) ---------------- */
let toastId = 0
export const useToasts = create((set) => ({
  items: [],
  push: (t) => {
    const id = ++toastId
    set((s) => ({ items: [...s.items, { id, tone: 'default', ...t }] }))
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), t.duration || 3800)
    return id
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}))
/** toast('Đã lưu') · toast({ title, desc, tone: 'pos' | 'neg', action: { label, onClick } }) */
export const toast = (t) => useToasts.getState().push(typeof t === 'string' ? { title: t } : t)

/* ---------------- Phiên đăng nhập ---------------- */
export const useAuth = create(
  persist(
    (set) => ({
      user: null,
      onboarded: true,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      setOnboarded: (v) => set({ onboarded: v }),
    }),
    { name: 'mach-auth' },
  ),
)

/* ---------------- Dữ liệu ngân hàng ---------------- */
const seed = () => ({
  accounts: ACCOUNTS,
  credit: CREDIT,
  rules: AUTO_RULES,
  team: TEAM,
  transactions: TRANSACTIONS,
  cards: CARDS,
  budgets: BUDGETS,
  reimbursements: REIMBURSEMENTS,
  bills: BILLS,
  recipients: RECIPIENTS,
  invoices: INVOICES,
  customers: CUSTOMERS,
  catalog: CATALOG,
  tasks: TASKS,
  notifications: NOTIFICATIONS,
  integrations: INTEGRATIONS,
  approvals: APPROVAL_RULES,
  journal: JOURNAL,
  savedViews: [
    { id: 'v1', name: 'Chi phí quảng cáo', filters: { category: ['marketing'] } },
    { id: 'v2', name: 'Thẻ chưa có chứng từ', filters: { method: ['card'], receipt: 'missing' } },
  ],
})

let uid = 1000
export const newId = (p = 'id') => `${p}${++uid}${Date.now().toString(36).slice(-3)}`

export const useBank = create(
  persist(
    (set, get) => ({
      ...seed(),

      /** Sửa một phần tử trong một danh sách: update('cards', 'c1', { status: 'frozen' }) */
      update: (key, id, patch) => set((s) => ({ [key]: s[key].map((x) => (x.id === id ? { ...x, ...(typeof patch === 'function' ? patch(x) : patch) } : x)) })),
      updateMany: (key, ids, patch) => set((s) => ({ [key]: s[key].map((x) => (ids.includes(x.id) ? { ...x, ...patch } : x)) })),
      add: (key, item, { prepend = true } = {}) => set((s) => ({ [key]: prepend ? [item, ...s[key]] : [...s[key], item] })),
      remove: (key, id) => set((s) => ({ [key]: s[key].filter((x) => x.id !== id) })),

      /** Chuyển tiền: trừ tài khoản nguồn, tạo giao dịch; nếu chuyển nội bộ thì cộng tài khoản đích. */
      transfer: ({ from, to, recipient, amount, note = '', category = null, method = 'transfer_out', status = 'posted', date }) => {
        const when = (date ? new Date(date) : new Date(TODAY.getTime() + 60000 * (get().transactions.length % 50))).toISOString()
        const acc = get().accounts.find((a) => a.id === from)
        const txs = []
        if (to) {
          const dest = get().accounts.find((a) => a.id === to)
          txs.push({ id: newId('tx'), date: when, merchant: 'internal', counterparty: `Đến ${dest.name} ••${dest.last4}`, amount: -amount, account: from, method: 'internal', category: 'transfer', to, status, note, receipt: false })
          txs.push({ id: newId('tx'), date: when, merchant: 'internal', counterparty: `Từ ${acc.name} ••${acc.last4}`, amount, account: to, method: 'internal', category: 'transfer', from, status, note, receipt: false })
        } else {
          const rc = get().recipients.find((r) => r.id === recipient)
          txs.push({ id: newId('tx'), date: when, merchant: null, counterparty: rc?.name || 'Người nhận', recipient, amount: -amount, account: from, method, category, status, note, receipt: false })
        }
        set((s) => ({
          transactions: [...txs, ...s.transactions],
          accounts: s.accounts.map((a) => {
            if (status !== 'posted') return a
            if (a.id === from) return { ...a, balance: a.balance - amount }
            if (a.id === to) return { ...a, balance: a.balance + amount }
            return a
          }),
        }))
        return txs[0]
      },

      /** Đưa toàn bộ dữ liệu demo về ban đầu (kể cả các kho phụ lưu riêng) rồi tải lại trang */
      resetDemo: () => {
        set(seed())
        try { ['mach-linked-banks', 'mach-tasks-done', 'mach-invoice-template', 'mach-banner-ai'].forEach((k) => localStorage.removeItem(k)) } catch { /* bỏ qua */ }
        setTimeout(() => window.location.reload(), 700)
      },
    }),
    { name: 'mach-bank-v2', version: 2 },
  ),
)

export const useMember = (id) => useBank((s) => s.team.find((m) => m.id === id))
