import type { FilterParams, PagedResult } from '../types/common'
import type { Documentary, DocumentaryListItem } from '../types/documentary'
import api from './api'

export const documentaryService = {
  getAll: (params?: FilterParams) =>
    api.get<PagedResult<DocumentaryListItem>>('/documentaries', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Documentary>(`/documentaries/${id}`).then((r) => r.data),
}
