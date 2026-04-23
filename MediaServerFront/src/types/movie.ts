export interface Movie {
  id: string
  title: string
  originalTitle?: string
  year?: number
  filePath: string
  posterUrl?: string
  backdropUrl?: string
  overview?: string
  genres: string[]
  rating?: number
  runtimeMinutes?: number
  tmdbId?: number
  createdAt: string
  updatedAt: string
}

export interface MovieListItem {
  id: string
  title: string
  year?: number
  posterUrl?: string
  rating?: number
  genres: string[]
}
