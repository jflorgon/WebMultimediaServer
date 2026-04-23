import { create } from 'zustand'
import type { FilterParams } from '../types/common'
import type { Documentary, DocumentaryListItem } from '../types/documentary'
import { documentaryService } from '../services/documentaryService'

interface DocumentariesState {
  items: DocumentaryListItem[]
  totalCount: number
  selected: Documentary | null
  loading: boolean
  error: string | null
  filters: FilterParams
  fetchAll: (params?: FilterParams) => Promise<void>
  fetchById: (id: string) => Promise<void>
  setFilters: (filters: FilterParams) => void
}

export const useDocumentariesStore = create<DocumentariesState>((set, get) => ({
  items: [],
  totalCount: 0,
  selected: null,
  loading: false,
  error: null,
  filters: { page: 1, pageSize: 20 },

  fetchAll: async (params) => {
    set({ loading: true, error: null })
    try {
      const result = await documentaryService.getAll(params ?? get().filters)
      set({ items: result.items, totalCount: result.totalCount, loading: false })
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

  setFilters: (filters) => set({ filters }),
}))
