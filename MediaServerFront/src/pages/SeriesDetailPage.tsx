import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useSeriesStore } from '../store/useSeriesStore'
import { Spinner } from '../components/ui/Spinner'
import { formatRating } from '../utils/formatters'
import { seriesService } from '../services/seriesService'
import type { EpisodeListItem } from '../types/series'

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selected, loading, fetchById } = useSeriesStore()
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([])
  const [activeSeason, setActiveSeason] = useState<number | null>(null)

  useEffect(() => { if (id) fetchById(id) }, [id, fetchById])

  useEffect(() => {
    if (!id) return
    seriesService.getEpisodes(id).then(setEpisodes).catch(() => setEpisodes([]))
  }, [id])

  if (loading) return <Spinner />
  if (!selected) return <p className="text-gray-400">{t('errors.notFound')}</p>

  const seasonMap = episodes.reduce<Record<number, EpisodeListItem[]>>((acc, ep) => {
    if (!acc[ep.seasonNumber]) acc[ep.seasonNumber] = []
    acc[ep.seasonNumber].push(ep)
    return acc
  }, {})
  const seasonNumbers = Object.keys(seasonMap).map(Number).sort((a, b) => a - b)

  if (activeSeason === null && seasonNumbers.length > 0) {
    setActiveSeason(seasonNumbers[0])
  }

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
              <span>
                {t('detail.seasons')}: <strong className="text-white">{selected.seasons}</strong>
              </span>
              <span>
                {t('detail.episodes')}: <strong className="text-white">{selected.episodes}</strong>
              </span>
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

      {seasonNumbers.length > 0 && (
        <div className="py-12" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
          <h2 className="text-2xl font-black text-white mb-6">{t('detail.episodes')}</h2>

          <div className="flex gap-4 border-b border-gray-700 mb-6 overflow-x-auto">
            {seasonNumbers.map((season) => (
              <button
                key={season}
                onClick={() => setActiveSeason(season)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeSeason === season
                    ? 'text-white border-white'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                {t('detail.seasons')} {season}
              </button>
            ))}
          </div>

          {activeSeason !== null && seasonMap[activeSeason] && (
            <ul className="space-y-2">
              {seasonMap[activeSeason]
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map((ep) => (
                  <li
                    key={ep.id}
                    className="flex gap-4 p-4 rounded hover:bg-gray-900 transition-colors"
                  >
                    <span className="text-4xl font-black text-gray-700 w-16 flex-shrink-0 text-right">
                      {String(ep.episodeNumber).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium">{ep.title}</p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
