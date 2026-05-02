# Empaquetado para Samsung TV (Tizen)

Genera un widget `.wgt` con la SPA estática para instalarlo en un televisor Samsung con Tizen OS en modo desarrollador.

## Prerrequisitos

- **Tizen Studio CLI** instalado en `C:\tizen-studio` (la ruta por defecto del script).
- **Perfil de seguridad** Samsung TV creado en *Certificate Manager* (Tizen Studio → Tools → Certificate Manager → Distributor: Samsung → Tizen TV). Se necesita una cuenta Samsung Developer.
- **TV en modo Developer**:
  - Apps → mando: `1 2 3 4 5` para abrir el menú oculto.
  - Activar *Developer mode* y poner la **IP del PC** desde el que vas a publicar.
  - Reiniciar el TV.
- **Backend accesible**: el contenedor `mediaserver-api` ha de estar levantado (`python docker-start.py up -d`) y alcanzable desde la LAN del TV en el puerto 5001.

## Configuración

```
cp .env.tizen.example .env.tizen
# Edita .env.tizen y pon la IP del servidor en VITE_API_URL
```

Ejemplo:
```
VITE_API_URL=http://192.168.1.50:5001/api
VITE_TIZEN=true
```

`VITE_TIZEN=true` activa `HashRouter` y `base: './'` en Vite, imprescindibles para que la SPA arranque desde `file://` dentro del widget.

## Build

Desde `MediaServerFront/`:

```
python scripts/build-tizen.py --profile <NombrePerfil>
```

Opciones:
- `--api-url http://...`: sobrescribe `VITE_API_URL` solo para esta build (escribe `.env.tizen.local`).
- `--tizen-cli "<ruta>"`: si Tizen Studio está en otra ubicación distinta a `C:\tizen-studio`.

El widget firmado aparece en `dist-tizen/MediaServer-1.0.0-<timestamp>.wgt`.

## Despliegue al TV (sdb)

```
C:\tizen-studio\tools\sdb connect <IP_TV>:26101
C:\tizen-studio\tools\sdb devices
```

`sdb devices` debe listar el TV. Anota el `<DeviceName>` que aparece (suele ser algo como `UE55…`).

Instalar y lanzar:

```
"C:\tizen-studio\tools\ide\bin\tizen.bat" install -n dist-tizen\<wgt> -t <DeviceName>
"C:\tizen-studio\tools\ide\bin\tizen.bat" run -p MediaSrv01.MediaServer -t <DeviceName>
```

Alternativamente, lanza la app desde el menú *Apps* del TV una vez instalada.

## Mando D-pad

- Las flechas y `Enter` mueven el foco entre elementos focusables (cards, enlaces, botones) usando el orden de tabulación nativo. El estilo de foco está reforzado en `index.css` (`:focus-visible` en rojo Netflix, outline 4 px) para que sea visible a 3 m.
- La tecla `Return` del mando (keyCode 10009) navega hacia atrás (`history.back()`) y cierra la app si no hay historial. Está gestionada por `src/hooks/useTizenRemote.ts`.

## Troubleshooting

- **`sdb connect` falla**: comprueba que la IP del PC está en la allowlist del Developer Mode del TV y que el firewall permite el puerto 26101 saliente.
- **Pantalla en blanco al lanzar**: abre el inspector de Tizen (`sdb shell` → `wrt-debugger`) o instala con `--debug` para arrancar Web Inspector. Comprueba que `index.html` apunta a `./assets/...` (`base: './'` aplicado).
- **API no responde / CORS**: verifica `VITE_API_URL` en los assets del bundle (`grep -r 'localhost\|192\.168' dist/assets/*.js`). El backend ya tiene `AllowAnyOrigin`, así que normalmente es la URL la que está mal.
- **Certificado expirado**: regenera el perfil en Certificate Manager y vuelve a empaquetar.
- **`tizen package` falla con perfil inválido**: lista los perfiles con `tizen security-profiles list` y usa exactamente ese nombre en `--profile`.
