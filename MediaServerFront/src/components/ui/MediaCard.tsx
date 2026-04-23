import { Link } from 'react-router-dom'

interface MediaCardProps {
  title: string
  year?: number
  posterUrl?: string
  rating?: number
  linkTo: string
  subtitle?: string
}

export function MediaCard({ title, year, posterUrl, rating, linkTo, subtitle }: MediaCardProps) {
  return (
    <Link to={linkTo} className="group block">
      <div className="relative overflow-hidden rounded-lg bg-gray-800 transition-transform duration-200 group-hover:scale-105">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full aspect-[2/3] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[2/3] flex items-center justify-center bg-gray-700 text-gray-400 text-sm">
            Sin imagen
          </div>
        )}
        {rating !== undefined && (
          <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
            ★ {rating.toFixed(1)}
          </span>
        )}
      </div>
      <p className="mt-2 font-medium text-white truncate">{title}</p>
      <p className="text-sm text-gray-400">
        {subtitle ?? year ?? ''}
      </p>
    </Link>
  )
}
