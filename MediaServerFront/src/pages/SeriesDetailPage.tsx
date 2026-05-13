import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useSeriesStore } from '../store/useSeriesStore'
import { Spinner } from '../components/ui/Spinner'
import { formatRating } from '../utils/formatters'
import { seriesService } from '../services/seriesService'
import { useStreamSource } from '../services/useStreamSource'
import { AgeRatingBadge } from '../components/ui/AgeRatingBadge'
import type { EpisodeListItem } from '../types/series'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

const VideoPlayer = lazy(() =>
  import('../components/ui/VideoPlayer').then(m => ({ default: m.VideoPlayer }))
)

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selected, loading, fetchById } = useSeriesStore()
  const [episodes, setEpisodes] = useState<EpisodeListItem[]>([])
  const [activeSeason, setActiveSeason] = useState<number | null>(null)
  const [playingEpisodeId, setPlayingEpisodeId] = useState<string | null>(null)

  useEffect(() => { if (id) fetchById(id) }, [id, fetchById])

  useEffect(() => {
    if (!id) return
    seriesService.getEpisodes(id).then(setEpisodes).catch(() => setEpisodes([]))
  }, [id])

  const { source: episodeSource } = useStreamSource('episodes', playingEpisodeId, !!playingEpisodeId)

  if (loading) return <Spinner />
  if (!selected) return <p className="text-gray-400">{t('errors.notFound')}</p>

  const seasonMap = episodes.reduce<Record<number, EpisodeListItem[]>>((acc, ep) => {
    if (!acc[ep.seasonNumber]) acc[ep.seasonNumber] = []
    acc[ep.seasonNumber].push(ep)
    return acc
  }, {})
  const seasonNumbers = Object.keys(seasonMap).map(Number).sort((a, b) => a - b)
  const currentSeason = activeSeason ?? seasonNumbers[0] ?? null

  return (
    <div style={{ backgroundColor: 'var(--netflix-black)' }}>
      {playingEpisodeId && episodeSource && (
        <Suspense fallback={null}>
          <VideoPlayer
            src={episodeSource.url}
            mode={episodeSource.mode}
            keepAliveId={playingEpisodeId}
            title={episodes.find(e => e.id === playingEpisodeId)?.title ?? ''}
            onClose={() => setPlayingEpisodeId(null)}
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
              <AgeRatingBadge ageRating={selected.ageRating} />
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

      {seasonNumbers.length > 0 && (
        <div className="py-12" style={{ paddingLeft: '4vw', paddingRight: '4vw' }}>
          <h2 className="text-2xl font-black text-white mb-6">{t('detail.episodes')}</h2>

          <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
            {seasonNumbers.map((season, idx) => (
              <button
                key={season}
                onClick={() => setActiveSeason(season)}
                className={`season-tab ${currentSeason === season ? 'season-tab--active' : ''}`}
                style={idx < seasonNumbers.length - 1 ? { marginRight: '1.5rem' } : undefined}
              >
                {t('detail.seasons')} {season}
              </button>
            ))}
          </div>

          {currentSeason !== null && seasonMap[currentSeason] && (
            <ul className="space-y-2">
              {seasonMap[currentSeason!]
                .sort((a, b) => a.episodeNumber - b.episodeNumber)
                .map((ep) => (
                  <li key={ep.id}>
                    <button
                      onClick={() => setPlayingEpisodeId(ep.id)}
                      title={t('detail.play', 'Reproducir episodio')}
                      className="episode-row"
                    >
                      <span className="episode-row__num">
                        {String(ep.episodeNumber).padStart(2, '0')}
                      </span>
                      <span className="episode-row__title">{ep.title}</span>
                      <span className="episode-row__play" aria-hidden>▶</span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
