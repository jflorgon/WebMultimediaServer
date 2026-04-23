import { create } from 'zustand'
import type { FilterParams } from '../types/common'
import type { Series, SeriesListItem } from '../types/series'
import { seriesService } from '../services/seriesService'

interface SeriesState {
  items: SeriesListItem[]
  totalCount: number
  selected: Series | null
  loading: boolean
  error: string | null
  filters: FilterParams
  fetchAll: (params?: FilterParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  setFilters: (filters: FilterParams) => void
}

export const useSeriesStore = create<SeriesState>((set, get) => ({
  items: [],
  totalCount: 0,
  selected: null,
  loading: false,
  error: null,
  filters: { page: 1, pageSize: 20 },

  fetchAll: async (params) => {
    set({ loading: true, error: null })
    try {
      const result = await seriesService.getAll(params ?? get().filters)
      set({ items: result.items, totalCount: result.totalCount, loading: false })
    } catch {
      set({ error: 'Error al cargar series', loading: false })
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null })
    try {
      const series = await seriesService.getById(id)
      set({ selected: series, loading: false })
    } catch {
      set({ error: 'Serie no encontrada', loading: false })
    }
  },

  setFilters: (filters) => set({ filters }),
}))
