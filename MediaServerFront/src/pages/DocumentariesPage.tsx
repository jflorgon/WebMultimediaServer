import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { MediaCard } from '../components/ui/MediaCard'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import type { FilterParams } from '../types/common'

export function DocumentariesPage() {
  const { t } = useTranslation()
  const { items, totalCount, loading, fetchAll } = useDocumentariesStore()
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 24 })

  useEffect(() => { fetchAll(filters) }, [filters, fetchAll])

  const totalPages = Math.ceil(totalCount / (filters.pageSize ?? 24))

  const setGenre = (genre: string | undefined) =>
    setFilters({ ...filters, genre, page: 1 })

  const availableGenres = Array.from(
    new Set(items.flatMap((d) => d.genres ?? []))
  ).sort()

  return (
    <div
      className="min-h-screen"
      style={{
        paddingTop: 'var(--navbar-h)',
        backgroundColor: 'var(--netflix-black)',
      }}
    >
      <div style={{ paddingTop: '4rem', paddingBottom: '1rem', paddingLeft: '4vw', paddingRight: '4vw' }}>
        <div className="flex items-baseline gap-4" style={{ marginBottom: '2rem' }}>
          <h1 className="text-3xl font-black text-white">{t('nav.documentaries')}</h1>
          <span className="text-sm text-gray-500">{totalCount} títulos</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input
            type="text"
            value={filters.title ?? ''}
            onChange={(e) =>
              setFilters({ ...filters, title: e.target.value || undefined, page: 1 })
            }
            placeholder={t('search.placeholder')}
            className="w-full max-w-sm px-4 py-2 text-sm rounded bg-neutral-800 border border-neutral-700 text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />

          {availableGenres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setGenre(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  !filters.genre
                    ? 'text-black border-transparent'
                    : 'text-gray-400 border-gray-600 hover:border-gray-400'
                }`}
                style={!filters.genre ? { backgroundColor: 'var(--netflix-red)' } : {}}
              >
                {t('search.filters')} (todos)
              </button>
              {availableGenres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(filters.genre === g ? undefined : g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filters.genre === g
                      ? 'text-black border-transparent'
                      : 'text-gray-400 border-gray-600 hover:border-gray-400 hover:text-white'
                  }`}
                  style={filters.genre === g ? { backgroundColor: 'var(--netflix-red)' } : {}}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '4vw', paddingRight: '4vw' }}>
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState message={t('search.noResults')} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {items.map((d) => (
                <MediaCard
                  key={d.id}
                  title={d.title}
                  year={d.year}
                  posterUrl={d.posterUrl}
                  rating={d.rating}
                  genres={d.genres}
                  linkTo={`/documentaries/${d.id}`}
                />
              ))}
            </div>
            <Pagination
              page={filters.page ?? 1}
              totalPages={totalPages}
              onPageChange={(p) => setFilters({ ...filters, page: p })}
            />
          </>
        )}
      </div>
    </div>
  )
}
