package com.jose.mediaserver

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.jose.mediaserver.ui.navigation.MediaNavHost
import com.jose.mediaserver.ui.theme.MediaServerTheme
import com.jose.mediaserver.ui.theme.NetflixBlack
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MediaServerTheme {
                Root()
            }
        }
    }
}

@Composable
private fun Root() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(NetflixBlack),
    ) {
        val nav = rememberNavController()
        MediaNavHost(navController = nav)
    }
}
