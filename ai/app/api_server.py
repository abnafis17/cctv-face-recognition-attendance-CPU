from __future__ import annotations

"""
Backward-compatible FastAPI entrypoint.

The app entrypoint was moved to `app.main` during the AI server restructure.
You can still run:

    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

This file can also be run directly:

    python app/api_server.py
"""

import os
import socket
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

if __package__ in (None, ""):
    project_root = Path(__file__).resolve().parents[1]
    project_root_str = str(project_root)
    if project_root_str not in sys.path:
        sys.path.insert(0, project_root_str)
else:
    project_root = Path(__file__).resolve().parents[1]

if load_dotenv is not None:
    load_dotenv(project_root / ".env", override=True)


def _read_host_port() -> tuple[str, int]:
    host = os.getenv("AI_SERVER_HOST", os.getenv("HOST", "0.0.0.0"))
    port_raw = os.getenv("AI_SERVER_PORT", os.getenv("PORT", "8000"))

    try:
        port = int(port_raw)
    except ValueError as exc:
        raise ValueError(f"Invalid AI server port: {port_raw!r}") from exc

    return host, port


def _ensure_port_available(host: str, port: int) -> None:
    bind_host = host
    if bind_host in ("0.0.0.0", "::"):
        bind_host = "" if bind_host == "0.0.0.0" else "::"

    family = socket.AF_INET6 if ":" in bind_host else socket.AF_INET
    with socket.socket(family, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((bind_host, port))
        except OSError as exc:
            raise SystemExit(
                f"AI server port {port} is already in use. "
                "Stop the existing server first, or set AI_SERVER_PORT to another port."
            ) from exc


if __name__ == "__main__":
    _ensure_port_available(*_read_host_port())

from app.main import app, create_app  # noqa: F401


def main() -> None:
    import uvicorn

    host, port = _read_host_port()

    _ensure_port_available(host, port)
    uvicorn.run(app, host=host, port=port)


if __name__ == "__main__":
    main()
