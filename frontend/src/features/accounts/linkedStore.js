/* Tài khoản ngân hàng khác đã liên kết (chỉ để xem số dư) — lưu riêng trong trình duyệt. */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useLinked = create(
  persist(
    (set) => ({
      items: [],
      link: (list) => set((s) => ({ items: [...s.items, ...list] })),
      unlink: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
    }),
    { name: 'mach-linked-banks' },
  ),
)
