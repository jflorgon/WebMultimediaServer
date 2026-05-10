import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { formatRating } from '../../utils/formatters'

const isTizen = import.meta.env.VITE_TIZEN === 'true'
const FOCUS_SCALE = isTizen ? 1.12 : 1.25

interface MediaCardProps {
  title: string
  year?: number
  posterUrl?: string
  backdropUrl?: string
  rating?: number | null
  genres?: string[]
  linkTo: string
  subtitle?: string
  expandOrigin?: string
  onArrowLeft?: () => void
  onArrowRight?: () => void
}

export function MediaCard({
  title, year, posterUrl, backdropUrl,
  rating, genres, linkTo, subtitle,
  expandOrigin,
  onArrowLeft, onArrowRight
}: MediaCardProps) {
  const [hovered, setHovered] = useState(false)
  const location = useLocation()

  const useBackdrop = !!backdropUrl
  const imageUrl = backdropUrl ?? posterUrl

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // En Tizen el hook useTizenRemote maneja TODA la navegación con D-pad globalmente.
    // Si MediaCard también responde aquí, ambos handlers mueven el foco → salto doble.
    if (isTizen) return
    if (e.key === 'ArrowLeft' && onArrowLeft) { e.preventDefault(); onArrowLeft() }
    else if (e.key === 'ArrowRight' && onArrowRight) { e.preventDefault(); onArrowRight() }
  }

  return (
    <Link
      to={linkTo}
      state={{ backgroundLocation: location }}
      className="block outline-none rounded-md"
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="relative overflow-visible rounded-md cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={hovered ? { scale: FOCUS_SCALE, zIndex: 50 } : { scale: 1, zIndex: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: hovered ? 0.15 : 0 }}
        style={{ transformOrigin: expandOrigin ?? 'top center' }}
      >
        {/* Imagen: 16:9 con backdrop, 2:3 con poster solo */}
        <div className={`relative overflow-hidden rounded-md bg-neutral-800 ${useBackdrop ? 'aspect-video' : 'aspect-[2/3]'}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs gap-1">
              <span className="text-2xl">▶</span>
              <span className="truncate px-2 text-center">{title}</span>
            </div>
          )}

          {/* Rating badge — siempre visible */}
          {rating != null && (
            <span className="absolute top-1.5 right-1.5 bg-black/70 text-yellow-400 text-xs font-bold px-1.5 py-0.5 rounded">
              ★ {formatRating(rating)}
            </span>
          )}

          {/* Anillo de foco Tizen: dentro del contenedor, visible en los 4 lados */}
          {isTizen && hovered && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                border: '4px solid #C04545',
                borderRadius: '6px',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Overlay hover — aparece debajo de la imagen */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={`absolute left-0 right-0 top-full rounded-b-md z-10 ${isTizen ? 'px-4 py-3 pb-4' : 'px-3 py-2'}`}
              style={{ backgroundColor: 'var(--netflix-gray)' }}
            >
              <p className={`text-white font-semibold leading-snug truncate ${isTizen ? 'text-base' : 'text-sm'}`}>{title}</p>
              <div className={`flex items-center gap-2 mt-1 text-gray-400 ${isTizen ? 'text-sm' : 'text-xs'}`}>
                {year && <span className="text-green-400 font-medium">{year}</span>}
                {rating != null && (
                  <span className="text-yellow-400">★ {formatRating(rating)}</span>
                )}
              </div>
              {genres && genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {genres.slice(0, 3).map((g) => (
                    <span key={g} className={`text-gray-400 border border-gray-600 rounded px-1.5 py-0.5 ${isTizen ? 'text-xs' : 'text-[10px]'}`}>
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {subtitle && (
                <p className={`text-gray-500 mt-1 ${isTizen ? 'text-sm' : 'text-xs'}`}>{subtitle}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )
}
