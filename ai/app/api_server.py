from __future__ import annotations

import time
import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, Response

from .camera_runtime import CameraRuntime

app = FastAPI(title="AI Camera API", version="1.1")

camera_rt = CameraRuntime()

# ---------------- Health ----------------
@app.get("/health")
def health():
    return {"status": "ok"}


# ---------------- Camera control ----------------
@app.api_route("/camera/start", methods=["GET", "POST"])
def start_camera(camera_id: str, rtsp_url: str):
    camera_rt.start(camera_id, rtsp_url)
    return {"ok": True, "camera_id": camera_id, "rtsp_url": rtsp_url}


@app.api_route("/camera/stop", methods=["GET", "POST"])
def stop_camera(camera_id: str):
    camera_rt.stop(camera_id)
    return {"ok": True, "camera_id": camera_id}


# ---------------- Snapshot (reliable fallback) ----------------
@app.get("/camera/snapshot/{camera_id}")
def camera_snapshot(camera_id: str):
    frame = camera_rt.get_frame(camera_id)
    if frame is None:
        return Response(content=b"No frame yet", status_code=503)

    ok, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not ok:
        return Response(content=b"Encode failed", status_code=500)

    return Response(content=jpg.tobytes(), media_type="image/jpeg", headers={
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
    })


# ---------------- MJPEG stream ----------------
def mjpeg_generator(camera_id: str):
    # Warmup: give grabber time to produce the first frame
    for _ in range(60):  # ~3 seconds max
        frame = camera_rt.get_frame(camera_id)
        if frame is not None:
            break
        time.sleep(0.05)

    try:
        while True:
            frame = camera_rt.get_frame(camera_id)
            if frame is None:
                time.sleep(0.05)
                continue

            ok, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            if not ok:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n"
                b"Content-Length: " + str(len(jpg)).encode() + b"\r\n\r\n" +
                jpg.tobytes() +
                b"\r\n"
            )
            # small delay prevents CPU spike on very fast webcams
            time.sleep(0.01)

    except GeneratorExit:
        # client disconnected (normal)
        return


@app.get("/camera/stream/{camera_id}")
def camera_stream(camera_id: str):
    return StreamingResponse(
        mjpeg_generator(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "keep-alive",
        },
    )
