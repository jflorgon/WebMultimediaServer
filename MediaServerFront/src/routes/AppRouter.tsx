import { Routes, Route } from 'react-router-dom'
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
  return (
    <Routes>
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
  )
}
