import { create } from 'zustand'
import type { Movie, MovieListItem } from '../types/movie'
import { movieService } from '../services/movieService'

const PAGE_SIZE = 24

interface MoviesState {
  items: MovieListItem[]
  totalCount: number
  selected: Movie | null
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

export const useMoviesStore = create<MoviesState>((set, get) => ({
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
      const result = await movieService.getAll({ title: title || undefined, genre, page: 1, pageSize: PAGE_SIZE })
      set({ items: result.items, totalCount: result.totalCount, loading: false })
    } catch {
      set({ error: 'Error al cargar películas', loading: false })
    }
  },

  appendItems: async () => {
    const { title, genre, page } = get()
    const nextPage = page + 1
    set({ loading: true, page: nextPage })
    try {
      const result = await movieService.getAll({ title: title || undefined, genre, page: nextPage, pageSize: PAGE_SIZE })
      set(state => ({ items: [...state.items, ...result.items], totalCount: result.totalCount, loading: false }))
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

  fetchGenres: async () => {
    try {
      const genres = await movieService.getGenres()
      set({ allGenres: genres })
    } catch {
      // no-op; los chips quedan vacíos si falla
    }
  },

  setTitle: (title) => set({ title }),
  setGenre: (genre) => set({ genre }),
}))
