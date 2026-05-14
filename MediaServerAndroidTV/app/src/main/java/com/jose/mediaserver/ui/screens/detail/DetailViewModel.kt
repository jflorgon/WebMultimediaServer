package com.jose.mediaserver.ui.screens.detail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jose.mediaserver.data.repository.DocumentariesRepository
import com.jose.mediaserver.data.repository.MoviesRepository
import com.jose.mediaserver.data.repository.SeriesRepository
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface DetailUiState {
    data object Loading : DetailUiState
    data class Error(val message: String) : DetailUiState
    data class Ready(val detail: MediaDetail) : DetailUiState
}

@HiltViewModel
class DetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val movies: MoviesRepository,
    private val series: SeriesRepository,
    private val documentaries: DocumentariesRepository,
) : ViewModel() {

    private val kindArg: String =
        checkNotNull(savedState[Routes.DETAIL_ARG_KIND]) { "Falta arg ${Routes.DETAIL_ARG_KIND}" }
    private val idArg: String =
        checkNotNull(savedState[Routes.DETAIL_ARG_ID]) { "Falta arg ${Routes.DETAIL_ARG_ID}" }

    val kind: MediaKind = runCatching { MediaKind.valueOf(kindArg) }.getOrDefault(MediaKind.Movie)
    val id: String = idArg

    private val _state = MutableStateFlow<DetailUiState>(DetailUiState.Loading)
    val state: StateFlow<DetailUiState> = _state.asStateFlow()

    init { load() }

    fun load() {
        _state.value = DetailUiState.Loading
        viewModelScope.launch {
            runCatching {
                when (kind) {
                    MediaKind.Movie -> movies.details(id)
                    MediaKind.Series -> series.details(id)
                    MediaKind.Documentary -> documentaries.details(id)
                    else -> error("Kind no soportado: $kind")
                }
            }.fold(
                onSuccess = { _state.value = DetailUiState.Ready(it) },
                onFailure = { _state.value = DetailUiState.Error(it.message ?: "Error") },
            )
        }
    }
}
