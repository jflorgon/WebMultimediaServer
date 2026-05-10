import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { useScrollRestoration } from '../hooks/useScrollRestoration'
import { MediaCard } from '../components/ui/MediaCard'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { SearchInputTV } from '../components/ui/SearchInputTV'

const SCROLL_KEY = 'documentaries-scroll-y'

export function DocumentariesPage() {
  const { t } = useTranslation()
  const { items, totalCount, loading, title, genre, fetchAll, appendItems, setTitle, setGenre } = useDocumentariesStore()

  const [inputTitle, setInputTitle] = useState(title)
  const isInitialMount = useRef(true)
  const gridRef = useRef<HTMLDivElement>(null)

  const handleLoadMore = async () => {
    const prevCount = items.length
    await appendItems()
    requestAnimationFrame(() => {
      const links = gridRef.current?.querySelectorAll<HTMLAnchorElement>('a')
      const target = links?.[Math.max(0, prevCount - 1)]
      target?.focus()
    })
  }

  useScrollRestoration(SCROLL_KEY, items.length > 0)

  // Debounce title input → store
  useEffect(() => {
    const id = setTimeout(() => setTitle(inputTitle), 400)
    return () => clearTimeout(id)
  }, [inputTitle, setTitle])

  // Fetch on mount only if list is empty; refetch when filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (items.length > 0) return
    }
    fetchAll()
  }, [title, genre, fetchAll]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = items.length < totalCount

  const availableGenres = useMemo(
    () => Array.from(new Set(items.flatMap((d) => d.genres ?? []))).sort(),
    [items]
  )

  return (
    <div
      className="min-h-screen"
      style={{ paddingTop: 'var(--navbar-h)', backgroundColor: 'var(--netflix-black)', ['--list-top-offset' as string]: 'calc(var(--navbar-h) + 9rem)' }}
    >
      <div style={{ paddingTop: '4rem', paddingBottom: '0.5rem', paddingLeft: '4vw', paddingRight: '4vw' }}>
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-black text-white">{t('nav.documentaries')}</h1>
          <span className="text-sm text-gray-500">{totalCount} títulos</span>
        </div>
      </div>

      <div data-sticky-top style={{ position: 'sticky', top: 'var(--navbar-h)', zIndex: 20, backgroundColor: 'var(--netflix-black)', paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '4vw', paddingRight: '4vw' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <SearchInputTV
            value={inputTitle}
            onChange={setInputTitle}
            placeholder={t('search.placeholder')}
            className="w-full max-w-sm px-4 py-2 text-sm rounded bg-neutral-800 border border-neutral-700 text-white placeholder-gray-500 focus:outline-none focus:border-white"
          />

          {availableGenres.length > 0 && (
            <div className="flex flex-wrap">
              <button
                onClick={() => setGenre(undefined)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !genre ? 'text-black border-transparent' : 'text-gray-400 border-gray-600 hover:border-gray-400'
                }`}
                style={{ marginRight: '0.5rem', marginBottom: '0.25rem', ...(!genre ? { backgroundColor: 'var(--netflix-red)' } : {}) }}
              >
                {t('search.filters')} (todos)
              </button>
              {availableGenres.map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(genre === g ? undefined : g)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    genre === g
                      ? 'text-black border-transparent'
                      : 'text-gray-400 border-gray-600 hover:border-gray-400 hover:text-white'
                  }`}
                  style={{ marginRight: '0.5rem', marginBottom: '0.25rem', ...(genre === g ? { backgroundColor: 'var(--netflix-red)' } : {}) }}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ paddingTop: '1.5rem', paddingBottom: '4rem', paddingLeft: '4vw', paddingRight: '4vw' }}>
        {loading && items.length === 0 ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState message={t('search.noResults')} />
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
              {items.map((d) => (
                <MediaCard
                  key={d.id}
                  title={d.title}
                  year={d.year}
                  posterUrl={d.posterUrl}
                  rating={d.rating}
                  genres={d.genres}
                  linkTo={d.isSeries ? `/series/${d.id}` : `/documentaries/${d.id}`}
                />
              ))}
            </div>

            {hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  style={{
                    backgroundColor: 'transparent',
                    color: loading ? '#666' : 'white',
                    border: '2px solid',
                    borderColor: loading ? '#444' : 'white',
                    borderRadius: '6px',
                    padding: '14px 40px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    minWidth: '220px',
                    letterSpacing: '0.02em',
                  }}
                >
                  {loading ? 'Cargando…' : `Cargar más (${totalCount - items.length} restantes)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
