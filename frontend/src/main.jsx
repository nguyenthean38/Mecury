import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/500.css'
import './styles/index.css'
import { router } from './router'
import { Toaster } from '@/components/ui'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </StrictMode>,
)
