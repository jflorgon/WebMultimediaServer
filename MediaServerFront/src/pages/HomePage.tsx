import { useEffect, useState, useRef, useCallback } from 'react'
import { useAutoRetry } from '../hooks/useAutoRetry'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMoviesStore } from '../store/useMoviesStore'
import { useSeriesStore } from '../store/useSeriesStore'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { MediaCard } from '../components/ui/MediaCard'
import { CarouselNavigation } from '../components/ui/CarouselNavigation'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { movieService } from '../services/movieService'
import { seriesService } from '../services/seriesService'
import { documentaryService } from '../services/documentaryService'
import { formatRating } from '../utils/formatters'
import type { SeriesListItem } from '../types/series'
import type { DocumentaryListItem } from '../types/documentary'

type HeroItem = {
  id: string
  title: string
  overview?: string
  backdropUrl?: string
  posterUrl?: string
  rating?: number | null
  type: 'movie' | 'series' | 'documentary'
  linkTo: string
}

type RowItem = {
  id: string
  title: string
  year?: number
  posterUrl?: string
  backdropUrl?: string
  rating?: number | null
  genres: string[]
}

const HERO_MIN_RATING = 6
const HERO_COUNTS = { movies: 4, series: 3, documentaries: 2 } as const

function ContentRow({
  title,
  items,
  linkBase,
  subtitleFn,
  linkToFn,
}: {
  title: string
  items: RowItem[]
  linkBase: string
  subtitleFn?: (item: RowItem) => string | undefined
  linkToFn?: (item: RowItem) => string
}) {
  const { t } = useTranslation()
  const carouselRef = useRef<HTMLDivElement>(null)
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([])
  const [canScroll, setCanScroll] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [items.length])

  const scroll = (dir: 'left' | 'right') => {
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -400 : 400, behavior: 'smooth' })
  }

  const focusCard = (index: number) => {
    wrapperRefs.current[index]?.querySelector('a')?.focus()
  }

  return (
    <section
      style={{ position: 'relative', zIndex: active ? 20 : 1 }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocusCapture={() => setActive(true)}
      onBlurCapture={() => setActive(false)}
    >
      <div className="flex items-center justify-between mb-4" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
        <h2 className="text-base font-semibold text-white tracking-wide uppercase">{title}</h2>
        <Link
          to={`/${linkBase}`}
          className="text-xs font-medium hover:underline transition-colors"
          style={{ color: 'var(--netflix-red)' }}
        >
          {t('home.viewAll')} →
        </Link>
      </div>

      <div className="relative">
        {canScroll && (
          <CarouselNavigation
            onPrevClick={() => scroll('left')}
            onNextClick={() => scroll('right')}
          />
        )}
        <div style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
          <div ref={carouselRef} className="carousel-track">
            {items.map((item, index) => (
              <div
                key={item.id}
                ref={(el) => { wrapperRefs.current[index] = el }}
                style={{ width: '18vw', minWidth: '160px', maxWidth: '260px' }}
              >
                <MediaCard
                  title={item.title}
                  year={item.year}
                  posterUrl={item.posterUrl}
                  backdropUrl={item.backdropUrl}
                  rating={item.rating}
                  genres={item.genres}
                  linkTo={linkToFn ? linkToFn(item) : `/${linkBase}/${item.id}`}
                  subtitle={subtitleFn?.(item)}
                  expandOrigin={index === 0 ? 'top left' : 'top center'}
                  onArrowLeft={() => focusCard(index - 1)}
                  onArrowRight={() => focusCard(index + 1)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const TYPE_LABEL: Record<HeroItem['type'], string> = {
  movie: 'Película',
  series: 'Serie',
  documentary: 'Documental',
}

function HeroSection({
  items,
  currentIndex,
  onDotClick,
}: {
  items: HeroItem[]
  currentIndex: number
  onDotClick: (i: number) => void
}) {
  const item = items[currentIndex]
  if (!item) return null

  return (
    <div
      className="relative w-full"
      style={{ height: '62vh', minHeight: '420px', maxHeight: '680px', marginTop: 'var(--navbar-h)' }}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={item.id + '-bg'}
          src={item.backdropUrl ?? item.posterUrl}
          alt=""
          className="absolute w-full h-full object-cover object-top"
          style={{ top: 0, left: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      </AnimatePresence>

      <div
        className="hero-gradient"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="absolute pb-16"
          style={{ bottom: 0, left: '4vw', maxWidth: '38vw' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="flex items-center text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--netflix-red)' }}
          >
            <span>{TYPE_LABEL[item.type]}</span>
            {item.rating != null && (
              <span
                style={{
                  marginLeft: '0.75rem',
                  color: '#facc15',
                  letterSpacing: 'normal',
                }}
              >
                ★ {formatRating(item.rating)}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            {item.title}
          </h1>
          {item.overview && (
            <p className="text-sm text-gray-200 leading-relaxed mb-6 line-clamp-3">
              {item.overview}
            </p>
          )}
          <div className="flex items-center">
            <Link
              to={item.linkTo}
              className="inline-flex items-center rounded font-bold text-sm text-black transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'white', padding: '0.3rem 0.7rem', fontSize: '0.85rem' }}
            >
              <span style={{ marginRight: '0.4rem' }}>▶</span> Reproducir
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots de navegación */}
      <div
        className="absolute flex items-center"
        style={{ bottom: '1.25rem', right: '4vw', gap: '6px' }}
      >
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            aria-label={`Slide ${i + 1}`}
            style={{
              width: i === currentIndex ? '24px' : '8px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: i === currentIndex ? 'white' : 'rgba(255,255,255,0.35)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
              flexShrink: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { items: movies, loading: ml, fetchAll: fetchMovies } = useMoviesStore()
  const { items: series, loading: sl, fetchAll: fetchSeries } = useSeriesStore()
  const { items: docs, loading: dl, fetchAll: fetchDocs } = useDocumentariesStore()

  const [heroItems, setHeroItems] = useState<HeroItem[]>([])
  const [heroIndex, setHeroIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enrichedRef = useRef(false)

  useEffect(() => {
    fetchMovies()
    fetchSeries()
    fetchDocs()
  }, [fetchMovies, fetchSeries, fetchDocs])

  // Auto-retry si el servidor está caído: reintenta cada 10s hasta 15 veces
  // mientras el store siga vacío. Se resetea al cargar con éxito.
  useAutoRetry(movies.length === 0, ml, fetchMovies)
  useAutoRetry(series.length === 0, sl, fetchSeries)
  useAutoRetry(docs.length === 0, dl, fetchDocs)

  // Fase 1: hero aleatorio desde endpoints dedicados (filtra rating ≥ 6 con padding en backend)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      movieService.getHero(HERO_COUNTS.movies, HERO_MIN_RATING).catch(() => []),
      seriesService.getHero(HERO_COUNTS.series, HERO_MIN_RATING).catch(() => []),
      documentaryService.getHero(HERO_COUNTS.documentaries, HERO_MIN_RATING).catch(() => []),
    ]).then(([m, s, d]) => {
      if (cancelled) return
      const items: HeroItem[] = [
        ...m.filter(x => !!x.posterUrl).map(x => ({
          id: x.id,
          title: x.title,
          posterUrl: x.posterUrl,
          rating: x.rating,
          type: 'movie' as const,
          linkTo: `/movies/${x.id}`,
        })),
        ...s.filter(x => !!x.posterUrl).map(x => ({
          id: x.id,
          title: x.title,
          posterUrl: x.posterUrl,
          rating: x.rating,
          type: 'series' as const,
          linkTo: `/series/${x.id}`,
        })),
        ...d.filter(x => !!x.posterUrl).map(x => ({
          id: x.id,
          title: x.title,
          posterUrl: x.posterUrl,
          rating: x.rating,
          type: 'documentary' as const,
          linkTo: x.isSeries ? `/series/${x.id}` : `/documentaries/${x.id}`,
        })),
      ]
      if (items.length > 0) setHeroItems(items)
    })
    return () => { cancelled = true }
  }, [])

  // Fase 2: enriquecer con backdrop + overview desde detalle (en segundo plano)
  useEffect(() => {
    if (heroItems.length === 0) return
    if (enrichedRef.current) return
    enrichedRef.current = true

    const fetches = [
      ...heroItems.filter(h => h.type === 'movie').map(h =>
        movieService.getById(h.id)
          .then(d => ({ ...h, backdropUrl: d.backdropUrl ?? h.backdropUrl, overview: d.overview }))
          .catch(() => h)
      ),
      ...heroItems.filter(h => h.type === 'series').map(h =>
        seriesService.getById(h.id)
          .then(d => ({ ...h, backdropUrl: d.backdropUrl ?? h.backdropUrl, overview: d.overview }))
          .catch(() => h)
      ),
      ...heroItems.filter(h => h.type === 'documentary').map(h =>
        documentaryService.getById(h.id)
          .then(d => ({ ...h, backdropUrl: d.backdropUrl ?? h.backdropUrl, overview: d.overview }))
          .catch(() => h)
      ),
    ]

    Promise.all(fetches).then(enriched => setHeroItems(enriched as HeroItem[]))
  }, [heroItems])

  const startTimer = useCallback(
    (count: number) => {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setHeroIndex((i) => (i + 1) % count)
      }, 20000)
    },
    []
  )

  useEffect(() => {
    if (heroItems.length === 0) return
    startTimer(heroItems.length)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [heroItems.length, startTimer])

  const goTo = useCallback(
    (index: number) => {
      setHeroIndex(index)
      startTimer(heroItems.length)
    },
    [heroItems.length, startTimer]
  )

  const loading = ml || sl || dl
  const isEmpty = movies.length === 0 && series.length === 0 && docs.length === 0
  const heroReady = heroItems.length > 0

  return (
    <div style={{ backgroundColor: 'var(--netflix-black)' }}>
      {loading ? (
        <div
          className="flex items-center justify-center"
          style={{ height: '100svh', paddingTop: 'var(--navbar-h)' }}
        >
          <Spinner />
        </div>
      ) : isEmpty ? (
        <div
          className="flex items-center justify-center"
          style={{ height: '100svh', paddingTop: 'var(--navbar-h)' }}
        >
          <EmptyState title={t('home.noContent')} subtitle={t('home.noContentSubtitle')} />
        </div>
      ) : heroReady ? (
        <HeroSection items={heroItems} currentIndex={heroIndex} onDotClick={goTo} />
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ height: '62vh', minHeight: '420px', maxHeight: '680px', marginTop: 'var(--navbar-h)' }}
        >
          <Spinner />
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          paddingTop: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {!ml && (
          <ContentRow title={t('home.recentMovies')} items={movies} linkBase="movies" />
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
            linkToFn={(item) => (item as DocumentaryListItem).isSeries ? `/series/${item.id}` : `/documentaries/${item.id}`}
          />
        )}
      </div>
    </div>
  )
}
