#!/usr/bin/env python3
"""
Build + uninstall + install + run de la app MediaServer en la TV Samsung Tizen.

Uso:
  python scripts/deploy-tizen.py
  python scripts/deploy-tizen.py --skip-build      # reinstala el .wgt más reciente sin rebuild
  python scripts/deploy-tizen.py --no-run          # instala sin lanzar
  python scripts/deploy-tizen.py --tv 192.168.1.42 # otra IP de TV

Defaults:
  --profile     appMediaServer
  --tv          192.168.1.105
  --app-id      MediaSrv01.MediaServer
"""

import argparse
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
DIST_TIZEN = ROOT / "dist-tizen"
TIZEN_DIR = ROOT / "tizen"
TIZEN_CLI = Path(r"C:\tizen-studio\tools\ide\bin\tizen.bat")
SDB = Path(r"C:\tizen-studio\tools\sdb.exe")


def run(cmd, check=True, capture=False):
    print(f">>> {' '.join(str(c) for c in cmd)}")
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="")
        if check and result.returncode != 0:
            sys.exit(f"Comando falló (exit {result.returncode})")
        return result
    result = subprocess.run(cmd)
    if check and result.returncode != 0:
        sys.exit(f"Comando falló (exit {result.returncode})")
    return result


def ensure_sdb_connection(tv_ip: str) -> tuple[str, str]:
    """Reconnect sdb y devuelve (serial_sdb, device_name).

    sdb usa la serial `<ip>:26101`; tizen CLI usa el device name (3a columna).
    """
    serial = f"{tv_ip}:26101"
    print(f"\n[sdb] Reiniciando server y conectando a {serial}...")
    subprocess.run([str(SDB), "kill-server"], capture_output=True)
    subprocess.run([str(SDB), "start-server"], capture_output=True)
    run([str(SDB), "connect", serial])
    devs = run([str(SDB), "devices"], capture=True)
    device_name = None
    for line in devs.stdout.splitlines():
        if line.startswith(serial):
            parts = line.split()
            if len(parts) >= 3 and parts[1] == "device":
                device_name = parts[2]
                break
    if not device_name:
        sys.exit(f"\n[sdb] La TV {serial} no aparece como `device` en `sdb devices`. Comprueba Developer Mode.")
    print(f"[sdb] OK — serial={serial}, device={device_name}")
    return serial, device_name


def build_wgt(profile: str, api_url: str | None) -> Path:
    if api_url:
        env_local = ROOT / ".env.tizen.local"
        env_local.write_text(f"VITE_API_URL={api_url}\nVITE_TIZEN=true\n", encoding="utf-8")
        print(f"[env] {env_local} => VITE_API_URL={api_url}")

    npm = "npm.cmd" if os.name == "nt" else "npm"
    run([npm, "run", "build:tizen"], )

    config_xml = TIZEN_DIR / "config.xml"
    icon_png = TIZEN_DIR / "icon.png"
    if not config_xml.exists() or not icon_png.exists():
        sys.exit(f"Faltan {config_xml} o {icon_png}")
    shutil.copy2(config_xml, DIST / "config.xml")
    shutil.copy2(icon_png, DIST / "icon.png")

    run([str(TIZEN_CLI), "package", "-t", "wgt", "-s", profile, "--", str(DIST)])

    wgts = list(DIST.glob("*.wgt"))
    if not wgts:
        sys.exit(f"No se generó ningún .wgt en {DIST}")
    wgt = max(wgts, key=lambda p: p.stat().st_mtime)
    DIST_TIZEN.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    final = DIST_TIZEN / f"{wgt.stem}-{timestamp}.wgt"
    shutil.move(str(wgt), str(final))
    print(f"\n[build] Widget generado: {final}")
    return final


def latest_wgt() -> Path:
    wgts = list(DIST_TIZEN.glob("*.wgt"))
    if not wgts:
        sys.exit(f"No hay .wgt en {DIST_TIZEN}. Ejecuta sin --skip-build primero.")
    return max(wgts, key=lambda p: p.stat().st_mtime)


def main():
    parser = argparse.ArgumentParser(description="Despliega MediaServer en TV Tizen")
    parser.add_argument("--profile", default="appMediaServer")
    parser.add_argument("--tv", default="192.168.1.105", help="IP de la TV")
    parser.add_argument("--app-id", default="MediaSrv01.MediaServer")
    parser.add_argument("--api-url", help="Sobrescribe VITE_API_URL solo para esta build")
    parser.add_argument("--skip-build", action="store_true", help="Usa el .wgt más reciente sin recompilar")
    parser.add_argument("--no-run", action="store_true", help="No lanza la app después de instalar")
    parser.add_argument("--no-uninstall", action="store_true", help="No desinstala la versión previa")
    args = parser.parse_args()

    if not TIZEN_CLI.exists():
        sys.exit(f"No se encontró Tizen CLI en {TIZEN_CLI}")
    if not SDB.exists():
        sys.exit(f"No se encontró sdb en {SDB}")

    serial, device_name = ensure_sdb_connection(args.tv)

    if args.skip_build:
        wgt = latest_wgt()
        print(f"\n[build] --skip-build: reusando {wgt.name}")
    else:
        wgt = build_wgt(args.profile, args.api_url)

    if not args.no_uninstall:
        print(f"\n[uninstall] {args.app_id}")
        run([str(TIZEN_CLI), "uninstall", "-p", args.app_id, "-t", device_name], check=False)

    print(f"\n[install] {wgt.name}")
    run([str(TIZEN_CLI), "install", "-n", str(wgt), "-t", device_name])

    if not args.no_run:
        print(f"\n[run] {args.app_id}")
        run([str(TIZEN_CLI), "run", "-p", args.app_id, "-t", device_name])

    print("\n[OK] Despliegue completado.")


if __name__ == "__main__":
    main()
