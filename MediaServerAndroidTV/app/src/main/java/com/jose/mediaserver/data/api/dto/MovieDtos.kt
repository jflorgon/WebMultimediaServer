package com.jose.mediaserver.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class MovieListItemDto(
    val id: String,
    val title: String,
    val year: Int? = null,
    val posterUrl: String? = null,
    val rating: Double? = null,
    val genres: List<String> = emptyList(),
)

@Serializable
data class MovieDto(
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
    val runtimeMinutes: Int? = null,
    val tmdbId: Int? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
)
