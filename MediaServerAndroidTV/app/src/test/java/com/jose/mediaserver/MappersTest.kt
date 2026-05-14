package com.jose.mediaserver

import com.jose.mediaserver.data.api.dto.DocumentaryListItemDto
import com.jose.mediaserver.data.api.dto.EpisodeListItemDto
import com.jose.mediaserver.data.api.dto.MovieDto
import com.jose.mediaserver.data.api.dto.MovieListItemDto
import com.jose.mediaserver.data.api.dto.PagedResultDto
import com.jose.mediaserver.data.api.dto.SeriesDto
import com.jose.mediaserver.data.api.dto.StreamingSourceDto
import com.jose.mediaserver.domain.mappers.toDomain
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.StreamingSource
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class MappersTest {

    @Test
    fun movie_list_item_maps_correctly() {
        val dto = MovieListItemDto(
            id = "abc",
            title = "Inception",
            year = 2010,
            posterUrl = "https://example/p.jpg",
            rating = 8.7,
            genres = listOf("Sci-Fi", "Thriller"),
        )
        val m = dto.toDomain()
        assertEquals("abc", m.id)
        assertEquals(MediaKind.Movie, m.kind)
        assertEquals(2010, m.year)
        assertEquals(8.7, m.rating!!, 0.0001)
        assertEquals(listOf("Sci-Fi", "Thriller"), m.genres)
        assertNull(m.seasons)
    }

    @Test
    fun documentary_list_item_propagates_isSeries_flag() {
        val dto = DocumentaryListItemDto(
            id = "doc-1",
            title = "Cosmos",
            isSeries = true,
            genres = listOf("Science"),
        )
        val m = dto.toDomain()
        assertEquals(MediaKind.Documentary, m.kind)
        assertTrue(m.isDocSeries)
    }

    @Test
    fun movie_detail_maps_all_fields() {
        val dto = MovieDto(
            id = "mid",
            title = "The Matrix",
            originalTitle = "The Matrix",
            year = 1999,
            posterUrl = "https://p",
            backdropUrl = "https://b",
            overview = "Wake up, Neo.",
            genres = listOf("Action"),
            rating = 8.7,
            ageRating = "R",
            runtimeMinutes = 136,
        )
        val d = dto.toDomain()
        assertEquals(MediaKind.Movie, d.kind)
        assertEquals(136, d.runtimeMinutes)
        assertEquals("R", d.ageRating)
        assertNull(d.seasons)
    }

    @Test
    fun series_detail_includes_episodes() {
        val dto = SeriesDto(
            id = "s1",
            title = "Breaking Bad",
            seasons = 5,
            episodes = 62,
            episodeFiles = listOf(
                EpisodeListItemDto("e1", 1, 1, "Pilot", "/a.mkv"),
                EpisodeListItemDto("e2", 1, 2, "Cat's in the Bag…", "/b.mkv"),
            ),
        )
        val d = dto.toDomain()
        assertEquals(MediaKind.Series, d.kind)
        assertEquals(5, d.seasons)
        assertEquals(62, d.totalEpisodes)
        assertEquals(2, d.episodes.size)
        assertEquals(1, d.episodes[0].seasonNumber)
        assertEquals(2, d.episodes[1].episodeNumber)
    }

    @Test
    fun paged_result_maps_items() {
        val paged = PagedResultDto(
            items = listOf(
                MovieListItemDto(id = "a", title = "A"),
                MovieListItemDto(id = "b", title = "B"),
            ),
            totalCount = 50,
            page = 2,
            pageSize = 24,
            totalPages = 3,
            hasNextPage = true,
            hasPreviousPage = true,
        )
        val mapped = paged.toDomain { it.toDomain() }
        assertEquals(2, mapped.items.size)
        assertEquals(50, mapped.totalCount)
        assertTrue(mapped.hasNextPage)
    }

    @Test
    fun streaming_source_maps_modes() {
        val direct = StreamingSourceDto(mode = "direct", url = "/x", mime = "video/mp4").toDomain()
        assertEquals(StreamingSource.Mode.Direct, direct.mode)

        val hls = StreamingSourceDto(mode = "hls", url = "/y", mime = "application/vnd.apple.mpegurl").toDomain()
        assertEquals(StreamingSource.Mode.Hls, hls.mode)

        val unknown = StreamingSourceDto(mode = "weird", url = "/z", mime = "x").toDomain()
        assertEquals(StreamingSource.Mode.Hls, unknown.mode) // fallback HLS
    }
}
