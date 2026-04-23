import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useMoviesStore } from '../store/useMoviesStore'
import { Spinner } from '../components/ui/Spinner'
import { formatRuntime, formatRating } from '../utils/formatters'

export function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selected, loading, fetchById } = useMoviesStore()

  useEffect(() => { if (id) fetchById(id) }, [id, fetchById])

  if (loading) return <Spinner />
  if (!selected) return <p className="text-gray-400">{t('errors.notFound')}</p>

  return (
    <div style={{ backgroundColor: 'var(--netflix-black)' }}>
      <div
        className="relative w-full"
        style={{
          height: 'clamp(350px, 56vw, 700px)',
          backgroundColor: 'var(--netflix-dark)',
        }}
      >
        {selected.backdropUrl ? (
          <img
            src={selected.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 hero-gradient" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-0 left-0 z-20 px-6 text-white hover:text-gray-300 transition-colors flex items-center gap-2"
          style={{ marginTop: 'var(--navbar-h)' }}
        >
          ← Volver
        </button>
      </div>

      <motion.div
        className="relative pb-8"
        style={{
          backgroundColor: 'var(--netflix-black)',
          marginTop: '-120px',
          zIndex: 10,
          paddingLeft: '4vw',
          paddingRight: '4vw',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex gap-8">
          {selected.posterUrl && (
            <img
              src={selected.posterUrl}
              alt={selected.title}
              className="w-36 rounded-lg flex-shrink-0 shadow-2xl hidden md:block"
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
              <p className="text-gray-300 leading-relaxed text-base max-w-2xl">
                {selected.overview}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
