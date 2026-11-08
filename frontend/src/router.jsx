import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Skeleton } from '@/components/ui'

const L = (f) => {
  const C = lazy(f)
  return <Suspense fallback={<PageFallback />}><C /></Suspense>
}
function PageFallback() {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid md:grid-cols-2 gap-4 mt-4"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
    </div>
  )
}

export const router = createBrowserRouter([
  // ---- Trang công khai ----
  { path: '/', element: L(() => import('@/pages/public/LandingPage')) },
  { path: '/dang-nhap', element: L(() => import('@/pages/public/LoginPage')) },
  { path: '/dang-ky', element: L(() => import('@/pages/public/SignupPage')) },
  { path: '/quen-mat-khau', element: L(() => import('@/pages/public/ForgotPasswordPage')) },
  { path: '/mo-tai-khoan', element: L(() => import('@/pages/public/OnboardingPage')) },

  // ---- Ứng dụng (cần đăng nhập) ----
  {
    element: <AppLayout />,
    children: [
      { path: '/tong-quan', element: L(() => import('@/pages/HomePage')) },
      { path: '/viec-can-lam', element: L(() => import('@/pages/TasksPage')) },
      { path: '/tai-khoan', element: L(() => import('@/pages/AccountsPage')) },
      { path: '/tai-khoan/:id', element: L(() => import('@/pages/AccountDetailPage')) },
      { path: '/giao-dich', element: L(() => import('@/pages/TransactionsPage')) },
      { path: '/phan-tich', element: L(() => import('@/pages/InsightsPage')) },
      { path: '/the', element: L(() => import('@/pages/CardsPage')) },
      { path: '/chi-tieu-nhom', element: L(() => import('@/pages/TeamSpendPage')) },
      { path: '/chi-tieu-nhom/:id', element: L(() => import('@/pages/BudgetDetailPage')) },
      { path: '/hoan-ung', element: L(() => import('@/pages/ReimbursementsPage')) },
      { path: '/thanh-toan', element: L(() => import('@/pages/PaymentsPage')) },
      { path: '/nguoi-nhan', element: L(() => import('@/pages/RecipientsPage')) },
      { path: '/hoa-don', element: L(() => import('@/pages/InvoicesPage')) },
      { path: '/hoa-don/khach-hang', element: L(() => import('@/pages/CustomersPage')) },
      { path: '/hoa-don/danh-muc', element: L(() => import('@/pages/CatalogPage')) },
      { path: '/ke-toan', element: L(() => import('@/pages/AccountingPage')) },
      { path: '/cai-dat', element: L(() => import('@/pages/settings/SettingsPage')) },
      { path: '/cai-dat/:section', element: L(() => import('@/pages/settings/SettingsPage')) },
      { path: '/app', element: <Navigate to="/tong-quan" replace /> },
    ],
  },
  { path: '*', element: L(() => import('@/pages/public/NotFoundPage')) },
])
