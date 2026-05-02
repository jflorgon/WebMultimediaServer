import 'abort-controller/polyfill'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import './i18n/index'
import './index.css'
import App from './App'

if (import.meta.env.VITE_TIZEN === 'true') {
  document.documentElement.classList.add('tizen')

  window.addEventListener('unhandledrejection', (e) => {
    const reason: unknown = e.reason
    const msg = reason instanceof Error ? `${reason.message}\n${reason.stack ?? ''}` : String(reason)
    const el = document.createElement('pre')
    el.style.cssText =
      'position:fixed;top:0;right:0;bottom:0;left:0;z-index:99999;background:#000;color:#f33;' +
      'padding:24px;font:14px monospace;white-space:pre-wrap;overflow:auto;'
    el.textContent = `[unhandledrejection] ${msg}`
    document.body.appendChild(el)
  })
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

const Router = import.meta.env.VITE_TIZEN === 'true' ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>,
)
