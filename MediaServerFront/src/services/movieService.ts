import type { FilterParams, PagedResult } from '../types/common'
import type { Movie, MovieListItem } from '../types/movie'
import api from './api'

export const movieService = {
  getAll: (params?: FilterParams) =>
    api.get<PagedResult<MovieListItem>>('/movies', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Movie>(`/movies/${id}`).then((r) => r.data),
}
