import { useEffect, useLayoutEffect, useRef } from 'react'

export function useScrollRestoration(key: string, ready: boolean) {
  const restored = useRef(false)

  useLayoutEffect(() => {
    if (restored.current || !ready) return
    const savedY = sessionStorage.getItem(key)
    if (savedY) {
      window.scrollTo(0, parseInt(savedY, 10))
    }
    restored.current = true
  }, [key, ready])

  useEffect(() => {
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
