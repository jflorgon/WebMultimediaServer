package com.jose.mediaserver.ui.screens.player

import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.jose.mediaserver.data.local.entities.ResumeEntity
import com.jose.mediaserver.data.repository.ResumeRepository
import com.jose.mediaserver.data.repository.StreamingRepository
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.StreamingSource
import com.jose.mediaserver.ui.navigation.Routes
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Named

sealed interface PlayerUiState {
    data object Loading : PlayerUiState
    data class Error(val message: String) : PlayerUiState
    data class Ready(
        val source: StreamingSource,
        val title: String,
        val pendingResume: ResumeEntity?,
        val resumeAccepted: Boolean,
    ) : PlayerUiState
}

@HiltViewModel
class PlayerViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val streaming: StreamingRepository,
    private val resume: ResumeRepository,
    @Named("apiBaseUrl") private val apiBaseUrl: String,
) : ViewModel() {

    val kind: MediaKind = runCatching {
        MediaKind.valueOf(checkNotNull(savedState[Routes.PLAYER_ARG_KIND]))
    }.getOrDefault(MediaKind.Movie)
    val id: String = checkNotNull(savedState[Routes.PLAYER_ARG_ID])
    val title: String = Uri.decode(checkNotNull(savedState[Routes.PLAYER_ARG_TITLE]))

    private val _state = MutableStateFlow<PlayerUiState>(PlayerUiState.Loading)
    val state: StateFlow<PlayerUiState> = _state.asStateFlow()

    private var heartbeatJob: Job? = null

    init { load() }

    fun load() {
        _state.value = PlayerUiState.Loading
        viewModelScope.launch {
            runCatching {
                val source = streaming.resolveSource(kind, id, apiBaseUrl)
                val saved = resume.get(id)
                PlayerUiState.Ready(
                    source = source,
                    title = title,
                    pendingResume = saved?.takeIf { it.positionMs >= 30_000 },
                    resumeAccepted = false,
                )
            }.fold(
                onSuccess = { _state.value = it },
                onFailure = { _state.value = PlayerUiState.Error(it.message ?: "Error") },
            )
        }
    }

    fun acceptResume() {
        val s = _state.value as? PlayerUiState.Ready ?: return
        _state.value = s.copy(resumeAccepted = true)
    }

    fun restartFromStart() {
        val s = _state.value as? PlayerUiState.Ready ?: return
        viewModelScope.launch { resume.clear(id) }
        _state.value = s.copy(pendingResume = null, resumeAccepted = true)
    }

    /**
     * Inicia el heartbeat HLS (cada 30s). Solo se llama si el modo es HLS.
     * Réplica del [[hls_heartbeat_cancellation]] del frontend web.
     */
    fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = viewModelScope.launch {
            while (true) {
                runCatching { streaming.keepAlive(id) }
                delay(30_000L)
            }
        }
    }

    fun stopHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = null
    }

    fun saveProgress(positionMs: Long, durationMs: Long) {
        viewModelScope.launch {
            runCatching { resume.save(id, kind, positionMs, durationMs) }
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopHeartbeat()
    }
}
