#!/usr/bin/env python3
"""Probe only. Never starts a process."""
from __future__ import annotations

import sys
import urllib.error
import urllib.request

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:4173/"


def main() -> int:
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": "pokebot-probe"})
        with urllib.request.urlopen(req, timeout=1.5) as res:
            print(f"UP {res.status}")
            return 0
    except Exception as exc:
        print(f"DOWN {type(exc).__name__}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
