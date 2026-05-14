package com.jose.mediaserver

import com.jose.mediaserver.util.AgeRating
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AgeRatingTest {

    @Test fun null_returnsNull() = assertNull(AgeRating.resolve(null))
    @Test fun blank_returnsNull() = assertNull(AgeRating.resolve("   "))

    @Test
    fun all_ages_codes() {
        val codes = listOf("APTA", "TP", "A", "G", "U", "apta", "tp")
        codes.forEach {
            val r = AgeRating.resolve(it)!!
            assertEquals("Apta para todos los públicos", r.description)
        }
    }

    @Test
    fun numeric_codes() {
        assertEquals("+7", AgeRating.resolve("+7")!!.shortCode)
        assertEquals("+12", AgeRating.resolve("12")!!.shortCode)
        assertEquals("+16", AgeRating.resolve("+16")!!.shortCode)
        assertEquals("+18", AgeRating.resolve("18+")!!.shortCode)
    }

    @Test
    fun mpaa_codes() {
        assertEquals("PG", AgeRating.resolve("PG")!!.shortCode)
        assertEquals("+13", AgeRating.resolve("PG-13")!!.shortCode)
        assertEquals("R", AgeRating.resolve("R")!!.shortCode)
        assertEquals("+18", AgeRating.resolve("NC-17")!!.shortCode)
    }

    @Test
    fun unknown_returnsRawCode() {
        val r = AgeRating.resolve("XYZ")!!
        assertEquals("XYZ", r.shortCode)
    }
}
