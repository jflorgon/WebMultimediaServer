package com.jose.mediaserver.ui.screens.catalog

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.focusGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.tv.material3.Border
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.jose.mediaserver.R
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.ui.components.EmptyState
import com.jose.mediaserver.ui.components.ErrorState
import com.jose.mediaserver.ui.components.LoadingSpinner
import com.jose.mediaserver.ui.components.MediaCard
import com.jose.mediaserver.ui.components.TopBar
import com.jose.mediaserver.ui.components.TopBarTab
import com.jose.mediaserver.ui.theme.NetflixBlack
import com.jose.mediaserver.ui.theme.NetflixGray
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.TextMuted

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun CatalogScreen(
    kind: MediaKind,
    onItemClick: (MediaListItem) -> Unit,
    onBack: () -> Unit,
    onNavigateTab: (MediaKind) -> Unit = {},
    onNavigateHome: () -> Unit = {},
    viewModel: CatalogViewModel = hiltViewModel(),
) {
    LaunchedEffect(kind) { viewModel.init(kind) }

    val state by viewModel.state.collectAsState()
    val gridState = rememberLazyGridState()

    val reachedEnd by remember {
        derivedStateOf {
            val last = gridState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1
            val total = gridState.layoutInfo.totalItemsCount
            total > 0 && last >= total - 6
        }
    }

    LaunchedEffect(reachedEnd, state.hasMore, state.loadingMore) {
        if (reachedEnd && state.hasMore && !state.loadingMore && !state.loading) {
            viewModel.loadMore()
        }
    }

    val title = when (kind) {
        MediaKind.Movie -> stringResource(R.string.nav_movies)
        MediaKind.Series -> stringResource(R.string.nav_series)
        MediaKind.Documentary -> stringResource(R.string.nav_documentaries)
        else -> ""
    }
    val selectedTab = when (kind) {
        MediaKind.Movie -> TopBarTab.Movies
        MediaKind.Series -> TopBarTab.Series
        MediaKind.Documentary -> TopBarTab.Documentaries
        else -> TopBarTab.Home
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(NetflixBlack),
    ) {
        TopBar(
            selected = selectedTab,
            onSelect = { tab ->
                when (tab) {
                    TopBarTab.Home -> onNavigateHome()
                    TopBarTab.Movies -> if (kind != MediaKind.Movie) onNavigateTab(MediaKind.Movie)
                    TopBarTab.Series -> if (kind != MediaKind.Series) onNavigateTab(MediaKind.Series)
                    TopBarTab.Documentaries -> if (kind != MediaKind.Documentary) onNavigateTab(MediaKind.Documentary)
                    else -> Unit
                }
            },
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 48.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.displaySmall,
                color = MaterialTheme.colorScheme.onBackground,
            )
            if (state.totalCount > 0) {
                Text(
                    text = stringResource(R.string.generic_titles_count, state.totalCount),
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted,
                )
            }

            if (state.genres.isNotEmpty()) {
                // Chips ocupan el espacio sobrante a la derecha del título.
                // LazyRow → scroll horizontal con D-pad si no caben, sin desbordar la línea.
                LazyRow(
                    modifier = Modifier
                        .weight(1f)
                        .focusGroup(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 4.dp),
                ) {
                    item {
                        ChipButton(
                            label = stringResource(R.string.search_filters),
                            selected = state.selectedGenre == null,
                            onClick = { viewModel.setGenre(null) },
                        )
                    }
                    items(state.genres, key = { it }) { genre ->
                        ChipButton(
                            label = genre,
                            selected = state.selectedGenre == genre,
                            onClick = { viewModel.setGenre(genre) },
                        )
                    }
                }
            }
        }

        Box(modifier = Modifier.fillMaxSize()) {
            when {
                state.loading -> LoadingSpinner(
                    modifier = Modifier.align(Alignment.Center),
                    label = stringResource(R.string.generic_loading),
                )
                state.error != null -> ErrorState(
                    modifier = Modifier.align(Alignment.Center),
                    message = stringResource(R.string.error_network) + "\n${state.error}",
                    retryLabel = stringResource(R.string.error_retry),
                    onRetry = viewModel::reload,
                )
                state.items.isEmpty() -> EmptyState(
                    modifier = Modifier.align(Alignment.Center),
                    title = stringResource(R.string.search_no_results),
                )
                else -> LazyVerticalGrid(
                    columns = GridCells.Adaptive(minSize = 160.dp),
                    state = gridState,
                    modifier = Modifier
                        .fillMaxSize()
                        .focusGroup(),
                    contentPadding = PaddingValues(horizontal = 48.dp, vertical = 32.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(36.dp),
                ) {
                    gridItems(state.items, key = { it.id }) { item ->
                        MediaCard(
                            item = item,
                            onClick = { onItemClick(item) },
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun ChipButton(label: String, selected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(100)
    val containerColor = if (selected) NetflixRed else androidx.compose.ui.graphics.Color.Transparent
    val contentColor = if (selected) androidx.compose.ui.graphics.Color.White else TextMuted
    val borderColor = if (selected) NetflixRed else NetflixGray

    Surface(
        onClick = onClick,
        shape = ClickableSurfaceDefaults.shape(shape = shape),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = containerColor,
            contentColor = contentColor,
            focusedContainerColor = androidx.compose.ui.graphics.Color.White,
            focusedContentColor = NetflixBlack,
            pressedContainerColor = NetflixRed,
            pressedContentColor = androidx.compose.ui.graphics.Color.White,
        ),
        border = ClickableSurfaceDefaults.border(
            border = Border(
                border = BorderStroke(1.dp, borderColor),
                shape = shape,
            ),
            focusedBorder = Border(
                border = BorderStroke(1.dp, androidx.compose.ui.graphics.Color.White),
                shape = shape,
            ),
        ),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
        )
    }
}
