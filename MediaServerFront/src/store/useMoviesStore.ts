import { create } from 'zustand'
import type { FilterParams } from '../types/common'
import type { Movie, MovieListItem } from '../types/movie'
import { movieService } from '../services/movieService'

interface MoviesState {
  items: MovieListItem[]
  totalCount: number
  selected: Movie | null
  loading: boolean
  error: string | null
  filters: FilterParams
  fetchAll: (params?: FilterParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  setFilters: (filters: FilterParams) => void
}

export const useMoviesStore = create<MoviesState>((set, get) => ({
  items: [],
  totalCount: 0,
  selected: null,
  loading: false,
  error: null,
  filters: { page: 1, pageSize: 20 },

  fetchAll: async (params) => {
    set({ loading: true, error: null })
    try {
      const result = await movieService.getAll(params ?? get().filters)
      set({ items: result.items, totalCount: result.totalCount, loading: false })
    } catch {
      set({ error: 'Error al cargar películas', loading: false })
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null })
    try {
      const movie = await movieService.getById(id)
      set({ selected: movie, loading: false })
    } catch {
      set({ error: 'Película no encontrada', loading: false })
    }
  },

  setFilters: (filters) => set({ filters }),
}))
