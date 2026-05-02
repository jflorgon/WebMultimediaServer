const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function streamUrl(path: string): string {
  return `${ORIGIN}${path}`
}
