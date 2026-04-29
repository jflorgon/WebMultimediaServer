# Scanner — Reglas de parseo de ficheros y carpetas

Referencia completa de los criterios que usa el scanner para detectar temporadas, episodios y títulos.
Ficheros implicados: `Backend/API/Scanner/Services/EpisodeParser.cs` y `MediaScannerService.cs`.

---

## Estructura de carpetas soportada

### Series — jerarquía con subcarpetas de temporada

```
/media/series/
  Breaking Bad (2008)/     ← carpeta de serie (año opcional)
    T1/                    ← subcarpeta de temporada
      1x01 Pilot.mkv
    T2/
      2x01 Four Days Out.mkv
```

### Series — estructura plana (sin subcarpetas de temporada)

```
/media/series/
  Pluribus/
    Pluribus [01x01] 1080p.mkv   ← temporada y episodio en el nombre
    Pluribus [01x07] 720p.mkv
```

Cuando no hay subcarpetas de temporada el scanner busca los ficheros directamente
en la carpeta de la serie. Si el nombre del fichero no indica temporada, se asume **temporada 1**.

### Películas y Documentales — siempre plano

```
/media/movies/
  The Matrix (1999).mkv
/media/documentaries/
  Cosmos (101).mkv
```

---

## Detección de carpetas de temporada

**Regex:** `\b(?:T(?:emporada)?|Season|Temporada)\s*0*(\d+)$`  
Case-insensitive. Busca el patrón al **final** del nombre, por lo que funciona tanto
con carpetas simples como con nombres que incluyen el nombre de la serie como prefijo.

| Nombre de carpeta | Detectado como |
|---|---|
| `T1` | Temporada 1 |
| `T01` | Temporada 1 |
| `Temporada 2` | Temporada 2 |
| `Season 3` | Temporada 3 |
| `Stranger things T1` | Temporada 1 |
| `The Mandalorian Season 2` | Temporada 2 |
| `Capitulo 1` | ❌ no reconocida |
| `S01` | ❌ no reconocida |

---

## Detección de número de episodio en el nombre del fichero

Se aplican cuatro patrones en orden de prioridad. El primero que encaja gana.

### Prioridad 1 — Cap / Capítulo NNN

**Regex:** `[\(\[]?Cap(?:[ií]tulo)?\.?\s*(\d)(\d{2})[\)\]]?`

El dígito capturado como grupo 1 es la **temporada**, los dos siguientes el **episodio**.

| Ejemplo | Resultado |
|---|---|
| `Cap 102` | S1E02 |
| `[Cap.203]` | S2E03 |
| `[Capítulo 102]` | S1E02 |
| `Capítulo.305` | S3E05 |
| `Chernobyl - Temporada 1 [HDTV][Cap.101]` | S1E01 |

### Prioridad 2 — SxEE / SSxEE

**Regex:** `[\(\[]?(\d{1,2})x(\d{1,3})[\)\]]?`  
Case-insensitive. Los corchetes y paréntesis son opcionales.

| Ejemplo | Resultado |
|---|---|
| `1x07` | S1E07 |
| `01x07` | S1E07 |
| `[01x07]` | S1E07 |
| `(2x12)` | S2E12 |
| `Pluribus [01x07] 720p` | S1E07 |

### Prioridad 3 — Compacto NNN entre delimitadores

**Regex:** `[\(\[](\d)(\d{2})[\)\]]`

Requiere paréntesis o corchetes explícitos. El primer dígito es la temporada.

| Ejemplo | Resultado |
|---|---|
| `[102]` | S1E02 |
| `(305)` | S3E05 |
| `Cosmos (101)` | S1E01 |

### Prioridad 4 — Compacto NNN en palabra aislada (fallback)

**Regex:** `\b(\d)(\d{2})\b`

Solo actúa en límites de palabra (`\b`). No detecta números pegados a `_` u otros
caracteres `\w`, por lo que `PresuntoCulpable_104_` **no** se detecta.

| Ejemplo | Resultado |
|---|---|
| `serie 102 español` | S1E02 |
| `serie_104_web` | ❌ no detectado |

---

## Extracción de título del episodio

Tras identificar el número de episodio, el scanner elimina del nombre del fichero:
- El patrón de Cap/Capítulo
- El patrón SxEE
- El patrón compacto entre delimitadores
- Separadores `.-_` → espacios
- Espacios múltiples y caracteres `()-[]` sobrantes al inicio/fin

Si el resultado queda vacío, se usa el nombre del fichero original sin extensión.
Si TMDB devuelve el título del episodio, ese título tiene preferencia sobre el extraído del nombre.

---

## Limpieza de nombres para búsqueda TMDB

`ParseFileName` se aplica a:
- El nombre de la **carpeta de serie** (para buscar la serie en TMDB)
- El nombre del **fichero** de película o documental

### Año

**Regex de extracción:** `[\.\s\(\[](\d{4})[\)\]]?`

Detecta años como `(2008)`, ` 2008`, `.2008`, `[2008`.  
El año extraído se pasa a TMDB como:
- `year` para películas/documentales
- `first_air_date_year` para series

### Eliminación de contenido entre corchetes/paréntesis

**Regex:** `[\(\[](?![SsTt]\d+[EeXx]\d+|\d+[xX]\d+|2\d{3})[^\(\)\[\]]*[\)\]]`

Elimina contenido entre delimitadores **excepto** si el contenido es:
- Un código de episodio estilo S01E07 o T01x07 → se conserva
- Un patrón SxEE sin prefijo como `01x07` → se conserva
- Un año (empieza por `2` seguido de 3 dígitos) → se conserva

| Entrada | Resultado |
|---|---|
| `Breaking Bad (2008)` | `Breaking Bad` + año 2008 |
| `Serie [HDTV 720p]` | `Serie` |
| `Serie [S01E07]` | `Serie [S01E07]` (conservado) |
| `Serie [01x07]` | `Serie [01x07]` (conservado) |
| `Movie (2023) [BluRay]` | `Movie` + año 2023 |

### Normalización final

Los separadores `.-_` se reemplazan por espacios y se eliminan espacios múltiples.

---

## Borrado automático al final del escaneo

Al terminar, el scanner compara lo encontrado en disco con la BD y elimina
registros huérfanos (FilePath/FolderPath ya no existe).

**Guard de seguridad:** si ninguna ruta de medios es accesible (NAS caído, disco
desmontado, etc.) el borrado se cancela para evitar pérdida masiva de datos.
