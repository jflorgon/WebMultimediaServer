package com.jose.mediaserver.domain.model

/**
 * Tipo de contenido de catálogo. Se usa para discriminar navegación y endpoint de streaming.
 */
enum class MediaKind { Movie, Series, Documentary, Episode }

/**
 * Resumen para listados/filas (poster, rating, géneros).
 */
data class MediaListItem(
    val id: String,
    val title: String,
    val year: Int?,
    val posterUrl: String?,
    val rating: Double?,
    val genres: List<String>,
    val kind: MediaKind,
    val seasons: Int? = null,           // solo Series
    val isDocSeries: Boolean = false,   // solo Documentary cuando es serie
    val backdropUrl: String? = null,    // se rellena en una segunda fase desde el detalle (sólo hero)
)

data class Episode(
    val id: String,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
)

data class MediaDetail(
    val id: String,
    val title: String,
    val originalTitle: String?,
    val year: Int?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val overview: String?,
    val genres: List<String>,
    val rating: Double?,
    val ageRating: String?,
    val runtimeMinutes: Int?,
    val kind: MediaKind,
    val seasons: Int? = null,
    val totalEpisodes: Int? = null,
    val episodes: List<Episode> = emptyList(),
)

data class StreamingSource(
    val mode: Mode,
    val url: String,
    val mime: String,
) {
    enum class Mode { Direct, Hls }
}

data class PagedItems<T>(
    val items: List<T>,
    val totalCount: Int,
    val page: Int,
    val pageSize: Int,
    val hasNextPage: Boolean,
)

data class ScannerStatus(
    val isRunning: Boolean,
    val lastRunAt: String?,
    val lastResult: String?,
    val itemsScanned: Int,
)
