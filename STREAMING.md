# Streaming: HLS y Direct Play

Este documento describe cómo el servidor decide entre **HLS** (vía FFmpeg) y **direct play** (servir el fichero original con HTTP Range), y cómo revertir si direct play causa problemas.

---

## Resumen del flujo

1. El frontend pide `GET /api/streaming/{type}/{id}/source`.
2. El backend prueba (`ffprobe`) el fichero y decide:
   - **Apto** → responde `{ mode: "direct", url: "/api/streaming/{type}/{id}/direct", mime: "..." }`.
   - **No apto** → responde `{ mode: "hls", url: "/api/streaming/{type}/{id}/playlist.m3u8" }`.
3. El frontend monta `VideoPlayer` con la URL devuelta:
   - `mode: 'direct'` → asigna `video.src` y reproduce nativo con Range.
   - `mode: 'hls'` → usa `hls.js` como hasta ahora.

Si el endpoint `/source` falla por cualquier motivo, el frontend hace **fallback duro a HLS**.

---

## Criterios actuales para direct play

Implementados en `Backend/API/Services/DirectPlayService.cs`. El fichero se sirve en directo **solo si**:

- **Vídeo**: códec `h264`, pixel format `yuv420p` (8 bits). 10-bit (`yuv420p10le`) queda excluido.
- **Audio**: códec `aac` (cualquier número de canales).
- **Contenedor**: cualquiera (`.mp4`, `.mkv`, `.mov`, `.webm`...). El MIME se asigna por extensión.

Cualquier otro caso (HEVC, VP9, AC3, EAC3, DTS, MPEG-2…) sigue por HLS.

### Por qué este criterio es "agresivo"

Permitir MKV con AAC es la principal apuesta. MKV no es un contenedor nativo de la mayoría de navegadores de escritorio, pero:

- **Tizen TV (Chromium 76)**: reproduce MKV+H.264+AAC nativamente sin problema.
- **Chrome/Firefox/Safari escritorio**: el soporte es variable. Puede que el `<video>` rechace el MKV y se quede sin reproducir.

Si esto ocurre con frecuencia desde escritorio se puede:

1. Apagar direct play global (ver "Rollback").
2. Restringir el criterio a sólo `.mp4` editando `DirectPlayService.GuessMime` y filtrando por extensión antes de devolver el `DirectPlayInfo`.

---

## Rollback

### Opción A: flag de configuración (recomendada, sin reiniciar código)

`Backend/API/appsettings.json`:

```json
"Streaming": {
  "DirectPlayEnabled": true
}
```

Cambia a `false` y reinicia el contenedor de la API:

```bash
docker compose restart api    # o python docker-start.py restart api
```

A partir de ese momento `ProbeAsync` devuelve `null` siempre y todo vuelve a HLS, sin tocar código.

### Opción B: revert al commit anterior

Los cambios viven en estos ficheros (commit que introduce direct play):

- `Backend/Application/Common/Interfaces/IDirectPlayService.cs`
- `Backend/API/Services/DirectPlayService.cs`
- `Backend/API/Services/StreamingOptions.cs`
- `Backend/API/Controllers/StreamingController.cs` (nuevos endpoints `/source` y `/direct`, HLS sin tocar)
- `Backend/API/Program.cs` (registro DI + `Configure<StreamingOptions>`)
- `Backend/API/appsettings.json` (sección `Streaming`)
- `MediaServerFront/src/services/streaming.ts` (`resolveStreamSource`)
- `MediaServerFront/src/services/useStreamSource.ts`
- `MediaServerFront/src/components/ui/VideoPlayer.tsx` (prop `mode`)
- `MediaServerFront/src/pages/{Movie,Series,Documentary}DetailPage.tsx`

Para volver al comportamiento anterior basta con `git revert <commit>` o restaurar a mano `streamUrl(.../playlist.m3u8)` en las páginas y pasar `mode="hls"` (default) al `VideoPlayer`.

---

## Diagnóstico cuando un fichero falla en direct play

1. Mira los logs del backend al pulsar Play. Verás una de estas líneas (nivel `Debug`/`Information`):
   - `Direct play OK para {File} ({Mime}, {Size} bytes)` → se sirvió directo.
   - `Direct play denegado para {File}: video=... pix=... bit=... audio=...` → no cumple criterios, fue por HLS.
2. Si **se sirvió directo y el navegador no lo reproduce** (pantalla negra o error en consola del cliente):
   - Abre devtools del navegador → pestaña Network → mira el response del `/direct`. Debe ser `206 Partial Content` con `Content-Range`.
   - En consola debería aparecer `[direct] error cargando fuente directa` con `MediaError`. Códigos típicos:
     - `MEDIA_ERR_SRC_NOT_SUPPORTED` (4): el contenedor o códec no es decodificable. Solución: forzar HLS para ese caso.
     - `MEDIA_ERR_DECODE` (3): bitstream corrupto. Probablemente también falle por HLS.
3. Para forzar HLS rápidamente y comparar, apaga el flag o tira el endpoint a mano: `/api/streaming/{type}/{id}/playlist.m3u8` sigue funcionando independientemente.

---

## Caché de cliente y seek

- El response `/direct` se sirve con `enableRangeProcessing: true` → `206 Partial Content` y `Accept-Ranges: bytes`. El navegador puede buscar (seek) sin recargar el fichero entero.
- No se establece `Cache-Control` en `/direct`. Si el contenido cambia raramente conviene ponerlo en `ETag`/`Last-Modified` para evitar releer la cabecera completa en cada seek; por ahora se delega al servidor estático de ASP.NET.

---

## Próximos pasos (no implementados)

- Detección de `bit_depth` 10/12 más estricta (probar AV1 cuando aparezca).
- Restringir contenedor por user-agent (Chrome desktop → solo MP4; Tizen → permitir MKV).
- Cache pre-caliente de `ProbeAsync` por `(id, mtime)` para evitar `ffprobe` en cada `/source`.
