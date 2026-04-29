# Despliegue

## Desarrollo local

### Requisitos
- Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- Python 3
- NAS opcional en `192.168.1.90:445`

### Variables de entorno
```bash
cp .env.example .env
# Editar .env con SA_PASSWORD y TMDB_API_KEY
```

### Arrancar
```bash
# El script detecta el NAS automáticamente
python docker-start.py up -d

# Tras cambios en el código
python docker-start.py up --build -d

# Apagar (la BD persiste)
python docker-start.py down

# Logs en tiempo real
python docker-start.py logs -f mediaserver-api

# Vigilar NAS y reconectar cuando vuelva
python docker-start.py watch &
```

### Acceso en desarrollo
| Servicio | URL |
|---|---|
| Frontend | http://localhost |
| API / Scalar | http://localhost:5001/scalar |
| SQL Server | localhost:1433 (añadir puerto en `docker-compose.override.yml`) |

### Exponer SQL Server en local
Crear `docker-compose.override.yml` a partir del ejemplo:
```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```
Este fichero está en `.gitignore` y no se sube al repositorio.

### Ficheros compose
| Fichero | Propósito | Versionado |
|---|---|---|
| `docker-compose.yml` | Base: redes, volúmenes, servicios | ✅ |
| `docker-compose.override.yml` | Dev: overrides locales (puerto 1433, etc.) | ❌ gitignored |
| `docker-compose.nas.yml` | Monta `/media` desde NAS CIFS | ❌ gitignored |
| `docker-compose.prod.yml` | Producción: bind mounts locales, puertos expuestos | ✅ |

---

## Producción (Linux Ubuntu)

### Requisitos
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### Instalación
1. Descargar el ZIP del repositorio (GitHub → Code → Download ZIP) y descomprimir.
2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   nano .env   # rellenar SA_PASSWORD y TMDB_API_KEY
   ```
3. Verificar que los medios están montados:
   ```bash
   ls /mnt/nas/Peliculas
   ls /mnt/nas/Series
   ls /mnt/nas/Documentales
   ```
4. Arrancar:
   ```bash
   python3 docker-start.py --prod up --build -d
   ```

El primer arranque tarda varios minutos (descarga imágenes base, compila .NET).  
Las migraciones de BD se aplican automáticamente.

### Actualizaciones
```bash
# Descargar nuevo ZIP, descomprimir sobreescribiendo ficheros
# Restaurar el .env (no está en el ZIP)
python3 docker-start.py --prod up --build -d
```

### Acceso en producción
| Servicio | URL |
|---|---|
| Frontend | http://\<ip-máquina\> |
| API / Scalar | http://\<ip-máquina\>:5001/scalar |
| SQL Server | \<ip-máquina\>:1433 (sa / contraseña del .env) |

### Notas importantes
- **Nunca** usar `docker-compose down -v` ni `docker start.py down -v` — borra la base de datos.  
  Para borrar la BD manualmente: `docker volume rm webmultimediaserver_sqlserver-data`
- En Ubuntu moderno el comando es `docker compose` (plugin integrado). El script `docker-start.py` ya lo usa correctamente.
- El flag `--prod` incluye `docker-compose.prod.yml`: bind mounts en `/mnt/nas/`, puertos 1433 y 5001 expuestos.
- La BD persiste en el volumen `sqlserver-data` aunque se haga `down`.
