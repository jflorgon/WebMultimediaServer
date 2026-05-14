package com.jose.mediaserver.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.jose.mediaserver.domain.model.MediaKind
import com.jose.mediaserver.ui.screens.catalog.CatalogScreen
import com.jose.mediaserver.ui.screens.detail.DetailScreen
import com.jose.mediaserver.ui.screens.home.HomeScreen
import com.jose.mediaserver.ui.screens.player.PlayerScreen

private fun NavHostController.navigateTopLevel(kind: MediaKind?) {
    val route = when (kind) {
        MediaKind.Movie -> Routes.MOVIES
        MediaKind.Series -> Routes.SERIES
        MediaKind.Documentary -> Routes.DOCUMENTARIES
        null -> Routes.HOME
        else -> Routes.HOME
    }
    navigate(route) {
        popUpTo(Routes.HOME) { inclusive = false }
        launchSingleTop = true
    }
}

@Composable
fun MediaNavHost(navController: NavHostController) {
    NavHost(navController = navController, startDestination = Routes.HOME) {

        composable(Routes.HOME) {
            HomeScreen(
                onItemClick = { item -> navController.navigate(Routes.detail(item.kind, item.id)) },
                onPlay = { item ->
                    // Películas y documentales planos van directos al player.
                    // Series → preferible abrir detalle para elegir episodio.
                    if (item.kind == MediaKind.Series) {
                        navController.navigate(Routes.detail(item.kind, item.id))
                    } else {
                        navController.navigate(Routes.player(item.kind, item.id, item.title))
                    }
                },
                onNavigateTab = { kind -> navController.navigateTopLevel(kind) },
            )
        }

        composable(Routes.MOVIES) {
            CatalogScreen(
                kind = MediaKind.Movie,
                onItemClick = { item -> navController.navigate(Routes.detail(item.kind, item.id)) },
                onBack = { navController.popBackStack() },
                onNavigateTab = { kind -> navController.navigateTopLevel(kind) },
                onNavigateHome = { navController.navigateTopLevel(null) },
            )
        }
        composable(Routes.SERIES) {
            CatalogScreen(
                kind = MediaKind.Series,
                onItemClick = { item -> navController.navigate(Routes.detail(item.kind, item.id)) },
                onBack = { navController.popBackStack() },
                onNavigateTab = { kind -> navController.navigateTopLevel(kind) },
                onNavigateHome = { navController.navigateTopLevel(null) },
            )
        }
        composable(Routes.DOCUMENTARIES) {
            CatalogScreen(
                kind = MediaKind.Documentary,
                onItemClick = { item -> navController.navigate(Routes.detail(item.kind, item.id)) },
                onBack = { navController.popBackStack() },
                onNavigateTab = { kind -> navController.navigateTopLevel(kind) },
                onNavigateHome = { navController.navigateTopLevel(null) },
            )
        }

        composable(
            route = Routes.DETAIL_PATTERN,
            arguments = listOf(
                navArgument(Routes.DETAIL_ARG_KIND) { type = NavType.StringType },
                navArgument(Routes.DETAIL_ARG_ID) { type = NavType.StringType },
            ),
        ) {
            DetailScreen(
                onPlay = { kind, id, title ->
                    navController.navigate(Routes.player(kind, id, title))
                },
                onBack = { navController.popBackStack() },
            )
        }

        composable(
            route = Routes.PLAYER_PATTERN,
            arguments = listOf(
                navArgument(Routes.PLAYER_ARG_KIND) { type = NavType.StringType },
                navArgument(Routes.PLAYER_ARG_ID) { type = NavType.StringType },
                navArgument(Routes.PLAYER_ARG_TITLE) { type = NavType.StringType },
            ),
        ) {
            PlayerScreen(
                onExit = { navController.popBackStack() },
            )
        }
    }
}
