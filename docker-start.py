#!/usr/bin/env python3
"""
Wrapper para docker-compose que detecta NAS automaticamente.

Comandos:
  python docker-start.py up -d          Arrancar
  python docker-start.py up --build -d  Arrancar y reconstruir imagenes
  python docker-start.py down           Apagar (BD persiste)
  python docker-start.py logs -f mediaserver-api
  python docker-start.py watch          Vigilar NAS y reconectar cuando vuelva
"""

import subprocess
import socket
import sys
import time
import signal

NAS_HOST = "192.168.1.90"
NAS_PORT = 445
WATCH_INTERVAL = 30

BASE_FILES = ["-f", "docker-compose.yml", "-f", "docker-compose.override.yml"]
NAS_FILES  = ["-f", "docker-compose.nas.yml"]


def is_nas_available(timeout=2):
    try:
        socket.create_connection((NAS_HOST, NAS_PORT), timeout=timeout)
        return True
    except (socket.timeout, socket.error, OSError):
        return False


def compose_cmd(nas_available, *args):
    cmd = ["docker-compose"] + BASE_FILES
    if nas_available:
        cmd += NAS_FILES
    cmd += list(args)
    return cmd


def run(cmd):
    subprocess.run(cmd, check=True)


def watch():
    print(f"[WATCH] Vigilando NAS en {NAS_HOST}:{NAS_PORT} cada {WATCH_INTERVAL}s (Ctrl+C para salir)")

    last_nas = is_nas_available()
    print(f"[WATCH] Estado inicial: {'NAS disponible' if last_nas else 'NAS no disponible'}")

    def handle_signal(sig, frame):
        print("\n[WATCH] Deteniendo")
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    while True:
        time.sleep(WATCH_INTERVAL)
        nas = is_nas_available()

        if nas == last_nas:
            continue

        if nas:
            print("[WATCH] NAS detectado -> reconectando API con volumen NAS...")
        else:
            print("[WATCH] NAS perdido -> reconectando API sin volumen NAS...")

        try:
            run(compose_cmd(nas, "up", "-d", "--force-recreate", "mediaserver-api"))
            last_nas = nas
            print(f"[WATCH] API reiniciado {'con' if nas else 'sin'} NAS")
        except subprocess.CalledProcessError:
            print("[WATCH] Error al reiniciar API, reintentando en el siguiente ciclo")


def main():
    if "--volumes" in sys.argv or "-v" in sys.argv:
        print("[ERROR] No uses -v/--volumes, borraría la base de datos.")
        print("        Para borrar la BD: docker volume rm webmultimediaserver_sqlserver-data")
        sys.exit(1)

    if sys.argv[1:] == ["watch"]:
        watch()
        return

    nas = is_nas_available()
    print("[OK] NAS disponible -> montaje incluido" if nas else "[WARN] NAS no disponible -> sin montajes de red")

    try:
        run(compose_cmd(nas, *sys.argv[1:]))
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)


if __name__ == "__main__":
    main()
