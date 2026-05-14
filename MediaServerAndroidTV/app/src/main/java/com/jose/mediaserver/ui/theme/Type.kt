package com.jose.mediaserver.ui.theme

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Typography

private val NetflixFontFamily = FontFamily.SansSerif

val MediaServerTypography = Typography(
    displayLarge = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Black, fontSize = 56.sp),
    displayMedium = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.ExtraBold, fontSize = 44.sp),
    displaySmall = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Bold, fontSize = 36.sp),

    headlineLarge = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Bold, fontSize = 32.sp),
    headlineMedium = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Bold, fontSize = 28.sp),
    headlineSmall = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 24.sp),

    titleLarge = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    titleMedium = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.SemiBold, fontSize = 18.sp),
    titleSmall = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Medium, fontSize = 16.sp),

    bodyLarge = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Normal, fontSize = 14.sp),
    bodySmall = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Normal, fontSize = 12.sp),

    labelLarge = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Medium, fontSize = 14.sp),
    labelMedium = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Medium, fontSize = 12.sp),
    labelSmall = TextStyle(fontFamily = NetflixFontFamily, fontWeight = FontWeight.Medium, fontSize = 10.sp),
)
