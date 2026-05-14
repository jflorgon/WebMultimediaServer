package com.jose.mediaserver.data.repository

import com.jose.mediaserver.data.api.MediaApi
import com.jose.mediaserver.domain.mappers.toDomain
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.domain.model.PagedItems
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SeriesRepository @Inject constructor(
    private val api: MediaApi,
) {
    suspend fun list(
        title: String? = null,
        genre: String? = null,
        page: Int = 1,
        pageSize: Int = 24,
    ): PagedItems<MediaListItem> =
        api.getSeries(title = title, genre = genre, page = page, pageSize = pageSize)
            .toDomain { it.toDomain() }

    suspend fun details(id: String): MediaDetail = api.getSeriesById(id).toDomain()

    suspend fun genres(): List<String> = api.getSeriesGenres()

    suspend fun hero(count: Int = 3): List<MediaListItem> =
        api.getSeriesHero(count = count).map { it.toDomain() }
}
