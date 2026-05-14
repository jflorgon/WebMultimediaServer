package com.jose.mediaserver.ui.components

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.tv.material3.Button
import androidx.tv.material3.ButtonDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.ui.theme.NetflixBlack
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.TextMuted
import kotlinx.coroutines.delay

private const val ROTATION_MILLIS = 20_000L

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun HeroCarousel(
    items: List<MediaListItem>,
    onPlay: (MediaListItem) -> Unit,
    onDetails: (MediaListItem) -> Unit,
    modifier: Modifier = Modifier,
) {
    if (items.isEmpty()) return

    var index by remember { mutableIntStateOf(0) }
    LaunchedEffect(items) {
        while (true) {
            delay(ROTATION_MILLIS)
            index = (index + 1) % items.size
        }
    }

    val current = items[index]

    val heroImage = current.backdropUrl ?: current.posterUrl

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(360.dp),
    ) {
        if (!heroImage.isNullOrBlank()) {
            AsyncImage(
                model = heroImage,
                contentDescription = current.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }
        // Gradiente que oscurece la parte inferior y la izquierda
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(Color.Transparent, NetflixBlack),
                        startY = 200f,
                    ),
                ),
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(NetflixBlack.copy(alpha = 0.85f), Color.Transparent),
                        endX = 800f,
                    ),
                ),
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(start = 48.dp, bottom = 32.dp, end = 48.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = current.title,
                color = Color.White,
                style = MaterialTheme.typography.displaySmall,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                if (current.year != null) {
                    Text(
                        text = current.year.toString(),
                        color = TextMuted,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
                if (current.genres.isNotEmpty()) {
                    Text(
                        text = current.genres.take(3).joinToString(" · "),
                        color = TextMuted,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                // Por defecto en TV Material3 el focusedContainerColor es blanco; si no se
                // sobrescribe, el botón se queda en blanco al enfocar y el contenido también
                // (icono/texto blancos) → invisible. Forzamos colores en foco.
                Button(
                    onClick = { onPlay(current) },
                    colors = ButtonDefaults.colors(
                        containerColor = NetflixRed,
                        contentColor = Color.White,
                        focusedContainerColor = Color.White,
                        focusedContentColor = NetflixRed,
                    ),
                ) {
                    Icon(
                        imageVector = Icons.Filled.PlayArrow,
                        contentDescription = null,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Reproducir")
                }
                Button(
                    onClick = { onDetails(current) },
                    colors = ButtonDefaults.colors(
                        containerColor = Color(0xCC2A2A2A),
                        contentColor = Color.White,
                        focusedContainerColor = Color.White,
                        focusedContentColor = NetflixBlack,
                    ),
                ) {
                    Text(text = "Más info")
                }
            }
        }

        // Dots
        Row(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 48.dp, bottom = 32.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            items.forEachIndexed { i, _ ->
                Box(
                    modifier = Modifier
                        .size(width = if (i == index) 20.dp else 8.dp, height = 4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(if (i == index) Color.White else Color(0x66FFFFFF)),
                )
            }
        }
    }
}
