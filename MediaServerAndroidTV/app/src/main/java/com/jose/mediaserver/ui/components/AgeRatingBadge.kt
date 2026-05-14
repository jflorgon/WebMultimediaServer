package com.jose.mediaserver.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.Text
import com.jose.mediaserver.ui.theme.NetflixGray
import com.jose.mediaserver.ui.theme.TextMuted
import com.jose.mediaserver.util.AgeRating

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun AgeRatingBadge(
    code: String?,
    modifier: Modifier = Modifier,
    showDescription: Boolean = false,
) {
    val info = AgeRating.resolve(code) ?: return
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Row(
            modifier = Modifier
                .background(Color.White, RoundedCornerShape(4.dp))
                .border(1.dp, NetflixGray, RoundedCornerShape(4.dp))
                .padding(horizontal = 6.dp, vertical = 2.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = info.shortCode,
                color = Color.Black,
                style = MaterialTheme.typography.labelMedium.copy(fontFamily = FontFamily.Monospace),
            )
        }
        if (showDescription) {
            Text(
                text = info.description,
                color = TextMuted,
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}
