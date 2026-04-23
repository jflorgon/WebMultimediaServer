import { create } from 'zustand'
import type { ScannerStatus } from '../types/scanner'
import { scannerService } from '../services/scannerService'

interface ScannerState {
  status: ScannerStatus | null
  loading: boolean
  fetchStatus: () => Promise<void>
  trigger: () => Promise<void>
}

export const useScannerStore = create<ScannerState>((set) => ({
  status: null,
  loading: false,

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
    await scannerService.trigger()
  },
}))
