import { useEffect, useLayoutEffect, useRef } from 'react'

const isTizen = import.meta.env.VITE_TIZEN === 'true'

export function useScrollRestoration(key: string, ready: boolean) {
  const restored = useRef(false)

  useLayoutEffect(() => {
    if (restored.current || !ready) return
    // En Tizen TV el D-pad gestiona scroll vía scrollIntoView. Restaurar
    // un scroll antiguo deja la página descolocada (cabecera/filtros invisibles).
    if (isTizen) {
      window.scrollTo(0, 0)
      sessionStorage.removeItem(key)
      restored.current = true
      return
    }
    const savedY = sessionStorage.getItem(key)
    if (savedY) {
      window.scrollTo(0, parseInt(savedY, 10))
    }
    restored.current = true
  }, [key, ready])

  useEffect(() => {
    if (isTizen) return // No guardar scroll en TV
    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        sessionStorage.setItem(key, String(window.scrollY))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key])

  return restored
}
