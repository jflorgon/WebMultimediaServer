import { useEffect, useState, useRef, useCallback } from 'react'
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
import type { SeriesListItem } from '../types/series'

type HeroItem = {
  id: string
  title: string
  overview?: string
  backdropUrl?: string
  posterUrl?: string
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
      style={{ height: 'clamp(420px, 62vh, 680px)', marginTop: 'var(--navbar-h)' }}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={item.id + '-bg'}
          src={item.backdropUrl ?? item.posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 hero-gradient" />

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
            className="text-xs font-bold uppercase tracking-widest mb-2"
            style={{ color: 'var(--netflix-red)' }}
          >
            {TYPE_LABEL[item.type]}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-lg">
            {item.title}
          </h1>
          {item.overview && (
            <p className="text-sm text-gray-200 leading-relaxed mb-6 line-clamp-3">
              {item.overview}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Link
              to={item.linkTo}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-black transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'white' }}
            >
              <span>▶</span> Reproducir
            </Link>
            <Link
              to={item.linkTo}
              className="flex items-center gap-2 px-6 py-2.5 rounded font-bold text-sm text-white bg-white/20 hover:bg-white/30 transition-colors"
            >
              <span>ℹ</span> Más info
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
  const heroFetchedRef = useRef(false)

  useEffect(() => {
    fetchMovies({ page: 1, pageSize: 20 })
    fetchSeries({ page: 1, pageSize: 20 })
    fetchDocs({ page: 1, pageSize: 20 })
  }, [fetchMovies, fetchSeries, fetchDocs])

  useEffect(() => {
    if (heroFetchedRef.current) return
    if (ml || sl || dl) return
    if (movies.length === 0 && series.length === 0 && docs.length === 0) return

    heroFetchedRef.current = true

    const fetches = [
      ...movies.slice(0, 5).map((m) =>
        movieService
          .getById(m.id)
          .then((d) => ({
            id: d.id,
            title: d.title,
            overview: d.overview,
            backdropUrl: d.backdropUrl,
            posterUrl: d.posterUrl,
            type: 'movie' as const,
            linkTo: `/movies/${d.id}`,
          }))
          .catch(() => null)
      ),
      ...series.slice(0, 5).map((s) =>
        seriesService
          .getById(s.id)
          .then((d) => ({
            id: d.id,
            title: d.title,
            overview: d.overview,
            backdropUrl: d.backdropUrl,
            posterUrl: d.posterUrl,
            type: 'series' as const,
            linkTo: `/series/${d.id}`,
          }))
          .catch(() => null)
      ),
      ...docs.slice(0, 2).map((d) =>
        documentaryService
          .getById(d.id)
          .then((r) => ({
            id: r.id,
            title: r.title,
            overview: r.overview,
            backdropUrl: r.backdropUrl,
            posterUrl: r.posterUrl,
            type: 'documentary' as const,
            linkTo: `/documentaries/${r.id}`,
          }))
          .catch(() => null)
      ),
    ]

    Promise.all(fetches).then((results) => {
      const valid = (results as (HeroItem | null)[]).filter((i): i is HeroItem => i !== null && !!(i?.backdropUrl || i?.posterUrl))
      setHeroItems(valid)
    })
  }, [movies, series, docs, ml, sl, dl])

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
          style={{ height: 'clamp(420px, 62vh, 680px)', marginTop: 'var(--navbar-h)' }}
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
          />
        )}
      </div>
    </div>
  )
}
