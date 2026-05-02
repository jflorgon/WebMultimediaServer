#!/usr/bin/env python3
"""
Empaqueta la SPA como widget Tizen (.wgt) instalable en TVs Samsung.

Uso:
  python scripts/build-tizen.py --profile <NombrePerfil>
  python scripts/build-tizen.py --profile MyTV --api-url http://192.168.1.50:5001/api

Requiere:
  - Tizen Studio CLI instalado (por defecto en C:\\tizen-studio).
  - Un perfil de seguridad activo en Certificate Manager.
  - .env.tizen configurado con VITE_API_URL (o pasar --api-url).
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
DEFAULT_TIZEN_CLI = r"C:\tizen-studio\tools\ide\bin\tizen.bat"


def run(cmd, cwd=None):
    print(f">>> {' '.join(str(c) for c in cmd)}")
    result = subprocess.run(cmd, cwd=cwd, shell=False)
    if result.returncode != 0:
        sys.exit(f"Comando falló (exit {result.returncode})")


def write_local_env(api_url: str):
    env_local = ROOT / ".env.tizen.local"
    env_local.write_text(
        f"VITE_API_URL={api_url}\nVITE_TIZEN=true\n",
        encoding="utf-8",
    )
    print(f"Escrito {env_local} con VITE_API_URL={api_url}")


def copy_tizen_assets():
    config_xml = TIZEN_DIR / "config.xml"
    icon_png = TIZEN_DIR / "icon.png"
    if not config_xml.exists() or not icon_png.exists():
        sys.exit(f"Faltan tizen/config.xml o tizen/icon.png en {TIZEN_DIR}")
    shutil.copy2(config_xml, DIST / "config.xml")
    shutil.copy2(icon_png, DIST / "icon.png")
    print(f"Copiados config.xml e icon.png a {DIST}")


def find_wgt() -> Path:
    wgts = list(DIST.glob("*.wgt"))
    if not wgts:
        sys.exit(f"No se encontró ningún .wgt en {DIST}")
    return max(wgts, key=lambda p: p.stat().st_mtime)


def main():
    parser = argparse.ArgumentParser(description="Empaqueta MediaServerFront como widget Tizen")
    parser.add_argument("--profile", required=True, help="Nombre del perfil de seguridad de Tizen")
    parser.add_argument("--api-url", help="Sobrescribe VITE_API_URL para esta build")
    parser.add_argument("--tizen-cli", default=DEFAULT_TIZEN_CLI, help="Ruta a tizen.bat")
    args = parser.parse_args()

    tizen_cli = Path(args.tizen_cli)
    if not tizen_cli.exists():
        sys.exit(f"No se encontró Tizen CLI en {tizen_cli}")

    if args.api_url:
        write_local_env(args.api_url)

    npm = "npm.cmd" if os.name == "nt" else "npm"
    run([npm, "run", "build:tizen"], cwd=ROOT)

    copy_tizen_assets()

    run([str(tizen_cli), "package", "-t", "wgt", "-s", args.profile, "--", str(DIST)])

    wgt = find_wgt()
    DIST_TIZEN.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    final = DIST_TIZEN / f"{wgt.stem}-{timestamp}.wgt"
    shutil.move(str(wgt), str(final))
    print(f"\n[OK] Widget generado: {final}")
    print("\nSiguiente paso (con TV en modo Developer y sdb conectado):")
    print(f'  "{tizen_cli}" install -n "{final}" -t <DeviceName>')


if __name__ == "__main__":
    main()
