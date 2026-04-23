# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Sistema

Servidor multimedia distribuido con cuatro componentes:

- **MediaServerApi** — ASP.NET Core Web API (backend principal)
- **MediaServerScanner** — `BackgroundService` que convive en el **mismo proceso y contenedor** que la API (vive en `Backend/API/Scanner/`)
- **MediaServerFront** — SPA React
- **SQL Server 2022**

El Scanner **no es un proyecto .NET separado**: sus Workers, Services y Models están dentro del proyecto `API/` y comparten el mismo contenedor. Se dispara periódicamente según `Scanner:IntervalMinutes` en `appsettings.json`.

Flujo de datos:
```
Disco/Red → ScannerWorker (escaneo + TMDB) → SQL Server → API (REST) → Frontend (UI)
```

Las migraciones pendientes se aplican automáticamente al arrancar (`db.Database.MigrateAsync()` en `Program.cs`).

---

## Arquitectura Backend

```
Backend/
  API/
    Controllers/      ← Thin controllers: solo despachan a MediatR
    Scanner/
      Workers/        ← ScannerWorker (IHostedService)
      Services/       ← MediaScannerService, TmdbClientService
      Models/         ← ScannerOptions, TmdbOptions
    Middleware/       ← ExceptionHandlingMiddleware
    Program.cs
  Application/        ← Handlers CQRS (MediatR) [compartido]
    Common/
      Behaviors/      ← ValidationBehavior, LoggingBehavior (pipeline MediatR)
      Interfaces/     ← IApplicationDbContext, IScannerStatusService
    {Domain}/
      Queries/        ← GetXxx / GetXxxById
      Commands/       ← UpsertXxx (patrón del scanner: idempotente)
    Mappings/         ← Perfiles AutoMapper
  Domain/             ← Entidades: Movie, Series, Documentary, Episode
  Infrastructure/     ← EF Core, migraciones, ServiceRegistration
  Contracts/          ← DTOs: XxxDto (detalle) y XxxListItemDto (lista)
  Core/               ← PagedResult<T>, FilterParams, helpers
  tests/
    Application.Tests ← In-memory DB (EF Core), xUnit, FluentAssertions
    Domain.Tests
```

Stack: .NET 8, C# 12, MediatR, EF Core (SQL Server), FluentValidation, AutoMapper, Scalar (OpenAPI).

**Pipeline MediatR:** `LoggingBehavior` → `ValidationBehavior` → Handler. Las `ValidationException` de FluentValidation se capturan en `ExceptionHandlingMiddleware` y se devuelven como `400 ValidationProblemDetails`. Los `KeyNotFoundException` se convierten en `404`.

---

## Scanner — Comportamiento y Estructura de Directorios

### Estructura de carpetas esperada

**Series** (jerarquía de 3 niveles):
```
/media/series/
  Breaking Bad/          ← carpeta de serie
    T1/                  ← temporada (T1, T01, Season 1, Temporada 1, etc.)
      episode(1x01).mkv  ← fichero de episodio
      episode(1x02).mkv
    T2/
      episode(2x01).mkv
```

**Películas y Documentales** (plano):
```
/media/movies/
  movie.mkv
/media/documentaries/
  documentary.mkv
```

### Parseo de episodios

El scanner detecta números de episodio en el nombre del fichero (orden de prioridad):

1. **Cap/Capítulo NNN** — `Cap 102`, `[Capítulo 102]` → S1E02
2. **SxEE** — `1x02`, `[01x05]` → temporada x episodio
3. **Compacto [NNN]** — `[102]` → S1E02
4. **Compacto bare** — bare `102` → S1E02 (fallback)

Todos los formatos soportan delimitadores opcionales `()` o `[]`.

### Comportamiento del scanner

**Actualización condicional (6 meses):**
- Si un fichero ya existe en BD → solo actualiza metadatos si han pasado **≥ 180 días** desde `UpdatedAt`
- Nuevo fichero → siempre se inserta
- Evita consultas innecesarias a TMDB para contenido que no ha cambiado

**Borrado automático:**
- Al final del escaneo, elimina registros cuyo FilePath/FolderPath ya no existe en disco
- Series, Episodes, Movies, Documentaries — todos limpios automáticamente
- Los episodios se borran por cascade si su serie es eliminada

**Trigger manual:**
- `POST /api/scanner/trigger` — encola un escaneo inmediato
- El worker detecta la solicitud cada 5 segundos y ejecuta al siguiente ciclo

---

## Arquitectura Frontend

```
MediaServerFront/src/
  services/     ← api.ts (Axios base), {domain}Service.ts
  store/        ← use{Domain}Store.ts (Zustand)
  pages/        ← {Domain}Page, {Domain}DetailPage
  components/
    layout/     ← MainLayout
    ui/         ← EmptyState, ErrorMessage, etc.
  routes/       ← AppRouter.tsx
  types/        ← Tipos TypeScript (espejo de Contracts)
  utils/        ← formatters.ts (formatDate, formatRating, formatRuntime)
  i18n/         ← react-i18next
```

Stack: React + TypeScript, Vite, React Router, Zustand, TailwindCSS, react-i18next.

La URL base de la API se configura con la variable de entorno `VITE_API_URL` (por defecto `/api`).

---

## Comandos

### Backend (ejecutar desde `Backend/`)
```bash
dotnet restore
dotnet build
dotnet test
dotnet run --project API/
# Un test concreto:
dotnet test --filter "FullyQualifiedName~NombreDelTest"
```

### Frontend (ejecutar desde `MediaServerFront/`)
```bash
npm install
npm run dev
npm run build
npm run lint
```

### Docker
```bash
# Copiar y editar variables de entorno primero:
cp .env.example .env

docker-compose up --build
docker-compose down
```

El archivo `docker-compose.override.yml` está en `.gitignore` y se usa para configuración local (rutas NAS, credenciales de desarrollo). No añadir credenciales reales a ningún archivo versionado.

### Migraciones ⚠️ Requieren aprobación
```bash
dotnet ef migrations add <NombreMigracion> --project Infrastructure --startup-project API
dotnet ef database update --project Infrastructure --startup-project API
```

---

## Puertos (Docker)

| Contenedor | Puerto |
|---|---|
| SQL Server | 1433 |
| MediaServerApi + Scanner | 5001 |
| Frontend (Nginx) | 80 |

API reference (Scalar) disponible en `http://localhost:5001/scalar` cuando `ASPNETCORE_ENVIRONMENT=Development`.

---

## Convenciones

- **C#**: PascalCase en clases/métodos, camelCase en variables, prefijo `I` en interfaces, sufijo `Async` en async. Nullable habilitado.
- **TypeScript/React**: PascalCase en componentes, prefijo `use` en hooks.
- **Commits**: `Area: descripción` (ej. `API: añadir endpoint de series`)
- Controladores solo despachan a MediatR; no contienen lógica de negocio.
- Los comandos del scanner son `Upsert` (no `Create`) para garantizar idempotencia.
- `Contracts` tiene dos DTOs por entidad: `XxxListItemDto` (lista paginada) y `XxxDto` (detalle completo).
- `SeriesDto` incluye `EpisodeFiles: List<EpisodeListItemDto>` para acceso a episodios sin endpoint extra.
- `Episode` es una entidad separada con FK a Series; se carga con `Include(s => s.EpisodeFiles)` en queries de detalle.
- No mezclar dominio con infraestructura. Logging con contexto (`CorrelationId`).

---

## Restricciones

- **⚠️ Requiere aprobación:** migraciones de BD, cambios en Docker/CI-CD, gestión de secretos.
- **Prohibido:** hardcodear credenciales, modificar scripts de inicialización sin validación.

---

## Memoria Persistente — Engram

Este proyecto usa **Engram** como memoria estructurada entre sesiones. Funciona como interceptor de hooks (Read/Edit/Write) que mantiene un grafo de conocimiento del código.

### Comandos de memoria

| Comando | Cuándo usarlo |
|---|---|
| `engram learn "<texto>"` | Guardar una decisión, patrón o lección aprendida |
| `engram query "<pregunta>"` | Consultar el grafo antes de empezar una tarea relacionada con trabajo previo |
| `engram mistakes` | Revisar errores conocidos antes de un cambio delicado |
| `engram memory-sync` | Sincronizar hechos estructurales del grafo a `MEMORY.md` |
| `engram stats` | Ver estadísticas del grafo y ahorro de tokens |

### Protocolo recomendado

**Al iniciar una tarea:**
```bash
engram query "<área o concepto de la tarea>"
```

**Durante el trabajo**, ejecutar `engram learn` al:
- Corregir un bug relevante
- Tomar una decisión de arquitectura
- Descubrir un patrón o convención no obvio

```bash
engram learn "Elegimos UpsertXxx en lugar de CreateXxx en el scanner para garantizar idempotencia"
```

**Al cerrar sesión:**
```bash
engram learn "Sesión YYYY-MM-DD: <resumen de lo completado y decisiones tomadas>"
engram memory-sync
```
