package com.jose.mediaserver.util

import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale

/**
 * Réplica 1:1 de MediaServerFront/src/utils/formatters.ts adaptada a Kotlin.
 */
object Formatters {

    fun runtime(minutes: Int?): String {
        if (minutes == null || minutes <= 0) return "-"
        val h = minutes / 60
        val m = minutes % 60
        return if (h > 0) "${h}h ${m}min" else "${m}min"
    }

    fun rating(rating: Double?): String {
        if (rating == null) return "-"
        return String.format(Locale.US, "%.1f", rating)
    }

    private val displayDate: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

    fun date(isoDate: String?): String {
        if (isoDate.isNullOrBlank()) return "-"
        return try {
            OffsetDateTime.parse(isoDate).toLocalDate().format(displayDate)
        } catch (_: DateTimeParseException) {
            try {
                LocalDateTime.parse(isoDate).toLocalDate().format(displayDate)
            } catch (_: DateTimeParseException) {
                "-"
            }
        }
    }

    /** Etiqueta compacta de episodio "1x05". */
    fun episodeShort(season: Int, episode: Int): String =
        String.format(Locale.US, "%dx%02d", season, episode)

    /** Tiempo de reproductor: mm:ss o h:mm:ss */
    fun playerTime(seconds: Long): String {
        val s = seconds.coerceAtLeast(0)
        val h = s / 3600
        val m = (s % 3600) / 60
        val sec = s % 60
        return if (h > 0)
            String.format(Locale.US, "%d:%02d:%02d", h, m, sec)
        else
            String.format(Locale.US, "%d:%02d", m, sec)
    }
}
