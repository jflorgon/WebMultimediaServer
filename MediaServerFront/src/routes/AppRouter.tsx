import { useEffect } from 'react'
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

export function AppRouter() {
  const location = useLocation()
  const state = location.state as { backgroundLocation?: Location } | null
  const backgroundLocation = state?.backgroundLocation

  useEffect(() => {
    if (!backgroundLocation) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [backgroundLocation])

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
          style={{
            position: 'fixed',
            inset: 0,
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
