from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.api.deps import get_container
from app.core.settings import env_float
from app.streams.mjpeg import mjpeg_generator_presence

router = APIRouter()


@router.api_route("/presence/start", methods=["GET", "POST"])
def presence_start(
    camera_id: str,
    ai_fps: Optional[float] = None,
    container=Depends(get_container),
):
    if ai_fps is None:
        ai_fps = env_float("PRESENCE_AI_FPS", 8.0)

    started_now = container.presence_worker.start(camera_id, ai_fps=float(ai_fps))
    return {
        "ok": True,
        "startedNow": bool(started_now),
        "camera_id": camera_id,
        "ai_fps": float(ai_fps),
    }


@router.api_route("/presence/stop", methods=["GET", "POST"])
def presence_stop(camera_id: str, container=Depends(get_container)):
    stopped_now = container.presence_worker.stop(camera_id)
    return {
        "ok": True,
        "stoppedNow": bool(stopped_now),
        "camera_id": camera_id,
    }


@router.get("/presence/status/{camera_id}")
def presence_status(
    camera_id: str,
    auto_start: bool = Query(default=False, alias="autoStart"),
    ai_fps: Optional[float] = None,
    container=Depends(get_container),
):
    if auto_start and not container.presence_worker.is_running(camera_id):
        if ai_fps is None:
            ai_fps = env_float("PRESENCE_AI_FPS", 8.0)
        container.presence_worker.start(camera_id, ai_fps=float(ai_fps))

    stats = container.presence_worker.get_latest_stats(camera_id)

    return {
        "ok": True,
        "running": bool(container.presence_worker.is_running(camera_id)),
        "stats": stats,
    }


@router.get("/presence/stream/{camera_id}")
def presence_stream(
    camera_id: str,
    ai_fps: Optional[float] = None,
    container=Depends(get_container),
):
    if ai_fps is None:
        ai_fps = env_float("PRESENCE_AI_FPS", 8.0)

    return StreamingResponse(
        mjpeg_generator_presence(container, camera_id, ai_fps=float(ai_fps)),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "keep-alive",
        },
    )
