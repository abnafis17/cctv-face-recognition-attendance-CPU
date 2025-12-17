from __future__ import annotations

import time
import cv2
from fastapi import FastAPI, Body
from fastapi.responses import StreamingResponse, Response

from .camera_runtime import CameraRuntime
from .enroll_service import EnrollmentService

app = FastAPI(title="AI Camera API", version="1.2")

# ✅ MUST be defined before using it
camera_rt = CameraRuntime()

# ✅ Now this is safe
enroller = EnrollmentService(camera_rt=camera_rt, use_gpu=False)  # set True if GPU


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


# ---------------- Snapshot (reliable) ----------------
@app.get("/camera/snapshot/{camera_id}")
def camera_snapshot(camera_id: str):
    frame = camera_rt.get_frame(camera_id)
    if frame is None:
        return Response(content=b"No frame yet", status_code=503)

    ok, jpg = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    if not ok:
        return Response(content=b"Encode failed", status_code=500)

    return Response(
        content=jpg.tobytes(),
        media_type="image/jpeg",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    )


# ---------------- MJPEG stream ----------------
def mjpeg_generator(camera_id: str):
    # warmup
    for _ in range(60):
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

            time.sleep(0.01)

    except GeneratorExit:
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


# ---------------- Enrollment (Headless, Browser-based) ----------------
@app.post("/enroll/session/start")
def enroll_session_start(payload: dict = Body(...)):
    employee_id = str(payload.get("employeeId") or "").strip()
    name = str(payload.get("name") or "").strip()
    camera_id = str(payload.get("cameraId") or "").strip()

    if not employee_id or not name or not camera_id:
        return {"ok": False, "error": "employeeId, name, cameraId are required"}

    s = enroller.start(employee_id=employee_id, name=name, camera_id=camera_id)
    return {"ok": True, "session": s.__dict__}


@app.post("/enroll/session/stop")
def enroll_session_stop():
    stopped = enroller.stop()
    s = enroller.status()
    return {"ok": True, "stopped": stopped, "session": (s.__dict__ if s else None)}


@app.get("/enroll/session/status")
def enroll_session_status():
    s = enroller.status()
    return {"ok": True, "session": (s.__dict__ if s else None)}
