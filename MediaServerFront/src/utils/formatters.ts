export function formatRuntime(minutes?: number): string {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export function formatRating(rating?: number | null): string {
  return rating != null ? rating.toFixed(1) : '-'
}

export function formatDate(isoDate?: string): string {
  if (!isoDate) return '-'
  return new Date(isoDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
