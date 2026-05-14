package com.jose.mediaserver.data.repository

import com.jose.mediaserver.data.api.MediaApi
import com.jose.mediaserver.domain.mappers.toDomain
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.domain.model.PagedItems
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DocumentariesRepository @Inject constructor(
    private val api: MediaApi,
) {
    suspend fun list(
        title: String? = null,
        genre: String? = null,
        page: Int = 1,
        pageSize: Int = 24,
    ): PagedItems<MediaListItem> =
        api.getDocumentaries(title = title, genre = genre, page = page, pageSize = pageSize)
            .toDomain { it.toDomain() }

    suspend fun details(id: String): MediaDetail = api.getDocumentary(id).toDomain()

    suspend fun genres(): List<String> = api.getDocumentaryGenres()

    suspend fun hero(count: Int = 2): List<MediaListItem> =
        api.getDocumentaryHero(count = count).map { it.toDomain() }
}
