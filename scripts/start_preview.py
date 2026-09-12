#!/usr/bin/env python3
"""Start dist preview with /api/identify, outside the current Windows Job Object."""
from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
RUN = ROOT / ".local-run"
BREAKAWAY = Path.home() / "HavenID" / "scripts" / "_job_breakaway.py"
HOST = "127.0.0.1"
PORT = "4173"
URL = f"http://{HOST}:{PORT}/"
IDENT = f"{URL}api/identify"


def probe_root() -> bool:
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "pokebot-probe"})
        with urllib.request.urlopen(req, timeout=1.5) as res:
            return 200 <= res.status < 300
    except Exception:
        return False


def probe_ident() -> bool:
    try:
        body = json.dumps({"url": "https://example.com/bot/x"}).encode("utf-8")
        req = urllib.request.Request(
            IDENT,
            data=body,
            method="POST",
            headers={"User-Agent": "pokebot-probe", "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=1.5) as res:
            return res.status == 400
    except urllib.error.HTTPError as exc:
        return exc.code == 400
    except Exception:
        return False


def stop_pid() -> None:
    pid_file = RUN / "preview.pid"
    if not pid_file.is_file():
        return
    try:
        pid = int(pid_file.read_text(encoding="utf-8").strip().split()[0])
    except Exception:
        return
    subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, text=True)
    try:
        pid_file.unlink()
    except OSError:
        pass


def main() -> int:
    if not (DIST / "index.html").is_file():
        print("NO_DIST  run npm run build first")
        return 2
    if probe_root() and probe_ident():
        print(f"ALREADY_UP {URL}")
        return 0
    if probe_root() and not probe_ident():
        print("STALE_STATIC  restarting with /api/identify")
        stop_pid()
    if not BREAKAWAY.is_file():
        print("NO_BREAKAWAY  refusing in-job server")
        return 3
    RUN.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(BREAKAWAY),
        "spawn",
        "--cwd",
        str(ROOT),
        "--out",
        str(RUN / "preview.out.log"),
        "--err",
        str(RUN / "preview.err.log"),
        "--pid-file",
        str(RUN / "preview.pid"),
        "--",
        sys.executable,
        str(ROOT / "scripts" / "preview_ident.py"),
    ]
    spawned = subprocess.run(cmd)
    if spawned.returncode != 0:
        return spawned.returncode
    print(f"STARTED {URL}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
