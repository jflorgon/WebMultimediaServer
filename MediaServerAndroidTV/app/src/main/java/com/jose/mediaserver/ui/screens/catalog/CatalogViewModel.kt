package com.jose.mediaserver.ui.screens.catalog

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jose.mediaserver.data.repository.DocumentariesRepository
import com.jose.mediaserver.data.repository.MoviesRepository
import com.jose.mediaserver.data.repository.SeriesRepository
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.MediaListItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CatalogState(
    val kind: MediaKind = MediaKind.Movie,
    val loading: Boolean = false,
    val loadingMore: Boolean = false,
    val items: List<MediaListItem> = emptyList(),
    val totalCount: Int = 0,
    val genres: List<String> = emptyList(),
    val selectedGenre: String? = null,
    val title: String = "",
    val page: Int = 1,
    val hasMore: Boolean = false,
    val error: String? = null,
)

@HiltViewModel
class CatalogViewModel @Inject constructor(
    private val movies: MoviesRepository,
    private val series: SeriesRepository,
    private val documentaries: DocumentariesRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(CatalogState())
    val state: StateFlow<CatalogState> = _state.asStateFlow()

    private val pageSize = 24
    private var currentJob: Job? = null

    fun init(kind: MediaKind) {
        if (_state.value.kind == kind && _state.value.items.isNotEmpty()) return
        _state.value = CatalogState(kind = kind)
        loadGenres()
        reload()
    }

    fun setGenre(genre: String?) {
        _state.value = _state.value.copy(selectedGenre = genre, page = 1, items = emptyList())
        reload()
    }

    fun setTitle(title: String) {
        _state.value = _state.value.copy(title = title, page = 1, items = emptyList())
        reload()
    }

    fun loadMore() {
        val s = _state.value
        if (s.loading || s.loadingMore || !s.hasMore) return
        currentJob?.cancel()
        currentJob = viewModelScope.launch {
            _state.value = s.copy(loadingMore = true)
            runCatching { fetchPage(s.page + 1) }
                .onSuccess { paged ->
                    _state.value = _state.value.copy(
                        items = _state.value.items + paged.items,
                        page = paged.page,
                        hasMore = paged.hasNextPage,
                        loadingMore = false,
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(loadingMore = false, error = it.message)
                }
        }
    }

    fun reload() {
        currentJob?.cancel()
        currentJob = viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)
            runCatching { fetchPage(1) }
                .onSuccess { paged ->
                    _state.value = _state.value.copy(
                        items = paged.items,
                        totalCount = paged.totalCount,
                        page = paged.page,
                        hasMore = paged.hasNextPage,
                        loading = false,
                    )
                }
                .onFailure {
                    _state.value = _state.value.copy(loading = false, error = it.message ?: "Error")
                }
        }
    }

    private fun loadGenres() {
        viewModelScope.launch {
            runCatching {
                when (_state.value.kind) {
                    MediaKind.Movie -> movies.genres()
                    MediaKind.Series -> series.genres()
                    MediaKind.Documentary -> documentaries.genres()
                    else -> emptyList()
                }
            }.onSuccess { gs -> _state.value = _state.value.copy(genres = gs) }
        }
    }

    private suspend fun fetchPage(page: Int) = when (_state.value.kind) {
        MediaKind.Movie -> movies.list(
            title = _state.value.title.takeIf { it.isNotBlank() },
            genre = _state.value.selectedGenre,
            page = page,
            pageSize = pageSize,
        )
        MediaKind.Series -> series.list(
            title = _state.value.title.takeIf { it.isNotBlank() },
            genre = _state.value.selectedGenre,
            page = page,
            pageSize = pageSize,
        )
        MediaKind.Documentary -> documentaries.list(
            title = _state.value.title.takeIf { it.isNotBlank() },
            genre = _state.value.selectedGenre,
            page = page,
            pageSize = pageSize,
        )
        else -> error("Kind no soportado en catálogo: ${_state.value.kind}")
    }
}
