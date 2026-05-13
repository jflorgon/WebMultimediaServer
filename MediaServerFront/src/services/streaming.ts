const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
const ORIGIN = API_BASE.replace(/\/api\/?$/, '')

export function streamUrl(path: string): string {
  return `${ORIGIN}${path}`
}

export type StreamMode = 'direct' | 'hls'

export interface StreamSource {
  mode: StreamMode
  url: string
  mime?: string
}

/**
 * Pregunta al backend si el contenido puede servirse en directo (raw file + Range)
 * o si hay que pasar por HLS. Devuelve la URL absoluta lista para usar en <video>.
 */
export async function resolveStreamSource(
  type: 'movies' | 'episodes' | 'documentaries',
  id: string,
): Promise<StreamSource> {
  const res = await fetch(streamUrl(`/api/streaming/${type}/${id}/source`))
  if (!res.ok) {
    // Fallback duro a HLS si el endpoint falla.
    return { mode: 'hls', url: streamUrl(`/api/streaming/${type}/${id}/playlist.m3u8`) }
  }
  const data = (await res.json()) as { mode: StreamMode; url: string; mime?: string }
  return { ...data, url: streamUrl(data.url) }
}

/**
 * Mantiene vivo el proceso FFmpeg asociado a un stream HLS.
 * El servidor cancela el FFmpeg si no recibe heartbeat en ~90s,
 * así una pausa larga o un cambio de página liberan CPU sin esperar al cleanup de 2h.
 */
export function sendKeepAlive(id: string): Promise<void> {
  return fetch(streamUrl(`/api/streaming/keep-alive/${id}`), { method: 'POST' })
    .then(() => undefined)
    .catch(() => undefined)
}
