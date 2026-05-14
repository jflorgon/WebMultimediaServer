package com.jose.mediaserver.ui.screens.player

import android.view.KeyEvent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Forward10
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Replay10
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.nativeKeyCode
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.jose.mediaserver.R
import com.jose.mediaserver.domain.model.StreamingSource
import com.jose.mediaserver.ui.components.ErrorState
import com.jose.mediaserver.ui.components.LoadingSpinner
import com.jose.mediaserver.ui.theme.NetflixBlack
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.TextMuted
import com.jose.mediaserver.util.Formatters
import kotlinx.coroutines.delay

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun PlayerScreen(
    onExit: () -> Unit,
    viewModel: PlayerViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
    ) {
        when (val s = state) {
            is PlayerUiState.Loading -> LoadingSpinner(
                modifier = Modifier.align(Alignment.Center),
                label = stringResource(R.string.player_loading),
            )

            is PlayerUiState.Error -> ErrorState(
                modifier = Modifier.align(Alignment.Center),
                message = stringResource(R.string.player_error) + "\n${s.message}",
                retryLabel = stringResource(R.string.error_retry),
                onRetry = viewModel::load,
            )

            is PlayerUiState.Ready -> {
                if (s.pendingResume != null && !s.resumeAccepted) {
                    ResumeDialog(
                        positionMs = s.pendingResume.positionMs,
                        onContinue = viewModel::acceptResume,
                        onRestart = viewModel::restartFromStart,
                    )
                } else {
                    Playback(
                        source = s.source,
                        title = s.title,
                        startPositionMs = if (s.pendingResume != null) s.pendingResume.positionMs else 0L,
                        onSaveProgress = viewModel::saveProgress,
                        startHeartbeat = viewModel::startHeartbeat,
                        stopHeartbeat = viewModel::stopHeartbeat,
                        onExit = {
                            viewModel.stopHeartbeat()
                            onExit()
                        },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@androidx.media3.common.util.UnstableApi
@Composable
private fun Playback(
    source: StreamingSource,
    title: String,
    startPositionMs: Long,
    onSaveProgress: (positionMs: Long, durationMs: Long) -> Unit,
    startHeartbeat: () -> Unit,
    stopHeartbeat: () -> Unit,
    onExit: () -> Unit,
) {
    val context = LocalContext.current
    val player = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
        }
    }

    var playing by remember { mutableStateOf(true) }
    var positionMs by remember { mutableLongStateOf(startPositionMs) }
    var durationMs by remember { mutableLongStateOf(0L) }
    var controlsVisible by remember { mutableStateOf(true) }
    var lastInteraction by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val focusRequester = remember { FocusRequester() }

    // Preparar la fuente
    LaunchedEffect(source.url) {
        val dataSourceFactory = DefaultHttpDataSource.Factory()
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15_000)
            .setReadTimeoutMs(30_000)

        val mediaItem = MediaItem.fromUri(source.url)
        val mediaSource = when (source.mode) {
            StreamingSource.Mode.Hls ->
                HlsMediaSource.Factory(dataSourceFactory).createMediaSource(mediaItem)
            StreamingSource.Mode.Direct ->
                ProgressiveMediaSource.Factory(dataSourceFactory).createMediaSource(mediaItem)
        }
        player.setMediaSource(mediaSource, startPositionMs)
        player.prepare()
        player.play()

        if (source.mode == StreamingSource.Mode.Hls) {
            startHeartbeat()
        }
    }

    // Listener de estado del player
    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                playing = isPlaying
            }
        }
        player.addListener(listener)
        onDispose {
            stopHeartbeat()
            onSaveProgress(player.currentPosition.coerceAtLeast(0L), player.duration.coerceAtLeast(0L))
            player.removeListener(listener)
            player.release()
        }
    }

    // Tick para actualizar progreso + ocultar controles
    LaunchedEffect(Unit) {
        while (true) {
            positionMs = player.currentPosition.coerceAtLeast(0L)
            durationMs = player.duration.coerceAtLeast(0L)
            if (System.currentTimeMillis() - lastInteraction > 4_000L && controlsVisible) {
                controlsVisible = false
            }
            delay(500L)
        }
    }

    // Solicitar foco para recibir teclas
    LaunchedEffect(Unit) { focusRequester.requestFocus() }

    fun bump() {
        controlsVisible = true
        lastInteraction = System.currentTimeMillis()
    }

    fun seekDelta(deltaMs: Long) {
        bump()
        val target = (player.currentPosition + deltaMs).coerceIn(0L, player.duration.coerceAtLeast(0L))
        player.seekTo(target)
    }

    fun togglePlay() {
        bump()
        if (player.isPlaying) player.pause() else player.play()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .focusRequester(focusRequester)
            .onKeyEvent { ev ->
                if (ev.type != KeyEventType.KeyDown) return@onKeyEvent false
                when (ev.nativeKeyEvent.keyCode) {
                    KeyEvent.KEYCODE_DPAD_LEFT -> { seekDelta(-10_000L); true }
                    KeyEvent.KEYCODE_DPAD_RIGHT -> { seekDelta(10_000L); true }
                    KeyEvent.KEYCODE_DPAD_UP -> { seekDelta(60_000L); true }
                    KeyEvent.KEYCODE_DPAD_DOWN -> { seekDelta(-60_000L); true }
                    KeyEvent.KEYCODE_DPAD_CENTER,
                    KeyEvent.KEYCODE_ENTER,
                    KeyEvent.KEYCODE_SPACE,
                    KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> { togglePlay(); true }
                    KeyEvent.KEYCODE_MEDIA_PLAY -> { player.play(); bump(); true }
                    KeyEvent.KEYCODE_MEDIA_PAUSE -> { player.pause(); bump(); true }
                    KeyEvent.KEYCODE_BACK,
                    KeyEvent.KEYCODE_ESCAPE -> {
                        onSaveProgress(player.currentPosition, player.duration.coerceAtLeast(0L))
                        onExit()
                        true
                    }
                    else -> false
                }
            },
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                PlayerView(ctx).apply {
                    useController = false
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                    this.player = player
                }
            },
        )

        if (controlsVisible) {
            Controls(
                title = title,
                playing = playing,
                positionMs = positionMs,
                durationMs = durationMs,
                onSeekDelta = ::seekDelta,
                onTogglePlay = ::togglePlay,
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun Controls(
    title: String,
    playing: Boolean,
    positionMs: Long,
    durationMs: Long,
    onSeekDelta: (Long) -> Unit,
    onTogglePlay: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color.Transparent, Color(0xCC000000)),
                    startY = 600f,
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(horizontal = 48.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = title,
                color = Color.White,
                style = MaterialTheme.typography.titleLarge,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )

            // Barra de progreso
            val fraction = if (durationMs > 0) (positionMs.toFloat() / durationMs).coerceIn(0f, 1f) else 0f
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .background(Color(0x66FFFFFF)),
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(fraction)
                        .height(6.dp)
                        .background(NetflixRed),
                )
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(
                    text = "${Formatters.playerTime(positionMs / 1000)} / ${Formatters.playerTime(durationMs / 1000)}",
                    color = Color.White,
                    style = MaterialTheme.typography.titleSmall,
                )
                Spacer(modifier = Modifier.width(16.dp))
                CtrlButton(label = "-60s", onClick = { onSeekDelta(-60_000L) })
                CtrlButton(label = "-10s", icon = Icons.Filled.Replay10, onClick = { onSeekDelta(-10_000L) })
                MainPlayButton(playing = playing, onClick = onTogglePlay)
                CtrlButton(label = "+10s", icon = Icons.Filled.Forward10, onClick = { onSeekDelta(10_000L) })
                CtrlButton(label = "+60s", onClick = { onSeekDelta(60_000L) })
            }

            Text(
                text = stringResource(R.string.player_hint),
                color = TextMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun CtrlButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.colors(containerColor = Color(0x99000000)),
    ) {
        if (icon != null) {
            Icon(imageVector = icon, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(4.dp))
        }
        Text(text = label, color = Color.White)
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun MainPlayButton(playing: Boolean, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.colors(containerColor = Color.White),
    ) {
        Icon(
            imageVector = if (playing) Icons.Filled.Pause else Icons.Filled.PlayArrow,
            contentDescription = null,
            tint = Color.Black,
            modifier = Modifier.size(28.dp),
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun ResumeDialog(
    positionMs: Long,
    onContinue: () -> Unit,
    onRestart: () -> Unit,
) {
    val seconds = positionMs / 1000
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC000000)),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = stringResource(R.string.player_resume_title),
                color = Color.White,
                style = MaterialTheme.typography.headlineMedium,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = onContinue,
                    colors = ButtonDefaults.colors(
                        containerColor = NetflixRed,
                        contentColor = Color.White,
                        focusedContainerColor = Color.White,
                        focusedContentColor = NetflixRed,
                    ),
                ) {
                    Text(
                        text = stringResource(R.string.player_resume_continue, Formatters.playerTime(seconds)),
                    )
                }
                Button(
                    onClick = onRestart,
                    colors = ButtonDefaults.colors(
                        containerColor = Color(0xCC2A2A2A),
                        contentColor = Color.White,
                        focusedContainerColor = Color.White,
                        focusedContentColor = NetflixBlack,
                    ),
                ) {
                    Text(text = stringResource(R.string.player_resume_restart))
                }
            }
        }
    }
}
