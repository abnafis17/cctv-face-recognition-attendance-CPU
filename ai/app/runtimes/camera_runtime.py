from __future__ import annotations

from typing import Dict, Optional
import threading
import numpy as np

from ..vision.capture import FrameGrabber


class CameraRuntime:
    def __init__(self):
        # Direct RTSP cameras (existing workflow)
        self.cameras: Dict[str, FrameGrabber] = {}

        # Relay-fed cameras (agent pushes frames)
        self._relay_enabled: set[str] = set()
        self._relay_latest: Dict[str, np.ndarray] = {}

        self._lock = threading.Lock()
        self.injected_frames: Dict[str, np.ndarray] = {}
        self.injected_locks: Dict[str, threading.Lock] = {}

    def start(
        self, camera_id: str, rtsp_url: str, width: int = 1280, height: int = 720
    ) -> bool:
        """
        Idempotent start (direct mode):
        - If already running with same source, do nothing.
        - If source changed, restart.

        Relay merge behavior:
        - If camera was relay, switch it to direct by clearing relay state.

        Returns True if a start/restart happened, False if it was already running.
        """
        with self._lock:
            # If this camera was relay, remove relay state first
            if camera_id in self._relay_enabled:
                self._relay_enabled.discard(camera_id)
                self._relay_latest.pop(camera_id, None)

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

    def start_relay(self, camera_id: str) -> bool:
        """
        Relay mode start:
        - If camera is direct, stop direct capture.
        - Mark as relay-enabled (frames will be provided via push_frame()).

        Returns True if started now, False if already relay-enabled.
        """
        with self._lock:
            if camera_id in self._relay_enabled:
                return False

            # If it was direct, stop it
            existing = self.cameras.pop(camera_id, None)
            if existing:
                existing.stop()

            self._relay_enabled.add(camera_id)
            # keep any existing latest frame if already pushed earlier
            return True

    def push_frame(self, camera_id: str, frame: np.ndarray) -> None:
        """
        Used by /ws/ingest: store latest frame for relay camera.
        If camera is not direct, auto-enable relay for safety.
        """
        if frame is None:
            return

        with self._lock:
            # If camera is running in direct mode, ignore relay pushes
            if camera_id in self.cameras:
                return

            # Auto-enable relay if not enabled yet
            if camera_id not in self._relay_enabled:
                self._relay_enabled.add(camera_id)

            self._relay_latest[camera_id] = frame

    def stop(self, camera_id: str) -> bool:
        """
        Stop both direct and relay modes.
        Returns True if anything was stopped/removed, False otherwise.
        """
        stopped_any = False
        grabber: Optional[FrameGrabber] = None

        with self._lock:
            grabber = self.cameras.pop(camera_id, None)
        if not grabber:
            return False
        try:
            grabber.stop()
            return True
        except Exception as e:
            print(f"[CameraRuntime] stop failed for {camera_id}: {e}")
            return False

    def stop_all(self) -> None:
        with self._lock:
            ids = list(self.cameras.keys())
        for camera_id in ids:
            try:
                self.stop(camera_id)
            except Exception:
                pass

    def is_running(self, camera_id: str) -> bool:
        with self._lock:
            return str(camera_id) in self.cameras

    def inject_frame(self, camera_id: str, frame: np.ndarray):
        """Inject a frame from a laptop/WebRTC source."""
        if camera_id not in self.injected_locks:
            self.injected_locks[camera_id] = threading.Lock()
        with self.injected_locks[camera_id]:
            self.injected_frames[camera_id] = frame

    def get_frame(self, camera_id: str, copy: bool = True) -> Optional[np.ndarray]:
        # 1) Laptop camera (injected frames)
        lock = self.injected_locks.get(camera_id)
        if lock:
            with lock:
                frame = self.injected_frames.get(camera_id)
                if frame is not None:
                    return frame.copy() if copy else frame

        # 2) IP camera
        with self._lock:
            grabber = self.cameras.get(camera_id)
        if grabber:
            return grabber.read_latest(copy=copy)

        return None
