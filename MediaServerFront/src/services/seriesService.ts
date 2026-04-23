import type { FilterParams, PagedResult } from '../types/common'
import type { EpisodeListItem, Series, SeriesListItem } from '../types/series'
import api from './api'

export const seriesService = {
  getAll: (params?: FilterParams) =>
    api.get<PagedResult<SeriesListItem>>('/series', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Series>(`/series/${id}`).then((r) => r.data),

  getEpisodes: (id: string) =>
    api.get<EpisodeListItem[]>(`/series/${id}/episodes`).then((r) => r.data),
}
