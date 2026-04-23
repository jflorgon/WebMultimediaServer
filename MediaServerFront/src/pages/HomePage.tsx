import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMoviesStore } from '../store/useMoviesStore'
import { useSeriesStore } from '../store/useSeriesStore'
import { useDocumentariesStore } from '../store/useDocumentariesStore'
import { MediaCard } from '../components/ui/MediaCard'
import { Spinner } from '../components/ui/Spinner'

function SectionHeader({ title, linkTo }: { title: string; linkTo: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Link to={linkTo} className="text-sm text-blue-400 hover:text-blue-300">
        {t('home.viewAll')} →
      </Link>
    </div>
  )
}

export function HomePage() {
  const { t } = useTranslation()
  const { items: movies, loading: ml, fetchAll: fetchMovies } = useMoviesStore()
  const { items: series, loading: sl, fetchAll: fetchSeries } = useSeriesStore()
  const { items: docs, loading: dl, fetchAll: fetchDocs } = useDocumentariesStore()

  useEffect(() => {
    fetchMovies({ page: 1, pageSize: 6 })
    fetchSeries({ page: 1, pageSize: 6 })
    fetchDocs({ page: 1, pageSize: 6 })
  }, [fetchMovies, fetchSeries, fetchDocs])

  return (
    <div className="space-y-12">
      <section>
        <SectionHeader title={t('home.recentMovies')} linkTo="/movies" />
        {ml ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {movies.map((m) => (
              <MediaCard key={m.id} title={m.title} year={m.year} posterUrl={m.posterUrl} rating={m.rating} linkTo={`/movies/${m.id}`} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t('home.recentSeries')} linkTo="/series" />
        {sl ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {series.map((s) => (
              <MediaCard key={s.id} title={s.title} year={s.year} posterUrl={s.posterUrl} rating={s.rating} linkTo={`/series/${s.id}`} subtitle={`${s.seasons} temp.`} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t('home.recentDocumentaries')} linkTo="/documentaries" />
        {dl ? <Spinner /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {docs.map((d) => (
              <MediaCard key={d.id} title={d.title} year={d.year} posterUrl={d.posterUrl} rating={d.rating} linkTo={`/documentaries/${d.id}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
