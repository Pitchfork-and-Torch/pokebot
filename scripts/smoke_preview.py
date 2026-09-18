#!/usr/bin/env python3
from __future__ import annotations

import re
import sys
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4173/"


def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "pokebot-smoke"})
    with urllib.request.urlopen(req, timeout=3) as res:
        return res.read().decode("utf-8", "replace")


def main() -> int:
    html = get(BASE)
    if "PokeBot" not in html and "POKEBOT" not in html:
        print("FAIL html missing PokeBot")
        return 1
    match = re.search(r'src="(/assets/[^"]+)"', html)
    if not match:
        print("FAIL no script")
        return 1
    js = get(BASE.rstrip("/") + match.group(1))
    needles = ["CATCH", "WATCH", "SKIP", "Lead Sprayer", "account health", "never-list", "File of record", "Kill the clock"]
    missing = [n for n in needles if n not in js]
    if missing:
        print("FAIL js missing", missing)
        return 1
    print("SMOKE_OK", match.group(1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
