import { useEffect, useRef } from 'react'
import { Routes, Route, useLocation, type Location } from 'react-router-dom'
import { MainLayout } from '../components/layout/MainLayout'
import { HomePage } from '../pages/HomePage'
import { MoviesPage } from '../pages/MoviesPage'
import { MovieDetailPage } from '../pages/MovieDetailPage'
import { SeriesPage } from '../pages/SeriesPage'
import { SeriesDetailPage } from '../pages/SeriesDetailPage'
import { DocumentariesPage } from '../pages/DocumentariesPage'
import { DocumentaryDetailPage } from '../pages/DocumentaryDetailPage'
import { NotFoundPage } from '../pages/NotFoundPage'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AppRouter() {
  const location = useLocation()
  const state = location.state as { backgroundLocation?: Location } | null
  const backgroundLocation = state?.backgroundLocation
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!backgroundLocation) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [backgroundLocation])

  // Mover el foco al overlay al abrirlo (mando D-pad de TV)
  useEffect(() => {
    if (!backgroundLocation) return
    let cancelled = false
    const tryFocus = (attemptsLeft: number) => {
      if (cancelled) return
      const overlay = overlayRef.current
      const first = overlay?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      if (first) {
        // preventScroll: el navegador NO debe hacer scroll para "centrar" el botón.
        // Si lo hace, descoloca la página entera y deja Volver a media altura.
        first.focus({ preventScroll: true })
        return
      }
      if (attemptsLeft > 0) {
        setTimeout(() => tryFocus(attemptsLeft - 1), 100)
      }
    }
    tryFocus(10)
    return () => { cancelled = true }
  }, [backgroundLocation, location.pathname])

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="series" element={<SeriesPage />} />
          <Route path="series/:id" element={<SeriesDetailPage />} />
          <Route path="documentaries" element={<DocumentariesPage />} />
          <Route path="documentaries/:id" element={<DocumentaryDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>

      {backgroundLocation && (
        <div
          ref={overlayRef}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            overflow: 'auto',
            zIndex: 100,
            backgroundColor: 'var(--netflix-black)',
          }}
        >
          <Routes>
            <Route path="movies/:id" element={<MovieDetailPage />} />
            <Route path="series/:id" element={<SeriesDetailPage />} />
            <Route path="documentaries/:id" element={<DocumentaryDetailPage />} />
          </Routes>
        </div>
      )}
    </>
  )
}
