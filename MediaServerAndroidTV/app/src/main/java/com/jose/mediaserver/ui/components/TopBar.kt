package com.jose.mediaserver.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Border
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import com.jose.mediaserver.ui.theme.NetflixBlack
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.TextMuted

enum class TopBarTab { Home, Movies, Series, Documentaries, Search }

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun TopBar(
    selected: TopBarTab,
    onSelect: (TopBarTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(Color(0xCC000000))
            .height(64.dp)
            .padding(horizontal = 48.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = "MEDIASERVER",
            color = NetflixRed,
            style = MaterialTheme.typography.titleLarge.copy(
                fontWeight = FontWeight.ExtraBold,
                fontStyle = FontStyle.Italic,
            ),
            modifier = Modifier.padding(end = 12.dp),
        )
        TabChip("Inicio", selected == TopBarTab.Home) { onSelect(TopBarTab.Home) }
        TabChip("Películas", selected == TopBarTab.Movies) { onSelect(TopBarTab.Movies) }
        TabChip("Series", selected == TopBarTab.Series) { onSelect(TopBarTab.Series) }
        TabChip("Documentales", selected == TopBarTab.Documentaries) { onSelect(TopBarTab.Documentaries) }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
        ) {
            TabChip("Buscar", selected == TopBarTab.Search) { onSelect(TopBarTab.Search) }
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun TabChip(label: String, selected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(100)
    val containerColor = if (selected) NetflixRed else Color.Transparent
    val contentColor = if (selected) Color.White else TextMuted
    val borderColor = if (selected) NetflixRed else Color(0x55FFFFFF)

    Surface(
        onClick = onClick,
        shape = ClickableSurfaceDefaults.shape(shape = shape),
        colors = ClickableSurfaceDefaults.colors(
            containerColor = containerColor,
            contentColor = contentColor,
            focusedContainerColor = Color.White,
            focusedContentColor = NetflixBlack,
            pressedContainerColor = NetflixRed,
            pressedContentColor = Color.White,
        ),
        border = ClickableSurfaceDefaults.border(
            border = Border(
                border = BorderStroke(1.dp, borderColor),
                shape = shape,
            ),
            focusedBorder = Border(
                border = BorderStroke(1.dp, Color.White),
                shape = shape,
            ),
        ),
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
        )
    }
}
