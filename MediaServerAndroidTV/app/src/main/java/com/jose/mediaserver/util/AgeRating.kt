package com.jose.mediaserver.util

/**
 * Tabla de mapeo réplica de MediaServerFront/src/components/ui/AgeRatingBadge.tsx
 * Devuelve la etiqueta y un código corto para mostrar en un chip.
 */
object AgeRating {

    data class Display(
        val shortCode: String,
        val description: String,
    )

    fun resolve(code: String?): Display? {
        if (code.isNullOrBlank()) return null
        val raw = code.trim()
        val upper = raw.uppercase()

        // Apta para todos los públicos
        if (upper in setOf("APTA", "TP", "A", "G", "U")) {
            return Display(upper, "Apta para todos los públicos")
        }

        // Patrones numéricos: 7, 12, 16, 18 con o sin "+"
        val numeric = Regex("""^\+?(\d{1,2})\+?$""").matchEntire(upper)
        if (numeric != null) {
            val n = numeric.groupValues[1]
            return Display("+$n", "+$n")
        }

        return when (upper) {
            "PG" -> Display("PG", "Se sugiere supervisión paterna")
            "PG-13", "PG13" -> Display("+13", "Mayores de 13 acompañados")
            "R" -> Display("R", "Restringida (menores acompañados)")
            "NC-17", "NC17" -> Display("+18", "Solo adultos")
            else -> Display(raw, raw)
        }
    }
}
