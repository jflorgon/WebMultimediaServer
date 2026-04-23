import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSeriesStore } from '../store/useSeriesStore'
import { MediaCard } from '../components/ui/MediaCard'
import { SearchBar } from '../components/ui/SearchBar'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import type { FilterParams } from '../types/common'

export function SeriesPage() {
  const { t } = useTranslation()
  const { items, totalCount, loading, fetchAll } = useSeriesStore()
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 20 })

  useEffect(() => { fetchAll(filters) }, [filters, fetchAll])

  const totalPages = Math.ceil(totalCount / (filters.pageSize ?? 20))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('nav.series')}</h1>
        <span className="text-gray-400 text-sm">{totalCount} títulos</span>
      </div>
      <div className="mb-6 max-w-md">
        <SearchBar
          value={filters.title ?? ''}
          onChange={(v) => setFilters({ ...filters, title: v || undefined, page: 1 })}
        />
      </div>
      {loading ? <Spinner /> : items.length === 0 ? <EmptyState message={t('search.noResults')} /> : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((s) => (
              <MediaCard key={s.id} title={s.title} year={s.year} posterUrl={s.posterUrl} rating={s.rating} linkTo={`/series/${s.id}`} subtitle={`${s.seasons} temp.`} />
            ))}
          </div>
          <Pagination page={filters.page ?? 1} totalPages={totalPages} onPageChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}
    </div>
  )
}
