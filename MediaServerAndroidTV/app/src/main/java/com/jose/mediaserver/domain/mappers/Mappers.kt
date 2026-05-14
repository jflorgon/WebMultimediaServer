package com.jose.mediaserver.domain.mappers

import com.jose.mediaserver.data.api.dto.DocumentaryDto
import com.jose.mediaserver.data.api.dto.DocumentaryListItemDto
import com.jose.mediaserver.data.api.dto.EpisodeListItemDto
import com.jose.mediaserver.data.api.dto.MovieDto
import com.jose.mediaserver.data.api.dto.MovieListItemDto
import com.jose.mediaserver.data.api.dto.PagedResultDto
import com.jose.mediaserver.data.api.dto.SeriesDto
import com.jose.mediaserver.data.api.dto.SeriesListItemDto
import com.jose.mediaserver.data.api.dto.StreamingSourceDto
import com.jose.mediaserver.domain.model.Episode
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.domain.model.PagedItems
import com.jose.mediaserver.domain.model.StreamingSource

// ---- List items ----

fun MovieListItemDto.toDomain(): MediaListItem = MediaListItem(
    id = id,
    title = title,
    year = year,
    posterUrl = posterUrl,
    rating = rating,
    genres = genres,
    kind = MediaKind.Movie,
)

fun SeriesListItemDto.toDomain(): MediaListItem = MediaListItem(
    id = id,
    title = title,
    year = year,
    posterUrl = posterUrl,
    rating = rating,
    genres = genres,
    kind = MediaKind.Series,
    seasons = seasons,
)

fun DocumentaryListItemDto.toDomain(): MediaListItem = MediaListItem(
    id = id,
    title = title,
    year = year,
    posterUrl = posterUrl,
    rating = rating,
    genres = genres,
    kind = MediaKind.Documentary,
    isDocSeries = isSeries,
)

// ---- Details ----

fun MovieDto.toDomain(): MediaDetail = MediaDetail(
    id = id,
    title = title,
    originalTitle = originalTitle,
    year = year,
    posterUrl = posterUrl,
    backdropUrl = backdropUrl,
    overview = overview,
    genres = genres,
    rating = rating,
    ageRating = ageRating,
    runtimeMinutes = runtimeMinutes,
    kind = MediaKind.Movie,
)

fun DocumentaryDto.toDomain(): MediaDetail = MediaDetail(
    id = id,
    title = title,
    originalTitle = originalTitle,
    year = year,
    posterUrl = posterUrl,
    backdropUrl = backdropUrl,
    overview = overview,
    genres = genres,
    rating = rating,
    ageRating = ageRating,
    runtimeMinutes = runtimeMinutes,
    kind = MediaKind.Documentary,
)

fun SeriesDto.toDomain(): MediaDetail = MediaDetail(
    id = id,
    title = title,
    originalTitle = originalTitle,
    year = year,
    posterUrl = posterUrl,
    backdropUrl = backdropUrl,
    overview = overview,
    genres = genres,
    rating = rating,
    ageRating = ageRating,
    runtimeMinutes = null,
    kind = MediaKind.Series,
    seasons = seasons,
    totalEpisodes = episodes,
    episodes = episodeFiles.map { it.toDomain() },
)

fun EpisodeListItemDto.toDomain(): Episode = Episode(
    id = id,
    seasonNumber = seasonNumber,
    episodeNumber = episodeNumber,
    title = title,
)

// ---- Paged ----

fun <D, M> PagedResultDto<D>.toDomain(mapItem: (D) -> M): PagedItems<M> = PagedItems(
    items = items.map(mapItem),
    totalCount = totalCount,
    page = page,
    pageSize = pageSize,
    hasNextPage = hasNextPage,
)

// ---- Streaming ----

fun StreamingSourceDto.toDomain(): StreamingSource = StreamingSource(
    mode = when (mode.lowercase()) {
        "direct" -> StreamingSource.Mode.Direct
        else -> StreamingSource.Mode.Hls
    },
    url = url,
    mime = mime,
)
