export interface ScannerStatus {
  isRunning: boolean
  lastRunAt?: string
  lastResult?: string
  itemsScanned: number
}
