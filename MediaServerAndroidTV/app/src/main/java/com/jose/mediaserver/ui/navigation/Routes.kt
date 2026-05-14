package com.jose.mediaserver.ui.navigation

import com.jose.mediaserver.domain.model.MediaKind

/**
 * Rutas tipadas de la app. Cada `route` es el string que NavController usa.
 * Patrón: `dominio/argumento1/argumento2`.
 */
object Routes {
    const val HOME = "home"
    const val MOVIES = "movies"
    const val SERIES = "series"
    const val DOCUMENTARIES = "documentaries"

    const val DETAIL_PATTERN = "detail/{kind}/{id}"
    const val DETAIL_ARG_KIND = "kind"
    const val DETAIL_ARG_ID = "id"
    fun detail(kind: MediaKind, id: String) = "detail/${kind.name}/$id"

    const val PLAYER_PATTERN = "player/{kind}/{id}/{title}"
    const val PLAYER_ARG_KIND = "kind"
    const val PLAYER_ARG_ID = "id"
    const val PLAYER_ARG_TITLE = "title"
    fun player(kind: MediaKind, id: String, title: String): String {
        val safe = android.net.Uri.encode(title)
        return "player/${kind.name}/$id/$safe"
    }
}
