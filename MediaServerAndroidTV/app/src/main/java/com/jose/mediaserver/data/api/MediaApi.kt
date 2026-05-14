package com.jose.mediaserver.data.api

import com.jose.mediaserver.data.api.dto.DocumentaryDto
import com.jose.mediaserver.data.api.dto.DocumentaryListItemDto
import com.jose.mediaserver.data.api.dto.MovieDto
import com.jose.mediaserver.data.api.dto.MovieListItemDto
import com.jose.mediaserver.data.api.dto.PagedResultDto
import com.jose.mediaserver.data.api.dto.SeriesDto
import com.jose.mediaserver.data.api.dto.SeriesListItemDto
import com.jose.mediaserver.data.api.dto.StreamingSourceDto
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface MediaApi {

    // ---- Movies ----
    @GET("movies")
    suspend fun getMovies(
        @Query("title") title: String? = null,
        @Query("genre") genre: String? = null,
        @Query("year") year: Int? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
    ): PagedResultDto<MovieListItemDto>

    @GET("movies/{id}")
    suspend fun getMovie(@Path("id") id: String): MovieDto

    @GET("movies/genres")
    suspend fun getMovieGenres(): List<String>

    @GET("movies/hero")
    suspend fun getMovieHero(
        @Query("count") count: Int = 4,
        @Query("minRating") minRating: Double = 6.0,
    ): List<MovieListItemDto>

    // ---- Series ----
    @GET("series")
    suspend fun getSeries(
        @Query("title") title: String? = null,
        @Query("genre") genre: String? = null,
        @Query("year") year: Int? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
    ): PagedResultDto<SeriesListItemDto>

    @GET("series/{id}")
    suspend fun getSeriesById(@Path("id") id: String): SeriesDto

    @GET("series/genres")
    suspend fun getSeriesGenres(): List<String>

    @GET("series/hero")
    suspend fun getSeriesHero(
        @Query("count") count: Int = 3,
        @Query("minRating") minRating: Double = 6.0,
    ): List<SeriesListItemDto>

    // ---- Documentaries ----
    @GET("documentaries")
    suspend fun getDocumentaries(
        @Query("title") title: String? = null,
        @Query("genre") genre: String? = null,
        @Query("year") year: Int? = null,
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20,
    ): PagedResultDto<DocumentaryListItemDto>

    @GET("documentaries/{id}")
    suspend fun getDocumentary(@Path("id") id: String): DocumentaryDto

    @GET("documentaries/genres")
    suspend fun getDocumentaryGenres(): List<String>

    @GET("documentaries/hero")
    suspend fun getDocumentaryHero(
        @Query("count") count: Int = 2,
        @Query("minRating") minRating: Double = 6.0,
    ): List<DocumentaryListItemDto>

    // ---- Streaming ----
    @GET("streaming/{type}/{id}/source")
    suspend fun getStreamingSource(
        @Path("type") type: String,   // "movies" | "episodes" | "documentaries"
        @Path("id") id: String,
    ): StreamingSourceDto

    @POST("streaming/keep-alive/{id}")
    suspend fun keepAlive(@Path("id") id: String)
}
