package com.jose.mediaserver.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class EpisodeListItemDto(
    val id: String,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
    val filePath: String,
)

@Serializable
data class SeriesListItemDto(
    val id: String,
    val title: String,
    val year: Int? = null,
    val posterUrl: String? = null,
    val rating: Double? = null,
    val seasons: Int = 0,
    val genres: List<String> = emptyList(),
    val kind: String = "Series",
)

@Serializable
data class SeriesDto(
    val id: String,
    val title: String,
    val originalTitle: String? = null,
    val year: Int? = null,
    val filePath: String = "",
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    val overview: String? = null,
    val genres: List<String> = emptyList(),
    val rating: Double? = null,
    val ageRating: String? = null,
    val seasons: Int = 0,
    val episodes: Int = 0,
    val tmdbId: Int? = null,
    val kind: String = "Series",
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val episodeFiles: List<EpisodeListItemDto> = emptyList(),
)
