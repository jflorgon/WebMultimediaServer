import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { formatRating } from '../../utils/formatters'

interface MediaCardProps {
  title: string
  year?: number
  posterUrl?: string
  backdropUrl?: string
  rating?: number | null
  genres?: string[]
  linkTo: string
  subtitle?: string
}

export function MediaCard({
  title, year, posterUrl, backdropUrl,
  rating, genres, linkTo, subtitle
}: MediaCardProps) {
  const [hovered, setHovered] = useState(false)

  const imageUrl = backdropUrl ?? posterUrl

  return (
    <Link to={linkTo} className="block outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-md">
      <motion.div
        className="relative overflow-visible rounded-md cursor-pointer"
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={hovered ? { scale: 1.25, zIndex: 20 } : { scale: 1, zIndex: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: hovered ? 0.15 : 0 }}
        style={{ transformOrigin: 'center center' }}
      >
        {/* Imagen principal 16:9 */}
        <div className="relative aspect-video overflow-hidden rounded-md bg-neutral-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
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
        </div>

        {/* Overlay hover — aparece debajo de la imagen */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full rounded-b-md px-3 py-2 z-10"
              style={{ backgroundColor: 'var(--netflix-gray)' }}
            >
              <p className="text-white text-sm font-semibold leading-snug truncate">{title}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                {year && <span className="text-green-400 font-medium">{year}</span>}
                {rating != null && (
                  <span className="text-yellow-400">★ {formatRating(rating)}</span>
                )}
              </div>
              {genres && genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {genres.slice(0, 3).map((g) => (
                    <span key={g} className="text-[10px] text-gray-400 border border-gray-600 rounded px-1.5 py-0.5">
                      {g}
                    </span>
                  ))}
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )
}
