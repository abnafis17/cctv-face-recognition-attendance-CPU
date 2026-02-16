from __future__ import annotations

import threading
import time
from typing import Dict, Optional, Tuple

import cv2
from app.runtimes.camera_runtime import CameraRuntime

from .runtime import PresenceRuntime


class PresenceWorker:
    """
    Background presence worker per camera:
    - reads latest frame from CameraRuntime
    - runs YOLO person detection + dwell tracking at capped ai_fps
    - stores latest annotated frame + pre-encoded JPEG + stats
    """

    def __init__(self, camera_rt: CameraRuntime, presence_rt: PresenceRuntime) -> None:
        self.camera_rt = camera_rt
        self.presence_rt = presence_rt

        self._threads: Dict[str, threading.Thread] = {}
        self._running: Dict[str, bool] = {}
        self._locks: Dict[str, threading.Lock] = {}
        self._ai_fps: Dict[str, float] = {}

        self._latest_frame: Dict[str, np.ndarray] = {}
        self._latest_jpg: Dict[str, Tuple[bytes, float]] = {}
        self._latest_stats: Dict[str, Dict[str, object]] = {}

    def start(self, camera_id: str, ai_fps: float = 8.0) -> bool:
        if self._running.get(camera_id):
            self._ai_fps[camera_id] = float(ai_fps)
            return False

        self._running[camera_id] = True
        self._ai_fps[camera_id] = float(ai_fps)
        self._locks.setdefault(camera_id, threading.Lock())

        t = threading.Thread(target=self._loop, args=(camera_id,), daemon=True)
        self._threads[camera_id] = t
        t.start()
        return True

    def is_running(self, camera_id: str) -> bool:
        return bool(self._running.get(camera_id))

    def stop(self, camera_id: str) -> bool:
        was_running = bool(self._running.get(camera_id) or self._threads.get(camera_id))
        self._running[camera_id] = False
        t = self._threads.get(camera_id)
        if t:
            t.join(timeout=1.0)

        self._threads.pop(camera_id, None)
        self._ai_fps.pop(camera_id, None)

        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            self._latest_frame.pop(camera_id, None)
            self._latest_jpg.pop(camera_id, None)
            self._latest_stats.pop(camera_id, None)

        self.presence_rt.reset_camera(camera_id)
        return was_running

    def stop_all(self) -> None:
        for camera_id in list(self._threads.keys()):
            try:
                self.stop(camera_id)
            except Exception:
                pass

    def get_latest_jpeg(self, camera_id: str) -> Optional[bytes]:
        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            item = self._latest_jpg.get(camera_id)
            return None if item is None else item[0]

    def get_latest_stats(self, camera_id: str) -> Optional[Dict[str, object]]:
        lock = self._locks.setdefault(camera_id, threading.Lock())
        with lock:
            return self._latest_stats.get(camera_id)

    def _loop(self, camera_id: str) -> None:
        last_t = 0.0

        while self._running.get(camera_id, False):
            ai_fps = max(0.5, float(self._ai_fps.get(camera_id, 8.0)))
            period = 1.0 / ai_fps

            now = time.time()
            if (now - last_t) < period:
                time.sleep(0.005)
                continue
            last_t = now

            frame = self.camera_rt.get_frame(camera_id)
            if frame is None:
                continue

            try:
                annotated, stats = self.presence_rt.process_frame(frame, camera_id=camera_id)
            except Exception as e:
                print(f"[PRESENCE] process_frame failed cam={camera_id}: {e}")
                continue

            ok, jpg = cv2.imencode(".jpg", annotated, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
            if not ok:
                continue

            jpg_bytes = jpg.tobytes()

            lock = self._locks.setdefault(camera_id, threading.Lock())
            with lock:
                self._latest_frame[camera_id] = annotated
                self._latest_jpg[camera_id] = (jpg_bytes, time.time())
                self._latest_stats[camera_id] = stats
