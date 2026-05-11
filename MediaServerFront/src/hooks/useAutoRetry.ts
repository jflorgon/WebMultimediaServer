import { useEffect, useRef } from 'react'

interface Options {
  /** Tiempo entre intentos en ms. */
  intervalMs?: number
  /** Número máximo de reintentos antes de rendirse. */
  maxAttempts?: number
}

/**
 * Reintenta `retry()` cada `intervalMs` mientras `isEmpty` y `!isLoading`,
 * hasta un máximo de `maxAttempts`. El contador se resetea cuando deja de
 * estar vacío (carga con éxito). Si vuelve a vaciarse, empieza de nuevo.
 */
export function useAutoRetry(
  isEmpty: boolean,
  isLoading: boolean,
  retry: () => void,
  { intervalMs = 10_000, maxAttempts = 15 }: Options = {}
) {
  const attemptsRef = useRef(0)

  useEffect(() => {
    if (!isEmpty) attemptsRef.current = 0
  }, [isEmpty])

  useEffect(() => {
    if (!isEmpty || isLoading) return
    if (attemptsRef.current >= maxAttempts) return

    const id = window.setTimeout(() => {
      attemptsRef.current += 1
      retry()
    }, intervalMs)
    return () => window.clearTimeout(id)
  }, [isEmpty, isLoading, retry, intervalMs, maxAttempts])
}
