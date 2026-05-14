package com.jose.mediaserver.data.repository

import com.jose.mediaserver.data.api.MediaApi
import com.jose.mediaserver.domain.mappers.toDomain
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.StreamingSource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class StreamingRepository @Inject constructor(
    private val api: MediaApi,
) {
    /**
     * Resuelve la fuente (direct vs HLS) y devuelve una URL ABSOLUTA construida con el host
     * base de la API (la respuesta del backend trae rutas relativas como `/api/streaming/...`).
     */
    suspend fun resolveSource(
        kind: MediaKind,
        id: String,
        apiBaseUrl: String,
    ): StreamingSource {
        val type = when (kind) {
            MediaKind.Movie -> "movies"
            MediaKind.Documentary -> "documentaries"
            MediaKind.Episode -> "episodes"
            MediaKind.Series -> error("Series no se reproduce directamente; usar un Episode")
        }
        val source = api.getStreamingSource(type, id).toDomain()
        return source.copy(url = resolveUrl(source.url, apiBaseUrl))
    }

    /**
     * Notifica al backend que la sesión HLS sigue viva para que no mate FFmpeg.
     * Cada 30s mientras se está reproduciendo en modo HLS.
     */
    suspend fun keepAlive(id: String) {
        api.keepAlive(id)
    }

    private fun resolveUrl(maybeRelative: String, apiBaseUrl: String): String {
        if (maybeRelative.startsWith("http://", true) || maybeRelative.startsWith("https://", true)) {
            return maybeRelative
        }
        // apiBaseUrl ej. http://192.168.1.90:5001/api  → host = http://192.168.1.90:5001
        val host = apiBaseUrl.removeSuffix("/").removeSuffix("/api")
        val path = if (maybeRelative.startsWith("/")) maybeRelative else "/$maybeRelative"
        return "$host$path"
    }
}
