package com.jose.mediaserver.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Surface
import androidx.tv.material3.SurfaceDefaults
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.jose.mediaserver.domain.model.MediaListItem
import com.jose.mediaserver.ui.theme.NetflixGray
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.RatingYellow
import com.jose.mediaserver.ui.theme.TextMuted
import com.jose.mediaserver.ui.theme.YearGreen
import com.jose.mediaserver.util.Formatters

/**
 * Card de catálogo — réplica de MediaServerFront/src/components/ui/MediaCard.tsx.
 * Foco D-pad: escala 1.12× + halo rojo, overlay inferior con metadatos.
 */
@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun MediaCard(
    item: MediaListItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    cardWidth: androidx.compose.ui.unit.Dp = 150.dp,
) {
    var focused by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (focused) 1.12f else 1f,
        label = "cardScale",
    )
    // Compensación vertical: el poster (aspect 2:3, height = cardWidth × 1.5) se escala
    // desde transformOrigin (0.5, 0), por lo que se desborda hacia abajo (scale-1)×height.
    // Además, el Modifier.shadow(elevation = 18.dp, clip = false) proyecta un halo rojo
    // otros ~20dp por debajo del borde escalado. Sumamos ambos para que el título quede
    // limpio bajo el card y no se vele con el glow.
    val focusProgress = ((scale - 1f) / 0.12f).coerceIn(0f, 1f)
    val posterOverflowDp = cardWidth * 1.5f * (scale - 1f) + 20.dp * focusProgress

    Column(
        modifier = modifier
            .width(cardWidth)
            // El halo rojo (shadow con clip=false) y el poster escalado se desbordan a la
            // derecha; sin zIndex el siguiente item del LazyRow los recorta.
            .zIndex(if (focused) 1f else 0f),
    ) {
        Surface(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(2f / 3f)
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    transformOrigin = TransformOrigin(0.5f, 0f)
                }
                .onFocusChanged { focused = it.isFocused }
                .then(
                    if (focused)
                        Modifier.shadow(
                            elevation = 18.dp,
                            shape = RoundedCornerShape(6.dp),
                            clip = false,
                            ambientColor = NetflixRed,
                            spotColor = NetflixRed,
                        )
                    else Modifier,
                ),
            shape = ClickableSurfaceDefaults.shape(shape = RoundedCornerShape(6.dp)),
            colors = ClickableSurfaceDefaults.colors(
                containerColor = NetflixGray,
                focusedContainerColor = NetflixGray,
            ),
            border = ClickableSurfaceDefaults.border(
                focusedBorder = androidx.tv.material3.Border(
                    border = androidx.compose.foundation.BorderStroke(2.dp, NetflixRed),
                    shape = RoundedCornerShape(6.dp),
                ),
            ),
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                if (!item.posterUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = item.posterUrl,
                        contentDescription = item.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(NetflixGray),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = item.title,
                            color = TextMuted,
                            style = MaterialTheme.typography.bodySmall,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.padding(8.dp),
                        )
                    }
                }

                // Badge rating arriba a la derecha
                if (item.rating != null) {
                    Row(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(10.dp)
                            .background(Color(0xCC000000), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = null,
                            tint = RatingYellow,
                            modifier = Modifier.size(12.dp),
                        )
                        Text(
                            text = Formatters.rating(item.rating),
                            color = Color.White,
                            style = MaterialTheme.typography.labelSmall,
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(posterOverflowDp))

        AnimatedVisibility(
            visible = focused,
            enter = fadeIn(),
            exit = fadeOut(),
            // El shadow del Surface eleva el layer del poster por encima de sus
            // hermanos en orden de dibujo; subimos el zIndex del título para que
            // se pinte por delante del glow rojo.
            modifier = Modifier.zIndex(2f),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 6.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                Text(
                    text = item.title,
                    color = Color.White,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (item.year != null) {
                        Text(
                            text = item.year.toString(),
                            color = YearGreen,
                            style = MaterialTheme.typography.labelSmall,
                        )
                    }
                    if (item.genres.isNotEmpty()) {
                        Text(
                            text = item.genres.take(2).joinToString(" · "),
                            color = TextMuted,
                            style = MaterialTheme.typography.labelSmall,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                        )
                    }
                }
            }
        }
    }
}
