package com.jose.mediaserver

import com.jose.mediaserver.util.Formatters
import org.junit.Assert.assertEquals
import org.junit.Test

class FormattersTest {

    @Test fun runtime_null_returnsDash() = assertEquals("-", Formatters.runtime(null))
    @Test fun runtime_zero_returnsDash() = assertEquals("-", Formatters.runtime(0))
    @Test fun runtime_under_hour() = assertEquals("45min", Formatters.runtime(45))
    @Test fun runtime_exact_hour() = assertEquals("1h 0min", Formatters.runtime(60))
    @Test fun runtime_mixed() = assertEquals("1h 30min", Formatters.runtime(90))
    @Test fun runtime_long() = assertEquals("2h 30min", Formatters.runtime(150))

    @Test fun rating_null_returnsDash() = assertEquals("-", Formatters.rating(null))
    @Test fun rating_basic() = assertEquals("7.5", Formatters.rating(7.5))
    @Test fun rating_integer() = assertEquals("8.0", Formatters.rating(8.0))
    @Test fun rating_rounds() = assertEquals("6.8", Formatters.rating(6.789))
    @Test fun rating_one_decimal() = assertEquals("6.7", Formatters.rating(6.74))

    @Test fun date_null_returnsDash() = assertEquals("-", Formatters.date(null))
    @Test fun date_blank_returnsDash() = assertEquals("-", Formatters.date(""))
    @Test fun date_iso_offset() = assertEquals("13/05/2024", Formatters.date("2024-05-13T10:00:00Z"))
    @Test fun date_iso_local() = assertEquals("01/01/2026", Formatters.date("2026-01-01T00:00:00"))
    @Test fun date_invalid_returnsDash() = assertEquals("-", Formatters.date("not-a-date"))

    @Test fun playerTime_seconds_only() = assertEquals("0:30", Formatters.playerTime(30))
    @Test fun playerTime_minutes() = assertEquals("1:30", Formatters.playerTime(90))
    @Test fun playerTime_hours() = assertEquals("1:01:05", Formatters.playerTime(3665))
    @Test fun playerTime_negative_clamps_to_zero() = assertEquals("0:00", Formatters.playerTime(-50))
}
