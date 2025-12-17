from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional

import numpy as np

from .recognizer import FaceRecognizer, match_gallery
from .utils import quality_score, now_iso, estimate_head_pose_deg, pose_label
from .backend_client import BackendClient
from .camera_runtime import CameraRuntime


@dataclass
class EnrollConfig:
    angles: List[str] = field(default_factory=lambda: ["front", "left", "right"])
    samples_per_angle: int = 5
    min_quality_score: float = 35.0
    pose_required: bool = True
    # Pose thresholds (matching your utils.pose_label logic)
    yaw_left_deg: float = -18.0
    yaw_right_deg: float = 18.0
    pitch_up_deg: float = -12.0
    pitch_down_deg: float = 12.0
    tolerance_deg: float = 15.0


@dataclass
class EnrollSession:
    session_id: str
    employee_id: str
    name: str
    camera_id: str
    started_at: str
    status: str = "running"  # running|done|error|stopped
    error: Optional[str] = None

    angle_index: int = 0
    collected: Dict[str, int] = field(default_factory=dict)
    last_quality: float = 0.0
    last_pose: Optional[str] = None
    last_similarity: float = 0.0  # optional debug
    last_update_at: str = field(default_factory=now_iso)


class EnrollmentService:
    """
    Headless enrollment:
    - reads frames from CameraRuntime (already started)
    - detects face, checks pose+quality
    - collects embeddings per angle
    - pushes templates to backend via BackendClient
    """

    def __init__(self, camera_rt: CameraRuntime, use_gpu: bool = True, model_name: str = "buffalo_l", min_face_size: int = 40):
        self.camera_rt = camera_rt
        self.rec = FaceRecognizer(model_name=model_name, use_gpu=use_gpu, min_face_size=min_face_size)
        self.client = BackendClient()

        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None
        self._stop_flag = False
        self._session: Optional[EnrollSession] = None
        self.cfg = EnrollConfig()

        # storage of collected embeddings per angle
        self._embs: Dict[str, List[np.ndarray]] = {}

    def start(self, employee_id: str, name: str, camera_id: str) -> EnrollSession:
        with self._lock:
            if self._session and self._session.status == "running":
                return self._session

            self._stop_flag = False
            sid = f"enroll_{int(time.time())}"
            self._session = EnrollSession(
                session_id=sid,
                employee_id=str(employee_id),
                name=str(name),
                camera_id=str(camera_id),
                started_at=now_iso(),
                collected={a: 0 for a in self.cfg.angles},
            )
            self._embs = {a: [] for a in self.cfg.angles}

            self._thread = threading.Thread(target=self._loop, daemon=True)
            self._thread.start()
            return self._session

    def stop(self) -> bool:
        with self._lock:
            if not self._session or self._session.status != "running":
                return False
            self._stop_flag = True
            self._session.status = "stopped"
            self._session.last_update_at = now_iso()
            return True

    def status(self) -> Optional[EnrollSession]:
        with self._lock:
            return self._session

    def _loop(self):
        assert self._session is not None
        try:
            # Ensure employee exists in backend
            self.client.upsert_employee(self._session.name, self._session.employee_id)

            while True:
                with self._lock:
                    if self._stop_flag or not self._session or self._session.status != "running":
                        return
                    session = self._session
                    required_angle = self.cfg.angles[session.angle_index]

                frame = self.camera_rt.get_frame(session.camera_id)
                if frame is None:
                    time.sleep(0.05)
                    continue

                dets = self.rec.detect_and_embed(frame)
                if not dets:
                    time.sleep(0.03)
                    continue

                # pick largest face
                det = max(dets, key=lambda d: float((d.bbox[2]-d.bbox[0])*(d.bbox[3]-d.bbox[1])))

                q = quality_score(det.bbox, frame)

                # pose check
                pose_ok = True
                pose_name = None
                if self.cfg.pose_required and det.kps is not None:
                    pose = estimate_head_pose_deg(det.kps, frame.shape)
                    if pose:
                        yaw, pitch, _roll = pose
                        pose_name = pose_label(yaw, pitch, {
                            "yaw_left_deg": self.cfg.yaw_left_deg,
                            "yaw_right_deg": self.cfg.yaw_right_deg,
                            "pitch_up_deg": self.cfg.pitch_up_deg,
                            "pitch_down_deg": self.cfg.pitch_down_deg,
                            "tolerance_deg": self.cfg.tolerance_deg,
                        })
                        pose_ok = (pose_name == required_angle)

                with self._lock:
                    if not self._session or self._session.status != "running":
                        return
                    self._session.last_quality = float(q)
                    self._session.last_pose = pose_name
                    self._session.last_update_at = now_iso()

                if q < self.cfg.min_quality_score:
                    time.sleep(0.03)
                    continue
                if self.cfg.pose_required and not pose_ok:
                    time.sleep(0.03)
                    continue

                # collect embedding
                with self._lock:
                    if not self._session or self._session.status != "running":
                        return
                    self._embs[required_angle].append(det.emb)
                    self._session.collected[required_angle] = len(self._embs[required_angle])
                    self._session.last_update_at = now_iso()

                    # Move to next angle if enough samples
                    if len(self._embs[required_angle]) >= self.cfg.samples_per_angle:
                        if self._session.angle_index < len(self.cfg.angles) - 1:
                            self._session.angle_index += 1
                        else:
                            break

                time.sleep(0.08)  # don’t collect too fast

            # finalize: average embeddings per angle, push to backend
            with self._lock:
                session = self._session
                if not session or session.status != "running":
                    return

            for angle in self.cfg.angles:
                arr = np.stack(self._embs[angle], axis=0)  # (N, D)
                mean = arr.mean(axis=0).astype(np.float32)
                mean = mean / (np.linalg.norm(mean) + 1e-12)
                self.client.upsert_template(
                    employee_id=session.employee_id,
                    angle=angle,
                    embedding=mean.tolist(),
                    model_name="insightface",
                )

            with self._lock:
                if self._session:
                    self._session.status = "done"
                    self._session.last_update_at = now_iso()

        except Exception as e:
            with self._lock:
                if self._session:
                    self._session.status = "error"
                    self._session.error = str(e)
                    self._session.last_update_at = now_iso()
