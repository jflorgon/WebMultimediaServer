package com.jose.mediaserver.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class PagedResultDto<T>(
    val items: List<T> = emptyList(),
    val totalCount: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20,
    val totalPages: Int = 0,
    val hasNextPage: Boolean = false,
    val hasPreviousPage: Boolean = false,
)
