package com.jose.mediaserver.data.api.dto

import kotlinx.serialization.Serializable

@Serializable
data class StreamingSourceDto(
    val mode: String,   // "direct" | "hls"
    val url: String,    // relativa al host (ej. /api/streaming/movies/{id}/direct)
    val mime: String,
)
