import { create } from 'zustand'
import type { Documentary, DocumentaryListItem } from '../types/documentary'
import { documentaryService } from '../services/documentaryService'

const PAGE_SIZE = 24

interface DocumentariesState {
  items: DocumentaryListItem[]
  totalCount: number
  selected: Documentary | null
  loading: boolean
  error: string | null
  title: string
  genre: string | undefined
  page: number
  fetchAll: () => Promise<void>
  appendItems: () => Promise<void>
  fetchById: (id: string) => Promise<void>
  setTitle: (title: string) => void
  setGenre: (genre: string | undefined) => void
}

export const useDocumentariesStore = create<DocumentariesState>((set, get) => ({
  items: [],
  totalCount: 0,
  selected: null,
  loading: false,
  error: null,
  title: '',
  genre: undefined,
  page: 1,

  fetchAll: async () => {
    const { title, genre } = get()
    set({ loading: true, error: null, page: 1 })
    try {
      const result = await documentaryService.getAll({ title: title || undefined, genre, page: 1, pageSize: PAGE_SIZE })
      set({ items: result.items, totalCount: result.totalCount, loading: false })
    } catch {
      set({ error: 'Error al cargar documentales', loading: false })
    }
  },

  appendItems: async () => {
    const { title, genre, page } = get()
    const nextPage = page + 1
    set({ loading: true, page: nextPage })
    try {
      const result = await documentaryService.getAll({ title: title || undefined, genre, page: nextPage, pageSize: PAGE_SIZE })
      set(state => ({ items: [...state.items, ...result.items], totalCount: result.totalCount, loading: false }))
    } catch {
      set({ error: 'Error al cargar documentales', loading: false })
    }
  },

  fetchById: async (id) => {
    set({ loading: true, error: null })
    try {
      const doc = await documentaryService.getById(id)
      set({ selected: doc, loading: false })
    } catch {
      set({ error: 'Documental no encontrado', loading: false })
    }
  },

  setTitle: (title) => set({ title }),
  setGenre: (genre) => set({ genre }),
}))
