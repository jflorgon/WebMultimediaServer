import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMoviesStore } from '../store/useMoviesStore'
import { useSeriesStore } from '../store/useSeriesStore'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { MediaCard } from '../components/ui/MediaCard'
import { Spinner } from '../components/ui/Spinner'
import { movieService } from '../services/movieService'
import type { Movie } from '../types/movie'
import type { SeriesListItem } from '../types/series'

type RowItem = { id: string; title: string; year?: number; posterUrl?: string; backdropUrl?: string; rating?: number | null; genres: string[] }

function ContentRow({
  title,
  items,
  linkBase,
  subtitleFn,
}: {
  title: string
  items: RowItem[]
  linkBase: string
  subtitleFn?: (item: RowItem) => string | undefined
}) {
  const { t } = useTranslation()
  return (
    <section>
      <div className="flex items-center justify-between mb-4" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
        <h2 className="text-base font-semibold text-white tracking-wide uppercase">
          {title}
        </h2>
        <Link
          to={`/${linkBase}`}
          className="text-xs font-medium hover:underline transition-colors"
          style={{ color: 'var(--netflix-red)' }}
        >
          {t('home.viewAll')} →
        </Link>
      </div>
      <div className="overflow-y-visible" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
        <div className="carousel-track">
          {items.map((item) => (
            <div
              key={item.id}
              style={{ width: 'clamp(160px, 18vw, 260px)' }}
            >
              <MediaCard
                title={item.title}
                year={item.year}
                posterUrl={item.posterUrl}
                backdropUrl={item.backdropUrl}
                rating={item.rating}
                genres={item.genres}
                linkTo={`/${linkBase}/${item.id}`}
                subtitle={subtitleFn?.(item)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HeroSection({ movie }: { movie: Movie }) {
  return (
    <div className="relative w-full" style={{ height: 'clamp(420px, 62vh, 680px)', marginTop: 'var(--navbar-h)' }}>
      {movie.backdropUrl ? (
        <img
          src={movie.backdropUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-900" />
      )}

      <div className="absolute inset-0 hero-gradient" />

      <motion.div
        className="absolute pb-20"
        style={{ bottom: 0, left: '4vw', maxWidth: '38vw' }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg">
          {movie.title}
        </h1>
        {movie.overview && (
          <p className="text-sm md:text-base text-gray-200 leading-relaxed mb-6 line-clamp-3">
            {movie.overview}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Link
            to={`/movies/${movie.id}`}
            className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-black transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'white' }}
          >
            <span className="text-lg">▶</span> Reproducir
          </Link>
          <Link
            to={`/movies/${movie.id}`}
            className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-white bg-white/20 hover:bg-white/30 transition-colors"
          >
            <span>ℹ</span> Más info
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { items: movies, loading: ml, fetchAll: fetchMovies } = useMoviesStore()
  const { items: series, loading: sl, fetchAll: fetchSeries } = useSeriesStore()
  const { items: docs, loading: dl, fetchAll: fetchDocs } = useDocumentariesStore()
  const [heroMovie, setHeroMovie] = useState<Movie | null>(null)

  useEffect(() => {
    fetchMovies({ page: 1, pageSize: 20 })
    fetchSeries({ page: 1, pageSize: 20 })
    fetchDocs({ page: 1, pageSize: 20 })
  }, [fetchMovies, fetchSeries, fetchDocs])

  useEffect(() => {
    if (movies.length === 0) return
    const candidate = movies.find((m) => m.posterUrl) ?? movies[0]
    movieService.getById(candidate.id).then(setHeroMovie).catch(() => setHeroMovie(null))
  }, [movies])

  return (
    <div style={{ backgroundColor: 'var(--netflix-black)' }}>
      {ml || !heroMovie ? (
        <div className="flex items-center justify-center" style={{ height: '100svh', paddingTop: 'var(--navbar-h)' }}>
          <Spinner />
        </div>
      ) : (
        <HeroSection movie={heroMovie} />
      )}

      <div style={{ position: 'relative', zIndex: 10, paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {!ml && (
          <ContentRow
            title={t('home.recentMovies')}
            items={movies}
            linkBase="movies"
          />
        )}
        {!sl && (
          <ContentRow
            title={t('home.recentSeries')}
            items={series}
            linkBase="series"
            subtitleFn={(item) => {
              const s = item as SeriesListItem
              return s.seasons != null ? `${s.seasons} temp.` : undefined
            }}
          />
        )}
        {!dl && (
          <ContentRow
            title={t('home.recentDocumentaries')}
            items={docs}
            linkBase="documentaries"
          />
        )}
      </div>
    </div>
  )
}
