export interface EpisodeListItem {
  id: string
  seasonNumber: number
  episodeNumber: number
  title: string
  filePath: string
}

export interface Series {
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
  seasons: number
  episodes: number
  tmdbId?: number
  createdAt: string
  updatedAt: string
  episodeFiles: EpisodeListItem[]
}

export interface SeriesListItem {
  id: string
  title: string
  year?: number
  posterUrl?: string
  rating?: number
  seasons: number
  genres: string[]
}
