package com.jose.mediaserver.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.jose.mediaserver.R
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.ui.components.ErrorState
import com.jose.mediaserver.ui.components.HeroCarousel
import com.jose.mediaserver.ui.components.LoadingSpinner
import com.jose.mediaserver.ui.components.MediaRow
import com.jose.mediaserver.ui.components.TopBar
import com.jose.mediaserver.ui.components.TopBarTab
import com.jose.mediaserver.ui.theme.NetflixBlack

@Composable
fun HomeScreen(
    onItemClick: (MediaListItem) -> Unit,
    onPlay: (MediaListItem) -> Unit,
    onNavigateTab: (MediaKind) -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsState()
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(NetflixBlack),
    ) {
        when (val s = state) {
            is HomeUiState.Loading -> LoadingSpinner(
                modifier = Modifier.align(Alignment.Center),
                label = stringResource(R.string.generic_loading),
            )

            is HomeUiState.Error -> ErrorState(
                modifier = Modifier.align(Alignment.Center),
                message = stringResource(R.string.error_network) + "\n${s.message}",
                retryLabel = stringResource(R.string.error_retry),
                onRetry = viewModel::load,
            )

            is HomeUiState.Ready -> Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                TopBar(
                    selected = TopBarTab.Home,
                    onSelect = { tab ->
                        when (tab) {
                            TopBarTab.Movies -> onNavigateTab(MediaKind.Movie)
                            TopBarTab.Series -> onNavigateTab(MediaKind.Series)
                            TopBarTab.Documentaries -> onNavigateTab(MediaKind.Documentary)
                            else -> Unit
                        }
                    },
                )
                HeroCarousel(
                    items = s.hero,
                    onPlay = onPlay,
                    onDetails = onItemClick,
                )
                if (s.recentMovies.isNotEmpty()) {
                    MediaRow(
                        title = stringResource(R.string.home_recent_movies),
                        items = s.recentMovies,
                        onItemClick = onItemClick,
                    )
                }
                if (s.recentSeries.isNotEmpty()) {
                    MediaRow(
                        title = stringResource(R.string.home_recent_series),
                        items = s.recentSeries,
                        onItemClick = onItemClick,
                    )
                }
                if (s.recentDocumentaries.isNotEmpty()) {
                    MediaRow(
                        title = stringResource(R.string.home_recent_documentaries),
                        items = s.recentDocumentaries,
                        onItemClick = onItemClick,
                    )
                }
                Box(modifier = Modifier.padding(bottom = 32.dp)) {}
            }
        }
    }
}
