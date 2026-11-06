import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import App from './App'

import './index.css'

/** Electron loads via hash (`#/overlay`) so file:// and shared Vite work the same. */
const isDesktop = Boolean(window.questHubDesktop?.isDesktop)
const Router = isDesktop ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
