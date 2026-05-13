import { useEffect, useState } from 'react'
import { resolveStreamSource, type StreamSource } from './streaming'

export function useStreamSource(
  type: 'movies' | 'episodes' | 'documentaries',
  id: string | null | undefined,
  enabled: boolean,
): { source: StreamSource | null; loading: boolean; error: boolean } {
  const [source, setSource] = useState<StreamSource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!enabled || !id) {
      setSource(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(false)
    resolveStreamSource(type, id)
      .then((s) => { if (!cancelled) setSource(s) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [type, id, enabled])

  return { source, loading, error }
}
