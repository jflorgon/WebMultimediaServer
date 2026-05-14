package com.jose.mediaserver.ui.theme

import androidx.compose.runtime.Composable
import androidx.tv.material3.ColorScheme
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.darkColorScheme

@OptIn(ExperimentalTvMaterial3Api::class)
private val NetflixDarkColors: ColorScheme = darkColorScheme(
    primary = NetflixRed,
    onPrimary = NetflixText,
    primaryContainer = NetflixRedDark,
    onPrimaryContainer = NetflixText,
    secondary = NetflixGray,
    onSecondary = NetflixText,
    background = NetflixBlack,
    onBackground = NetflixText,
    surface = NetflixDark,
    onSurface = NetflixText,
    surfaceVariant = NetflixGray,
    onSurfaceVariant = TextMuted,
    border = NetflixGray,
    borderVariant = NetflixGray,
)

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun MediaServerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = NetflixDarkColors,
        typography = MediaServerTypography,
        content = content,
    )
}
