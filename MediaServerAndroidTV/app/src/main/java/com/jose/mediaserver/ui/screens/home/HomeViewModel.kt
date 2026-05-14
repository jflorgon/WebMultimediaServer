package com.jose.mediaserver.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jose.mediaserver.data.repository.DocumentariesRepository
import com.jose.mediaserver.data.repository.MoviesRepository
import com.jose.mediaserver.data.repository.SeriesRepository
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.MediaListItem
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface HomeUiState {
    data object Loading : HomeUiState
    data class Error(val message: String) : HomeUiState
    data class Ready(
        val hero: List<MediaListItem>,
        val recentMovies: List<MediaListItem>,
        val recentSeries: List<MediaListItem>,
        val recentDocumentaries: List<MediaListItem>,
    ) : HomeUiState
}

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val movies: MoviesRepository,
    private val series: SeriesRepository,
    private val documentaries: DocumentariesRepository,
) : ViewModel() {

    private val _state = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = HomeUiState.Loading
        viewModelScope.launch {
            runCatching {
                coroutineScope {
                    val heroM = async { movies.hero(4) }
                    val heroS = async { series.hero(3) }
                    val heroD = async { documentaries.hero(2) }
                    val recM = async { movies.list(pageSize = 24).items }
                    val recS = async { series.list(pageSize = 24).items }
                    val recD = async { documentaries.list(pageSize = 24).items }

                    HomeUiState.Ready(
                        hero = heroM.await() + heroS.await() + heroD.await(),
                        recentMovies = recM.await(),
                        recentSeries = recS.await(),
                        recentDocumentaries = recD.await(),
                    )
                }
            }.fold(
                onSuccess = {
                    _state.value = it
                    enrichHeroWithBackdrops(it.hero)
                },
                onFailure = { _state.value = HomeUiState.Error(it.message ?: "Error desconocido") },
            )
        }
    }

    // Fase 2: enriquecer el carrusel con el backdrop (horizontal) desde el detalle.
    // El endpoint /hero sólo devuelve el poster (vertical), que en el hero se ve recortado.
    private fun enrichHeroWithBackdrops(items: List<MediaListItem>) {
        if (items.isEmpty()) return
        viewModelScope.launch {
            val enriched = coroutineScope {
                items.map { item ->
                    async {
                        runCatching {
                            when (item.kind) {
                                MediaKind.Movie -> movies.details(item.id).backdropUrl
                                MediaKind.Series -> series.details(item.id).backdropUrl
                                MediaKind.Documentary -> documentaries.details(item.id).backdropUrl
                                MediaKind.Episode -> null
                            }
                        }.getOrNull()?.let { item.copy(backdropUrl = it) } ?: item
                    }
                }.awaitAll()
            }
            val current = _state.value
            if (current is HomeUiState.Ready && current.hero.map { it.id } == items.map { it.id }) {
                _state.value = current.copy(hero = enriched)
            }
        }
    }
}
