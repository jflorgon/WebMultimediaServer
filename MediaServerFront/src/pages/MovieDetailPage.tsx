import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useMoviesStore } from '../store/useMoviesStore'
import { Spinner } from '../components/ui/Spinner'
import { formatRuntime, formatRating } from '../utils/formatters'
import { streamUrl } from '../services/streaming'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

const VideoPlayer = lazy(() =>
  import('../components/ui/VideoPlayer').then(m => ({ default: m.VideoPlayer }))
)

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selected, loading, fetchById } = useMoviesStore()
  const [playing, setPlaying] = useState(false)

  useEffect(() => { if (id) fetchById(id) }, [id, fetchById])

  if (loading) return <Spinner />
  if (!selected) return <p className="text-gray-400">{t('errors.notFound')}</p>

  const streamSrc = streamUrl(`/api/streaming/movies/${selected.id}/playlist.m3u8`)

  return (
    <div style={{ backgroundColor: 'var(--netflix-black)' }}>
      {playing && (
        <Suspense fallback={null}>
          <VideoPlayer
            src={streamSrc}
            title={selected.title}
            onClose={() => setPlaying(false)}
          />
        </Suspense>
      )}

      {!isTizen && (
        <div
          data-tv-fixed-top
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            paddingLeft: '4vw',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            background: 'linear-gradient(to bottom, rgba(20,20,20,0.92) 0%, rgba(20,20,20,0) 100%)',
          }}
        >
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 transition-colors inline-flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem' }}
          >
            ← {t('common.back', 'Volver')}
          </button>
        </div>
      )}

      <div
        className="relative w-full"
        style={{
          height: '50vw',
          minHeight: '350px',
          maxHeight: '700px',
          backgroundColor: 'var(--netflix-dark)',
        }}
      >
        {selected.backdropUrl ? (
          <img
            src={selected.backdropUrl}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900" />
        )}
        <div
          className="hero-gradient"
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />
      </div>

      <motion.div
        className="relative pb-8"
        style={{
          backgroundColor: 'var(--netflix-black)',
          marginTop: '-60px',
          paddingTop: '2rem',
          zIndex: 10,
          paddingLeft: '4vw',
          paddingRight: '4vw',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex">
          {selected.posterUrl && (
            <img
              src={selected.posterUrl}
              alt={selected.title}
              className="w-36 h-auto rounded-lg flex-shrink-0 shadow-2xl hidden md:block self-start object-contain"
              style={{ marginRight: '2rem' }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              {selected.title}
            </h1>
            {selected.originalTitle && selected.originalTitle !== selected.title && (
              <p className="text-gray-400 text-base mb-4">{selected.originalTitle}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-6">
              {selected.year && (
                <span>
                  {t('detail.year')}: <strong className="text-white">{selected.year}</strong>
                </span>
              )}
              {selected.rating && (
                <span>
                  {t('detail.rating')}: <strong className="text-yellow-400">★ {formatRating(selected.rating)}</strong>
                </span>
              )}
              {selected.runtimeMinutes && (
                <span>
                  {t('detail.runtime')}: <strong className="text-white">{formatRuntime(selected.runtimeMinutes)}</strong>
                </span>
              )}
            </div>

            <button
              onClick={() => setPlaying(true)}
              style={{
                backgroundColor: '#e50914',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '10px 28px',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ▶ Reproducir
            </button>

            {selected.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selected.genres.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 border border-gray-600 rounded-full text-xs font-medium text-gray-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {selected.overview && (
              <p
                tabIndex={0}
                className="text-gray-300 leading-relaxed text-base max-w-2xl"
                style={{ padding: '0.5rem 0', borderRadius: 6 }}
              >
                {selected.overview}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
