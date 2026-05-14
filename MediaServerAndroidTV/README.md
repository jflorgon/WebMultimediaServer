# MediaServer · Cliente Android TV

Aplicación nativa para **Android TV / Chromecast con Google TV** que consume la misma API que la SPA web y el widget Tizen.

> Stack: Kotlin 2.0 · Jetpack Compose for TV · Media3 ExoPlayer · Retrofit · Hilt · Room

---

## Estado actual

| Fase | Descripción | Estado |
|---|---|---|
| 0 | Scaffolding Gradle + Manifest + Theme oscuro Netflix | ✅ |
| 1 | DTOs, Retrofit `MediaApi`, repositorios, Hilt | ✅ |
| 2 | Componentes UI (MediaCard, HeroCarousel, TopBar…) | ✅ |
| 2.5 | Navegación (NavHost + rutas tipadas) | ✅ |
| 3 | Catálogos Movies/Series/Documentales (grid + chips + scroll infinito) | ✅ |
| 4 | Pantallas de detalle (backdrop + tabs temporadas + episodios) | ✅ |
| 5 | Reproductor ExoPlayer (direct/HLS + controles + heartbeat + atajos D-pad) | ✅ |
| 6 | Resume local con Room | ✅ |
| 7 | i18n ES/EN + pulido | 🟡 base hecha |
| 8 | APK release firmado + sideload | 🟡 doc lista, falta keystore |

---

## Prerrequisitos

JDK 17 + Android SDK 34 ya instalados en `~/.jdk` y `~/Android` (ver `MEMORY.md` → "Toolchain Android local"). Las env vars están en `~/.bashrc`. En sesiones nuevas:

```bash
source ~/.bashrc      # JAVA_HOME, ANDROID_HOME, PATH listos
```

---

## Configurar la URL de la API

Edita `gradle.properties` con la IP de tu servidor en LAN:

```properties
MEDIASERVER_API_URL=http://192.168.1.90:5001/api
```

También se puede sobrescribir al compilar:

```bash
./gradlew :app:assembleDebug -PMEDIASERVER_API_URL="http://192.168.1.90:5001/api"
```

---

## Comandos

```bash
# Compilar APK debug
./gradlew :app:assembleDebug
# Genera: app/build/outputs/apk/debug/app-debug.apk

# Tests unitarios (Formatters, AgeRating, Mappers)
./gradlew :app:testDebugUnitTest

# APK release (requiere keystore — ver más abajo)
./gradlew :app:assembleRelease
```

---

## Instalar en Chromecast con Google TV (modo desarrollador, gratis)

1. **Activar modo desarrollador** en el Chromecast:
   - Ajustes → Sistema → Acerca de.
   - Pulsar 7 veces sobre "Compilación de Android TV OS" hasta el aviso "Ya eres desarrollador".
2. **Activar depuración por ADB**:
   - Ajustes → Sistema → Desarrolladores → Depuración por ADB (ON).
3. **Anotar la IP** del Chromecast (Ajustes → Red e Internet → tu red → IP).
4. **Conectar y sideload** desde la PC (misma red WiFi):
   ```bash
   adb connect <IP-Chromecast>:5555
   # La primera vez aparece un diálogo en la TV; aceptar siempre.
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
5. La app aparece en el launcher de Google TV en **Apps → Ver todo** (las apps sideloaded no salen en la fila principal por defecto; opcional usar *Sideload Launcher* para anclarlas).

---

## APK release firmado (para distribución más allá del debug)

```bash
keytool -genkey -v \
  -keystore mediaserver-tv.keystore \
  -alias mediaserver \
  -keyalg RSA -keysize 2048 -validity 10000
```

Luego añadir `signingConfigs.release` en `app/build.gradle.kts` con `storeFile`, `storePassword`, `keyAlias`, `keyPassword` (idealmente leídos desde variables de entorno o `~/.gradle/gradle.properties` para no comitirlos).

---

## Logs en tiempo real

```bash
# Solo nuestra app
adb logcat -s MediaServerTV:* ExoPlayerImpl:* HlsMediaSource:*

# Verificar heartbeat en backend (Docker)
docker logs -f myhomemediaserver-api-1 | grep -E "keep-alive|ffmpeg"
```

---

## Atajos del mando

| Tecla | Acción |
|---|---|
| ◀ / ▶ (D-pad) | ±10 s |
| ▲ / ▼ (D-pad) | ±60 s |
| OK / Enter | Play / Pausa |
| BACK | Cerrar reproductor (guarda posición) |

---

## Estructura

```
app/src/main/java/com/jose/mediaserver/
  MainActivity.kt            Punto de entrada Hilt + NavHost
  MediaServerApp.kt          @HiltAndroidApp
  data/
    api/                     Retrofit MediaApi + DTOs
    local/                   Room + ResumeDao
    repository/              Movies/Series/Documentaries/Streaming/Resume
  domain/
    model/                   Modelos UI (MediaListItem, MediaDetail, …)
    mappers/                 DTO → modelo
  di/                        NetworkModule, DatabaseModule
  ui/
    theme/                   Paleta Netflix + tipografía Compose
    navigation/              Routes + MediaNavHost
    components/              MediaCard, HeroCarousel, TopBar, GenreChip, …
    screens/
      home/                  HomeScreen + ViewModel
      catalog/               CatalogScreen genérico (Movies/Series/Docs)
      detail/                DetailScreen + tabs de temporadas
      player/                PlayerScreen ExoPlayer + heartbeat + resume
  util/                      Formatters, AgeRating
```
