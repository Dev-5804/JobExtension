import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './dashboard.css'
import DashboardApp from './DashboardApp'

createRoot(document.getElementById('dashboard-root')!).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
)
