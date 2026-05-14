package com.jose.mediaserver.ui.screens.detail

import androidx.compose.foundation.background
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.jose.mediaserver.R
import com.jose.mediaserver.domain.model.Episode
import com.jose.mediaserver.domain.model.MediaDetail
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.ui.components.AgeRatingBadge
import com.jose.mediaserver.ui.components.ErrorState
import com.jose.mediaserver.ui.components.GenreChip
import com.jose.mediaserver.ui.components.LoadingSpinner
import com.jose.mediaserver.ui.theme.NetflixBlack
import com.jose.mediaserver.ui.theme.NetflixDark
import com.jose.mediaserver.ui.theme.NetflixGray
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.RatingYellow
import com.jose.mediaserver.ui.theme.TextMuted
import com.jose.mediaserver.ui.theme.YearGreen
import com.jose.mediaserver.util.Formatters

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun DetailScreen(
    onPlay: (kind: MediaKind, id: String, title: String) -> Unit,
    onBack: () -> Unit,
    viewModel: DetailViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(NetflixBlack),
    ) {
        when (val s = state) {
            is DetailUiState.Loading -> LoadingSpinner(
                modifier = Modifier.align(Alignment.Center),
                label = stringResource(R.string.generic_loading),
            )

            is DetailUiState.Error -> ErrorState(
                modifier = Modifier.align(Alignment.Center),
                message = stringResource(R.string.error_network) + "\n${s.message}",
                retryLabel = stringResource(R.string.error_retry),
                onRetry = viewModel::load,
            )

            is DetailUiState.Ready -> Content(
                detail = s.detail,
                onPlayMovie = { onPlay(s.detail.kind, s.detail.id, s.detail.title) },
                onPlayEpisode = { ep ->
                    onPlay(MediaKind.Episode, ep.id,
                        "${s.detail.title} · ${Formatters.episodeShort(ep.seasonNumber, ep.episodeNumber)}")
                },
                onBack = onBack,
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun Content(
    detail: MediaDetail,
    onPlayMovie: () -> Unit,
    onPlayEpisode: (Episode) -> Unit,
    onBack: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
    ) {
        // Hero: backdrop + gradiente + título + acciones
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(440.dp),
        ) {
            if (!detail.backdropUrl.isNullOrBlank()) {
                AsyncImage(
                    model = detail.backdropUrl,
                    contentDescription = detail.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, NetflixBlack),
                            startY = 220f,
                        ),
                    ),
            )

            Surface(
                onClick = onBack,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(24.dp),
                colors = ClickableSurfaceDefaults.colors(
                    containerColor = Color(0x88000000),
                    focusedContainerColor = NetflixRed,
                ),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = null, tint = Color.White)
                    Text(text = stringResource(R.string.detail_back), color = Color.White)
                }
            }

            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(start = 48.dp, end = 48.dp, bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(
                    text = detail.title,
                    color = Color.White,
                    style = MaterialTheme.typography.displayMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )

                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (detail.year != null) {
                        Text(
                            text = detail.year.toString(),
                            color = YearGreen,
                            style = MaterialTheme.typography.titleMedium,
                        )
                    }
                    if (detail.rating != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                        ) {
                            Icon(
                                Icons.Filled.Star,
                                contentDescription = null,
                                tint = RatingYellow,
                                modifier = Modifier.size(18.dp),
                            )
                            Text(
                                text = Formatters.rating(detail.rating),
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium,
                            )
                        }
                    }
                    if (detail.runtimeMinutes != null) {
                        Text(
                            text = Formatters.runtime(detail.runtimeMinutes),
                            color = TextMuted,
                            style = MaterialTheme.typography.titleMedium,
                        )
                    }
                    if (detail.kind == MediaKind.Series && detail.seasons != null) {
                        Text(
                            text = "${detail.seasons} ${stringResource(R.string.detail_seasons).lowercase()}",
                            color = TextMuted,
                            style = MaterialTheme.typography.titleMedium,
                        )
                    }
                    AgeRatingBadge(code = detail.ageRating)
                }

                if (detail.kind != MediaKind.Series) {
                    Button(
                        onClick = onPlayMovie,
                        colors = ButtonDefaults.colors(
                            containerColor = NetflixRed,
                            contentColor = Color.White,
                            focusedContainerColor = Color.White,
                            focusedContentColor = NetflixRed,
                        ),
                    ) {
                        Icon(Icons.Filled.PlayArrow, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = stringResource(R.string.detail_play))
                    }
                }
            }
        }

        // Sinopsis + géneros
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 48.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (!detail.overview.isNullOrBlank()) {
                Text(
                    text = detail.overview,
                    color = MaterialTheme.colorScheme.onBackground,
                    style = MaterialTheme.typography.bodyLarge,
                    maxLines = 6,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            if (detail.genres.isNotEmpty()) {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(detail.genres, key = { it }) { GenreChip(label = it) }
                }
            }
        }

        if (detail.kind == MediaKind.Series && detail.episodes.isNotEmpty()) {
            SeasonsSection(
                episodes = detail.episodes,
                onPlayEpisode = onPlayEpisode,
            )
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun SeasonsSection(
    episodes: List<Episode>,
    onPlayEpisode: (Episode) -> Unit,
) {
    val seasons = remember(episodes) {
        episodes.map { it.seasonNumber }.distinct().sorted()
    }
    var selectedSeasonIndex by rememberSaveable(seasons.size) { mutableIntStateOf(0) }
    val selectedSeason = seasons.getOrNull(selectedSeasonIndex) ?: 1
    val episodesOfSeason = episodes
        .filter { it.seasonNumber == selectedSeason }
        .sortedBy { it.episodeNumber }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 48.dp, vertical = 12.dp)
            .focusGroup(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        // Tabs de temporadas
        LazyRow(
            contentPadding = PaddingValues(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(seasons.size) { i ->
                val season = seasons[i]
                val isSelected = i == selectedSeasonIndex
                Surface(
                    onClick = { selectedSeasonIndex = i },
                    colors = ClickableSurfaceDefaults.colors(
                        containerColor = if (isSelected) NetflixRed else NetflixDark,
                        focusedContainerColor = NetflixRed,
                    ),
                ) {
                    Text(
                        text = stringResource(R.string.detail_season_short, season),
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.titleSmall,
                    )
                }
            }
        }

        // Lista de episodios
        episodesOfSeason.forEach { ep ->
            EpisodeRow(episode = ep, onPlay = { onPlayEpisode(ep) })
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun EpisodeRow(episode: Episode, onPlay: () -> Unit) {
    Surface(
        onClick = onPlay,
        modifier = Modifier.fillMaxWidth(),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = Color.Transparent,
            focusedContainerColor = NetflixGray,
        ),
        shape = ClickableSurfaceDefaults.shape(shape = RoundedCornerShape(6.dp)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = "%02d".format(episode.episodeNumber),
                color = TextMuted,
                style = MaterialTheme.typography.displaySmall,
                modifier = Modifier.width(60.dp),
            )
            Text(
                text = episode.title.ifBlank {
                    Formatters.episodeShort(episode.seasonNumber, episode.episodeNumber)
                },
                color = Color.White,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Icon(
                imageVector = Icons.Filled.PlayArrow,
                contentDescription = null,
                tint = NetflixRed,
            )
        }
    }
}
