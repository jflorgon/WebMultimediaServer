import type { ScannerStatus } from '../types/scanner'
import api from './api'

export const scannerService = {
  getStatus: () => api.get<ScannerStatus>('/scanner/status').then((r) => r.data),
  trigger: () => api.post('/scanner/trigger').then((r) => r.data),
}
