#!/usr/bin/env python3
"""Static dist preview plus POST /api/identify. Allowlist x.ai / grok.com /bot/ only."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
HOST = "127.0.0.1"
PORT = 4173
ALLOW = {"x.ai", "www.x.ai", "grok.com", "www.grok.com"}
UA = "PokeBot-Field-Guide/3 identify"


def allow(url: str) -> bool:
    try:
        from urllib.parse import urlparse

        u = urlparse(url)
        host = (u.hostname or "").lower()
        path = u.path or ""
        return u.scheme in ("http", "https") and host in ALLOW and path.startswith("/bot/")
    except Exception:
        return False


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def log_message(self, fmt: str, *args: object) -> None:
        return

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        if path != "/api/identify":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._json({"error": "json"}, 400)
            return
        url = str(body.get("url") or "").strip()
        if not allow(url):
            self._json({"error": "host"}, 400)
            return
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
        try:
            with urllib.request.urlopen(req, timeout=12) as res:
                html = res.read()[:120_000].decode("utf-8", "replace")
                status = res.status
        except Exception as exc:
            self._json({"error": "fetch", "detail": type(exc).__name__}, 400)
            return
        self._json({"url": url, "html": html, "status": status}, 200)

    def _json(self, payload: dict, code: int) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main() -> int:
    if not (DIST / "index.html").is_file():
        print("NO_DIST")
        return 2
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"IDENT_PREVIEW http://{HOST}:{PORT}/", flush=True)
    httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
