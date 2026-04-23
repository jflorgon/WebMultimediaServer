import { create } from 'zustand'
import type { ScannerStatus } from '../types/scanner'
import { scannerService } from '../services/scannerService'

interface ScannerState {
  status: ScannerStatus | null
  loading: boolean
  triggering: boolean
  error: string | null
  fetchStatus: () => Promise<void>
  trigger: () => Promise<void>
}

export const useScannerStore = create<ScannerState>((set) => ({
  status: null,
  loading: false,
  triggering: false,
  error: null,

  fetchStatus: async () => {
    set({ loading: true })
    try {
      const status = await scannerService.getStatus()
      set({ status, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  trigger: async () => {
    set({ triggering: true, error: null })
    try {
      await scannerService.trigger()
      set({ triggering: false })
    } catch (err) {
      set({ triggering: false, error: 'Error al iniciar escaneo' })
    }
  },
}))
