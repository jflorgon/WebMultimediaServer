import { useEffect } from 'react'

declare global {
  interface Window {
    tizen?: {
      tvinputdevice?: {
        registerKey: (name: string) => void
      }
      application?: {
        getCurrentApplication: () => { exit: () => void }
      }
    }
  }
}

const TIZEN_RETURN_KEYCODE = 10009
const KEY_LEFT = 37
const KEY_UP = 38
const KEY_RIGHT = 39
const KEY_DOWN = 40

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type Direction = 'up' | 'down' | 'left' | 'right'

// Calcula la zona ocupada por elementos pegados al borde superior (navbar fixed
// + barra sticky de filtros) para que scrollFocusedIntoView no deje el foco
// debajo de ellos. Tizen 5 (Chromium ~69) ignora `scroll-margin-top`, por eso
// hacemos el cálculo y el scroll manualmente.
function getTopOccupied(): number {
  let occupied = 0
  const fixedSelectors = ['nav', '[data-tv-fixed-top]', '[data-sticky-top]']
  for (const sel of fixedSelectors) {
    const els = document.querySelectorAll<HTMLElement>(sel)
    for (const el of Array.from(els)) {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue
      const r = el.getBoundingClientRect()
      // Solo elementos realmente pegados al top (no en mitad de la página)
      if (r.top <= occupied + 2 && r.bottom > occupied) occupied = r.bottom
    }
  }
  return occupied
}

function scrollFocusedIntoView(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const topOccupied = getTopOccupied()
  const margin = 12
  const viewportH = window.innerHeight

  if (r.top < topOccupied + margin) {
    window.scrollBy({ top: r.top - topOccupied - margin })
  } else if (r.bottom > viewportH - margin) {
    window.scrollBy({ top: r.bottom - viewportH + margin })
  }
}

// Devuelve el contenedor scrollable activo: overlay de vídeo, overlay de detalle, o window.
// Tizen 5/6 (Chromium 63-76) tiene un bug por el cual `position: fixed/sticky` dentro de un
// `overflow: auto` ancestral scrollea con el contenido, por eso necesitamos scrollear el
// contenedor real (no `window`, que es no-op cuando body tiene `overflow: hidden`).
function getScrollContainer(): HTMLElement | null {
  const videoOverlay = document.querySelector<HTMLElement>(
    'div[style*="z-index: 9999"], div[style*="z-index:9999"]'
  )
  if (videoOverlay) return videoOverlay
  const detailOverlay = document.querySelector<HTMLElement>(
    'div[style*="z-index: 100"], div[style*="z-index:100"]'
  )
  if (detailOverlay) return detailOverlay
  return null
}

function scrollViewport(direction: 'up' | 'down') {
  const amount = 240
  const top = direction === 'up' ? -amount : amount
  const scroller = getScrollContainer()
  if (scroller) {
    scroller.scrollBy({ top, behavior: 'smooth' })
  } else {
    window.scrollBy({ top, behavior: 'smooth' })
  }
}

function getFocusable(): HTMLElement[] {
  // Si hay un overlay (modal/reproductor) visible, limitar la búsqueda a su contenido.
  // El overlay del reproductor de vídeo tiene z-index 9999; el de detalle tiene 100.
  // El navbar fixed (z-50) queda excluido cuando hay overlay activo.
  const scroller = getScrollContainer()
  const root: ParentNode = scroller ?? document

  const all = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  return all.filter((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return false
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false
    return true
  })
}

function moveFocus(direction: Direction) {
  const candidates = getFocusable()
  if (candidates.length === 0) return

  const current = document.activeElement as HTMLElement | null
  if (!current || current === document.body || !candidates.includes(current)) {
    candidates[0].focus({ preventScroll: true })
    scrollFocusedIntoView(candidates[0])
    return
  }

  const cur = current.getBoundingClientRect()

  let best: HTMLElement | null = null
  let bestScore = Infinity

  // Tolerancia para considerar que dos rects están "alineados" (misma fila/columna).
  // Las cards en Tizen tienen scale 1.05 al focus, lo que rompe alineaciones perfectas.
  const ALIGN_TOLERANCE_PX = 12
  const NO_OVERLAP_PENALTY = 100000 // gran penalización si no comparten fila/columna

  for (const el of candidates) {
    if (el === current) continue
    const r = el.getBoundingClientRect()

    let primary: number
    let secondary: number
    let aligned = false

    switch (direction) {
      case 'right': {
        if (r.left < cur.right - 1) continue
        primary = r.left - cur.right
        const overlapY = Math.min(cur.bottom, r.bottom) - Math.max(cur.top, r.top)
        const minH = Math.min(cur.height, r.height)
        // Considerado misma fila si el solapamiento Y es >= 50% del menor alto
        aligned = overlapY >= Math.max(minH * 0.5, ALIGN_TOLERANCE_PX)
        secondary = aligned ? 0 : Math.abs((r.top + r.bottom) / 2 - (cur.top + cur.bottom) / 2)
        break
      }
      case 'left': {
        if (r.right > cur.left + 1) continue
        primary = cur.left - r.right
        const overlapY = Math.min(cur.bottom, r.bottom) - Math.max(cur.top, r.top)
        const minH = Math.min(cur.height, r.height)
        aligned = overlapY >= Math.max(minH * 0.5, ALIGN_TOLERANCE_PX)
        secondary = aligned ? 0 : Math.abs((r.top + r.bottom) / 2 - (cur.top + cur.bottom) / 2)
        break
      }
      case 'down': {
        if (r.top < cur.bottom - 1) continue
        primary = r.top - cur.bottom
        const overlapX = Math.min(cur.right, r.right) - Math.max(cur.left, r.left)
        const minW = Math.min(cur.width, r.width)
        aligned = overlapX >= Math.max(minW * 0.5, ALIGN_TOLERANCE_PX)
        secondary = aligned ? 0 : Math.abs((r.left + r.right) / 2 - (cur.left + cur.right) / 2)
        break
      }
      case 'up': {
        if (r.bottom > cur.top + 1) continue
        primary = cur.top - r.bottom
        const overlapX = Math.min(cur.right, r.right) - Math.max(cur.left, r.left)
        const minW = Math.min(cur.width, r.width)
        aligned = overlapX >= Math.max(minW * 0.5, ALIGN_TOLERANCE_PX)
        secondary = aligned ? 0 : Math.abs((r.left + r.right) / 2 - (cur.left + cur.right) / 2)
        break
      }
    }

    // Si no hay solapamiento perpendicular, penalización enorme: solo se elige
    // este candidato si ningún otro alineado es alcanzable.
    const misalignmentPenalty = aligned ? 0 : NO_OVERLAP_PENALTY
    const score = primary + secondary * 2 + misalignmentPenalty
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }

  if (best) {
    // preventScroll evita el doble-scroll (focus + scroll manual).
    best.focus({ preventScroll: true })
    scrollFocusedIntoView(best)
  } else if (direction === 'up' || direction === 'down') {
    // No hay candidato en esta dirección: scrollear el contenedor activo para que
    // el usuario pueda ver el héroe (arriba) o continuar (abajo) aunque ningún
    // focusable lo lleve allí.
    scrollViewport(direction)
  }
}

function focusFirstAvailable() {
  if (document.activeElement && document.activeElement !== document.body) return
  const first = getFocusable()[0]
  if (first) first.focus()
}

export function useTizenRemote(enabled = false) {
  useEffect(() => {
    if (!enabled) return
    const tvinput = window.tizen?.tvinputdevice
    if (tvinput) {
      try {
        tvinput.registerKey('Return')
      } catch {
        // El key ya estaba registrado o no soportado en este modelo
      }
    }

    focusFirstAvailable()
    const initInterval = window.setInterval(focusFirstAvailable, 500)
    const stopInit = window.setTimeout(() => window.clearInterval(initInterval), 5000)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.keyCode === TIZEN_RETURN_KEYCODE) {
        event.preventDefault()
        if (window.history.length > 1) {
          window.history.back()
          return
        }
        try {
          window.tizen?.application?.getCurrentApplication().exit()
        } catch {
          window.close()
        }
        return
      }

      let direction: Direction | null = null
      switch (event.keyCode) {
        case KEY_UP: direction = 'up'; break
        case KEY_DOWN: direction = 'down'; break
        case KEY_LEFT: direction = 'left'; break
        case KEY_RIGHT: direction = 'right'; break
      }
      if (direction) {
        event.preventDefault()
        moveFocus(direction)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearInterval(initInterval)
      window.clearTimeout(stopInit)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])
}
