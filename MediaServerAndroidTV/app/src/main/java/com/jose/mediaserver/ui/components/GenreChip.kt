package com.jose.mediaserver.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.jose.mediaserver.ui.theme.NetflixGray
import com.jose.mediaserver.ui.theme.NetflixRed
import com.jose.mediaserver.ui.theme.TextMuted

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun GenreChip(
    label: String,
    selected: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val bg = if (selected) NetflixRed else androidx.compose.ui.graphics.Color.Transparent
    val borderColor = if (selected) NetflixRed else NetflixGray
    val textColor = if (selected) androidx.compose.ui.graphics.Color.White else TextMuted

    androidx.compose.foundation.layout.Box(
        modifier = modifier
            .background(bg, RoundedCornerShape(100))
            .border(1.dp, borderColor, RoundedCornerShape(100))
            .padding(horizontal = 12.dp, vertical = 6.dp),
    ) {
        Text(
            text = label,
            color = textColor,
            style = MaterialTheme.typography.labelMedium,
        )
    }
}
