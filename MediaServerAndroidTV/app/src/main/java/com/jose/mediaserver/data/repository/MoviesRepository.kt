package com.jose.mediaserver.data.repository

import com.jose.mediaserver.data.api.MediaApi
import com.jose.mediaserver.domain.mappers.toDomain
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.domain.model.PagedItems
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MoviesRepository @Inject constructor(
    private val api: MediaApi,
) {
    suspend fun list(
        title: String? = null,
        genre: String? = null,
        page: Int = 1,
        pageSize: Int = 24,
    ): PagedItems<MediaListItem> =
        api.getMovies(title = title, genre = genre, page = page, pageSize = pageSize)
            .toDomain { it.toDomain() }

    suspend fun details(id: String): MediaDetail = api.getMovie(id).toDomain()

    suspend fun genres(): List<String> = api.getMovieGenres()

    suspend fun hero(count: Int = 4): List<MediaListItem> =
        api.getMovieHero(count = count).map { it.toDomain() }
}
