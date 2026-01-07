from __future__ import annotations
from typing import Dict, Optional
import threading
import cv2
import numpy as np

from ..vision.capture import FrameGrabber

class CameraRuntime:
    def __init__(self):
        self.cameras: Dict[str, FrameGrabber] = {}
        self._lock = threading.Lock()

    def start(self, camera_id: str, rtsp_url: str, width: int = 1280, height: int = 720) -> bool:
        """
        Idempotent start:
        - If already running with same source, do nothing.
        - If source changed, restart.
        Returns True if a start/restart happened, False if it was already running.
        """
        with self._lock:
            existing = self.cameras.get(camera_id)
            if existing and getattr(existing, "rtsp_url", None) == rtsp_url:
                return False

            if existing:
                existing.stop()
                self.cameras.pop(camera_id, None)

            grabber = FrameGrabber(rtsp_url, width=width, height=height)
            grabber.start()
            self.cameras[camera_id] = grabber
            return True

    def stop(self, camera_id: str) -> bool:
        with self._lock:
            grabber = self.cameras.pop(camera_id, None)
            if not grabber:
                return False
            grabber.stop()
            return True

    def get_frame(self, camera_id: str) -> Optional[np.ndarray]:
        with self._lock:
            grabber = self.cameras.get(camera_id)
        if not grabber:
            return None
        return grabber.read_latest()
