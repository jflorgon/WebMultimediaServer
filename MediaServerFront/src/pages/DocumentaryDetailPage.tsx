import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { Spinner } from '../components/ui/Spinner'
import { formatRuntime, formatRating } from '../utils/formatters'

export function DocumentaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { selected, loading, fetchById } = useDocumentariesStore()

  useEffect(() => { if (id) fetchById(id) }, [id, fetchById])

  if (loading) return <Spinner />
  if (!selected) return <p className="text-gray-400">{t('errors.notFound')}</p>

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
          <img src={selected.posterUrl} alt={selected.title} className="w-48 rounded-lg flex-shrink-0 -mt-24 relative z-10 shadow-2xl" />
        )}
        <div className="flex-1">
          <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-300 mb-2">← Volver</button>
          <h1 className="text-3xl font-bold mb-1">{selected.title}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
            {selected.year && <span>{t('detail.year')}: <strong className="text-white">{selected.year}</strong></span>}
            {selected.rating && <span>{t('detail.rating')}: <strong className="text-yellow-400">★ {formatRating(selected.rating)}</strong></span>}
            {selected.runtimeMinutes && <span>{t('detail.runtime')}: <strong className="text-white">{formatRuntime(selected.runtimeMinutes)}</strong></span>}
          </div>
          {selected.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.genres.map((g) => (
                <span key={g} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{g}</span>
              ))}
            </div>
          )}
          {selected.overview && <p className="text-gray-300 leading-relaxed">{selected.overview}</p>}
        </div>
      </div>
    </div>
  )
}
