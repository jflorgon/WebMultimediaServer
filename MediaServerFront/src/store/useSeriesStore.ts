import { create } from 'zustand'
import type { Series, SeriesListItem } from '../types/series'
import { seriesService } from '../services/seriesService'

const PAGE_SIZE = 24

interface SeriesState {
  items: SeriesListItem[]
  totalCount: number
  selected: Series | null
  loading: boolean
  error: string | null
  title: string
  genre: string | undefined
  page: number
  allGenres: string[]
  fetchAll: () => Promise<void>
  appendItems: () => Promise<void>
  fetchById: (id: string) => Promise<void>
  fetchGenres: () => Promise<void>
  setTitle: (title: string) => void
  setGenre: (genre: string | undefined) => void
}

export const useSeriesStore = create<SeriesState>((set, get) => ({
  items: [],
  totalCount: 0,
  selected: null,
  loading: false,
  error: null,
  title: '',
  genre: undefined,
  page: 1,
  allGenres: [],

  fetchAll: async () => {
    const { title, genre } = get()
    set({ loading: true, error: null, page: 1 })
    try {
      const result = await seriesService.getAll({ title: title || undefined, genre, page: 1, pageSize: PAGE_SIZE })
      set({ items: result.items, totalCount: result.totalCount, loading: false })
    } catch {
      set({ error: 'Error al cargar series', loading: false })
    }
  },

  appendItems: async () => {
    const { title, genre, page } = get()
    const nextPage = page + 1
    set({ loading: true, page: nextPage })
    try {
      const result = await seriesService.getAll({ title: title || undefined, genre, page: nextPage, pageSize: PAGE_SIZE })
      set(state => ({ items: [...state.items, ...result.items], totalCount: result.totalCount, loading: false }))
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

  fetchGenres: async () => {
    try {
      const genres = await seriesService.getGenres()
      set({ allGenres: genres })
    } catch {
      // no-op
    }
  },

  setTitle: (title) => set({ title }),
  setGenre: (genre) => set({ genre }),
}))
