from __future__ import annotations

import collections
import threading
import time
import os
from typing import Deque, Dict, Optional, Tuple

import cv2
import numpy as np

from .camera_runtime import CameraRuntime
from .attendance_runtime import AttendanceRuntime


def _env_float(name: str, default: float) -> float:
    try:
        return float(str(os.getenv(name, str(default))).strip())
    except Exception:
        return default


# How many seconds behind the monitoring stream runs (for smoothness).
# Attendance events are still fired in real-time — only the display is delayed.
_STREAM_DELAY_SECONDS = max(0.0, _env_float("STREAM_DELAY_SECONDS", 3.0))


class RecognitionWorker:
    """
    Background recognition per camera:
    - reads latest raw frame from CameraRuntime
    - runs attendance/recognition at capped ai_fps (CPU-friendly)
    - attendance events fire IMMEDIATELY (real-time)
    - stores a ring buffer of annotated JPEGs for smooth delayed streaming
    """

    def __init__(self, camera_rt: CameraRuntime, attendance_rt: AttendanceRuntime):
        self.camera_rt = camera_rt
        self.attendance_rt = attendance_rt

        self._threads: Dict[str, threading.Thread] = {}
        self._running: Dict[str, bool] = {}
        self._locks: Dict[str, threading.Lock] = {}

        # Latest annotated frame (BGR) — kept for compatibility
        self._latest_frame: Dict[str, np.ndarray] = {}

        # Latest JPEG bytes + timestamp (fallback for clients that bypass buffer)
        self._latest_jpg: Dict[str, Tuple[bytes, float]] = {}

        # Ring buffer: deque of (jpg_bytes, timestamp) tuples per camera.
        # Max size = STREAM_DELAY_SECONDS * source_fps (capped at 200 frames).
        self._frame_buffer: Dict[str, Deque[Tuple[bytes, float]]] = {}

        # Per-camera config
        self._ai_fps: Dict[str, float] = {}

    def start(self, camera_id: str, camera_name: str, ai_fps: float = 10.0):
        """
        Start recognition worker for camera if not already running.
        ai_fps controls how often recognition runs. Streaming stays smooth regardless.
        """
        if self._running.get(camera_id):
            # update fps dynamically
            self._ai_fps[camera_id] = float(ai_fps)
            return

        self._running[camera_id] = True
        self._ai_fps[camera_id] = float(ai_fps)
        self._locks.setdefault(camera_id, threading.Lock())

        # Buffer size: delay_seconds * ai_fps (plus safety margin)
        buf_size = max(1, int(_STREAM_DELAY_SECONDS * ai_fps) + 20)
        self._frame_buffer[camera_id] = collections.deque(maxlen=buf_size)

        t = threading.Thread(
            target=self._loop, args=(camera_id, camera_name), daemon=True
        )
        self._threads[camera_id] = t
        t.start()

    def stop(self, camera_id: str):
        self._running[camera_id] = False
        t = self._threads.get(camera_id)
        try:
            join_timeout = float(str(os.getenv("RECOG_WORKER_STOP_JOIN_TIMEOUT_S", "0.2")).strip())
        except Exception:
            join_timeout = 0.2
        join_timeout = max(0.0, join_timeout)
        if t:
            t.join(timeout=join_timeout)

        self._threads.pop(camera_id, None)
        self._ai_fps.pop(camera_id, None)

        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            self._latest_frame.pop(camera_id, None)
            self._latest_jpg.pop(camera_id, None)
            self._frame_buffer.pop(camera_id, None)

    def stop_all(self) -> None:
        for camera_id in list(self._threads.keys()):
            try:
                self.stop(camera_id)
            except Exception:
                pass

    def get_latest_annotated(self, camera_id: str) -> Optional[np.ndarray]:
        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            f = self._latest_frame.get(camera_id)
            return None if f is None else f.copy()

    def get_latest_jpeg(self, camera_id: str) -> Optional[bytes]:
        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            item = self._latest_jpg.get(camera_id)
            return None if item is None else item[0]

    def get_latest_jpeg_item(self, camera_id: str) -> Optional[Tuple[bytes, float]]:
        """
        Returns the frame that is exactly STREAM_DELAY_SECONDS old.
        If no frame is old enough, it returns the latest to keep the screen alive.
        """
        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            buf = self._frame_buffer.get(camera_id)
            now = time.time()
            target_ts = now - _STREAM_DELAY_SECONDS
            
            if buf and len(buf) > 0:
                # Find the frame closest to 3 seconds ago
                # Since frames are appended chronologically, we look from the left
                best_frame = None
                while len(buf) > 1 and buf[1][1] <= target_ts:
                    buf.popleft() # Discard frames older than our target window
                
                best_frame = buf[0]
                # Only use it if it's actually within a reasonable range of our target
                if best_frame[1] <= target_ts:
                    return (best_frame[0], float(best_frame[1]))
            
            # If buffer is empty or not yet reached the delay, serve latest
            item = self._latest_jpg.get(camera_id)
            return None if item is None else (item[0], float(item[1]))

    def _loop(self, camera_id: str, camera_name: str):
        last_t = 0.0

        while self._running.get(camera_id, False):
            ai_fps = max(0.5, float(self._ai_fps.get(camera_id, 10.0)))
            period = 1.0 / ai_fps

            now = time.time()
            if (now - last_t) < period:
                time.sleep(0.005)
                continue
            last_t = now

            frame = self.camera_rt.get_frame(camera_id, copy=False)
            if frame is None:
                continue

            # Heavy AI work — attendance is marked HERE in real-time
            try:
                annotated = self.attendance_rt.process_frame(
                    frame_bgr=frame, camera_id=camera_id, name=camera_name
                )
            except Exception:
                continue

            # Pre-encode JPEG once (huge CPU win when multiple clients watch)
            jpg_quality = int(_env_float("MJPEG_RECOGNITION_FALLBACK_JPEG_QUALITY", 70))
            ok, jpg = cv2.imencode(
                ".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), jpg_quality]
            )
            if not ok:
                continue
            jpg_bytes = jpg.tobytes()
            ts = time.time()

            lock = self._locks.setdefault(camera_id, threading.Lock())
            with lock:
                self._latest_frame[camera_id] = annotated
                self._latest_jpg[camera_id] = (jpg_bytes, ts)
                # Push to ring buffer for smooth delayed streaming
                buf = self._frame_buffer.get(camera_id)
                if buf is not None:
                    buf.append((jpg_bytes, ts))
