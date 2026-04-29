#!/usr/bin/env python3
"""
Despliega la aplicación en producción:
  1. Para el docker compose en nas-madera (SSH)
  2. Copia el código fuente a Z:\\Otros\\MyHomeMediaServer
  3. Relanza el docker compose en producción (SSH)

Uso:
  python deploy-prod.py              # Deploy completo
  python deploy-prod.py --skip-stop  # Omite parar Docker (si ya está parado)
  python deploy-prod.py --yes        # Sin confirmación interactiva

Prerequisito (una sola vez) — configurar clave SSH sin contraseña:
  ssh-keygen -t ed25519 -C "deploy"
  type %USERPROFILE%\\.ssh\\id_ed25519.pub | ssh jose@nas-madera "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
"""

import os
import subprocess
import sys

# --- Configuracion ---
SSH_HOST        = "jose@nas-madera"
DEST_WIN_PATH   = r"Z:\Otros\MyHomeMediaServer"
PROD_LINUX_PATH = "/mnt/Otros/MyHomeMediaServer"
# ---------------------

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))

EXCLUDE_DIRS = [
    ".git", "node_modules", ".data", ".engram", ".claude",
    ".agents", "bin", "obj", "Debug", "Release", "Logs", "artifacts",
]

EXCLUDE_FILES = [
    ".env",
    "docker-compose.override.yml",
    "docker-compose.nas.yml",
    "*.nupkg",
    "*.snupkg",
    "project.lock.json",
]


def abort(msg: str) -> None:
    print(f"\n[ERROR] {msg}", file=sys.stderr)
    sys.exit(1)


def check_dest_accessible() -> None:
    print(f"[CHECK] Verificando acceso a {DEST_WIN_PATH}...")
    if not os.path.isdir(DEST_WIN_PATH):
        abort(
            f"El destino '{DEST_WIN_PATH}' no existe o no es accesible.\n"
            "       Asegúrate de que Z:\\ está montado antes de continuar."
        )
    # Prueba de escritura
    test_file = os.path.join(DEST_WIN_PATH, ".deploy_write_test")
    try:
        with open(test_file, "w") as f:
            f.write("ok")
        os.remove(test_file)
    except OSError as e:
        abort(f"No se puede escribir en '{DEST_WIN_PATH}': {e}")
    print("[OK]    Destino accesible.")


def check_ssh() -> None:
    print(f"[CHECK] Verificando SSH sin contraseña a {SSH_HOST}...")
    result = subprocess.run(
        ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=5",
         SSH_HOST, "echo ok"],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(
            "\n[ERROR] SSH requiere contraseña o no está configurado.\n"
            "        Configura la clave SSH con estos comandos (una sola vez):\n\n"
            "          ssh-keygen -t ed25519 -C \"deploy\"\n"
            "          type %USERPROFILE%\\.ssh\\id_ed25519.pub | "
            f"ssh {SSH_HOST} \"mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys\"\n",
            file=sys.stderr
        )
        sys.exit(1)
    print("[OK]    SSH sin contraseña funciona.")


def ssh_run(cmd: str, log_file: str | None = None, tail_lines: int = 30) -> None:
    full_cmd = f"cd {PROD_LINUX_PATH} && {cmd}"
    print(f"[SSH]   {SSH_HOST}: {cmd}")

    if log_file is None:
        subprocess.run(["ssh", SSH_HOST, full_cmd], check=True)
        return

    # Captura salida en fichero y muestra solo las últimas líneas
    log_path = os.path.join(REPO_ROOT, log_file)
    print(f"        Log completo en: {log_path}")
    with open(log_path, "wb") as f:
        result = subprocess.run(
            ["ssh", SSH_HOST, full_cmd],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT
        )
        f.write(result.stdout)

    # Mostrar solo las últimas líneas
    lines = result.stdout.decode("utf-8", errors="replace").splitlines()
    print(f"\n--- Últimas {min(tail_lines, len(lines))} líneas ---")
    for line in lines[-tail_lines:]:
        print(line)
    print("---\n")

    if result.returncode != 0:
        raise subprocess.CalledProcessError(result.returncode, full_cmd)


def copy_sources() -> None:
    print(f"\n[COPY]  {REPO_ROOT}  ->  {DEST_WIN_PATH}")

    xd = " ".join(EXCLUDE_DIRS)
    xf = " ".join(EXCLUDE_FILES)

    cmd = [
        "robocopy",
        REPO_ROOT,
        DEST_WIN_PATH,
        "/E",           # subdirectorios incluyendo vacíos
        "/NP",          # sin barra de progreso
        "/NDL",         # sin listado de directorios
        "/NFL",         # sin listado de ficheros (output mucho más corto)
        "/NJH",         # sin cabecera del job
        "/NJS",         # sin resumen del job
        "/XD", *EXCLUDE_DIRS,
        "/XF", *EXCLUDE_FILES,
    ]

    print(f"        Excluyendo dirs : {xd}")
    print(f"        Excluyendo files: {xf}")

    result = subprocess.run(cmd, capture_output=True, text=True)
    # robocopy devuelve 0-7 en éxito (bit flags de ficheros copiados/extra/etc.)
    if result.returncode >= 8:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        abort(f"robocopy terminó con código {result.returncode} (error de copia).")
    print("[OK]    Copia completada.")


def confirm(skip_stop: bool) -> None:
    print("\n--- Resumen del deploy ---")
    if not skip_stop:
        print(f"  1. Parar Docker en produccion  ({SSH_HOST})")
    else:
        print("  1. [omitido] Parar Docker  (--skip-stop)")
    print(f"  2. Copiar fuentes -> {DEST_WIN_PATH}")
    print(f"  3. Relanzar Docker en produccion ({SSH_HOST})")
    print("--------------------------\n")
    resp = input("¿Continuar? [s/N] ").strip().lower()
    if resp not in ("s", "si", "sí", "y", "yes"):
        print("Cancelado.")
        sys.exit(0)


def main() -> None:
    args = sys.argv[1:]

    if "--volumes" in args or "-v" in args:
        abort("No uses -v/--volumes, borraría la base de datos.")

    skip_stop = "--skip-stop" in args
    auto_yes  = "--yes" in args

    check_dest_accessible()
    check_ssh()

    if not auto_yes:
        confirm(skip_stop)

    if not skip_stop:
        print("\n[STEP 1/3] Parando producción...")
        ssh_run("python3 docker-start.py --prod down")
    else:
        print("\n[STEP 1/3] Omitido (--skip-stop).")

    print("\n[STEP 2/3] Copiando fuentes...")
    copy_sources()

    print("\n[STEP 3/3] Relanzando producción...")
    ssh_run("python3 docker-start.py --prod up --build -d", log_file="deploy-prod.log")

    print("\n[DONE]  Deploy completado.")


if __name__ == "__main__":
    main()
