import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const [openSeasons, setOpenSeasons] = useState<Set<number>>(new Set())

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

  const toggleSeason = (n: number) =>
    setOpenSeasons((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })

  return (
    <div>
      {selected.backdropUrl && (
        <div className="relative -mx-6 -mt-8 mb-8 h-64 overflow-hidden">
          <img src={selected.backdropUrl} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950" />
        </div>
      )}
      <div className="flex gap-8">
        {selected.posterUrl && (
          <img
            src={selected.posterUrl}
            alt={selected.title}
            className="w-48 rounded-lg flex-shrink-0 -mt-24 relative z-10 shadow-2xl"
          />
        )}
        <div className="flex-1">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-300 mb-2">
            ← Volver
          </button>
          <h1 className="text-3xl font-bold mb-1">{selected.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            {selected.year && (
              <span>
                {t('detail.year')}: <strong className="text-white">{selected.year}</strong>
              </span>
            )}
            {selected.rating && (
              <span>
                {t('detail.rating')}:{' '}
                <strong className="text-yellow-400">★ {formatRating(selected.rating)}</strong>
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
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.genres.map((g) => (
                <span key={g} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                  {g}
                </span>
              ))}
            </div>
          )}
          {selected.overview && <p className="text-gray-300 leading-relaxed">{selected.overview}</p>}
        </div>
      </div>

      {seasonNumbers.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">{t('detail.episodes')}</h2>
          <div className="space-y-3">
            {seasonNumbers.map((season) => (
              <div key={season} className="bg-gray-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSeason(season)}
                  className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium">
                    {t('detail.seasons')} {season}
                    <span className="ml-2 text-sm text-gray-400">
                      ({seasonMap[season].length} {t('detail.episodes').toLowerCase()})
                    </span>
                  </span>
                  <span className="text-gray-400">{openSeasons.has(season) ? '▲' : '▼'}</span>
                </button>
                {openSeasons.has(season) && (
                  <ul className="divide-y divide-gray-800">
                    {seasonMap[season]
                      .sort((a, b) => a.episodeNumber - b.episodeNumber)
                      .map((ep) => (
                        <li key={ep.id} className="px-4 py-2 flex gap-3 text-sm text-gray-300">
                          <span className="text-gray-500 w-10 shrink-0">
                            {String(ep.episodeNumber).padStart(2, '0')}
                          </span>
                          <span>{ep.title}</span>
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
