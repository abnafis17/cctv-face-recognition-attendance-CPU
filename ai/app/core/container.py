from __future__ import annotations

import os
import threading
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from app.core.settings import (
    STREAM_TYPE_ATTENDANCE,
    STREAM_TYPE_BOX,
    STREAM_TYPE_HEADCOUNT,
    STREAM_TYPE_OT,
    env_float,
    normalize_stream_type,
    resolve_ai_path,
)

from app.runtimes.camera_runtime import CameraRuntime
from app.runtimes.attendance_runtime import AttendanceRuntime
from app.runtimes.recognition_worker import RecognitionWorker
from app.enroll2_auto.service import EnrollmentAutoService2
from app.runtimes.hls_runtime import HLSRuntime
from app.presence.runtime import PresenceRuntime
from app.presence.worker import PresenceWorker
from app.presence.clients import PresenceStreamClients


class StreamClientManager:
    """
    Stream viewer bookkeeping:
    - Reference counting per camera
    - Track per stream type (attendance/headcount/ot)
    - Derive active stream type hint from current viewers

    Attendance enable/disable is intentionally NOT tied to viewer count anymore.
    Recognition/attendance must continue server-side even when no browser is open.
    """

    def __init__(self, attendance_rt: AttendanceRuntime):
        self._lock = threading.Lock()
        self._rec_stream_clients: Dict[str, int] = {}
        self._rec_stream_mode_counts: Dict[str, Dict[str, int]] = {}
        self._attendance_rt = attendance_rt

    def _update_stream_type(self, camera_id: str) -> None:
        counts = self._rec_stream_mode_counts.get(camera_id)
        # Decide which type to send to backend on recognition marks.
        # Default to attendance when there are no stream viewers.
        active_type = STREAM_TYPE_ATTENDANCE
        if counts:
            if counts.get(STREAM_TYPE_ATTENDANCE, 0) > 0:
                active_type = STREAM_TYPE_ATTENDANCE
            elif counts.get(STREAM_TYPE_BOX, 0) > 0:
                active_type = STREAM_TYPE_BOX
            elif counts.get(STREAM_TYPE_HEADCOUNT, 0) > 0:
                active_type = STREAM_TYPE_HEADCOUNT
            elif counts.get(STREAM_TYPE_OT, 0) > 0:
                active_type = STREAM_TYPE_OT
        self._attendance_rt.set_stream_type(camera_id, active_type)

    def inc(self, camera_id: str, stream_type: Optional[str]) -> int:
        stream_type = normalize_stream_type(stream_type)
        with self._lock:
            self._rec_stream_clients[camera_id] = (
                self._rec_stream_clients.get(camera_id, 0) + 1
            )
            mode_counts = self._rec_stream_mode_counts.setdefault(camera_id, {})
            mode_counts[stream_type] = mode_counts.get(stream_type, 0) + 1
            self._update_stream_type(camera_id)
            return self._rec_stream_clients[camera_id]

    def dec(self, camera_id: str, stream_type: Optional[str]) -> int:
        stream_type = normalize_stream_type(stream_type)
        with self._lock:
            cur = self._rec_stream_clients.get(camera_id, 0) - 1
            if cur <= 0:
                self._rec_stream_clients.pop(camera_id, None)
                cur = 0
            else:
                self._rec_stream_clients[camera_id] = cur

            mode_counts = self._rec_stream_mode_counts.get(camera_id)
            if mode_counts:
                cnt = mode_counts.get(stream_type, 0) - 1
                if cnt <= 0:
                    mode_counts.pop(stream_type, None)
                else:
                    mode_counts[stream_type] = cnt
                if not mode_counts:
                    self._rec_stream_mode_counts.pop(camera_id, None)

            self._update_stream_type(camera_id)
            return cur


@dataclass
class ServiceContainer:
    camera_rt: CameraRuntime
    attendance_rt: AttendanceRuntime
    rec_worker: RecognitionWorker
    enroller2_auto: EnrollmentAutoService2
    hls_rt: HLSRuntime
    presence_rt: PresenceRuntime
    presence_worker: PresenceWorker
    presence_clients: PresenceStreamClients
    stream_clients: StreamClientManager = field(repr=False)

    def shutdown(self) -> None:
        # Best-effort cleanup.
        try:
            self.enroller2_auto.stop()
        except Exception:
            pass

        try:
            self.rec_worker.stop_all()
        except Exception:
            pass

        try:
            self.presence_worker.stop_all()
        except Exception:
            pass

        try:
            self.hls_rt.stop_all()
        except Exception:
            pass

        try:
            self.camera_rt.stop_all()
        except Exception:
            pass

        try:
            self.attendance_rt.shutdown()
        except Exception:
            pass

        try:
            self.presence_rt.reset_all()
        except Exception:
            pass


def _load_config() -> Dict[str, Any]:
    config_path = resolve_ai_path("config.yaml")
    if not config_path or not os.path.exists(config_path):
        return {}

    try:
        import yaml

        with open(config_path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    except Exception as exc:
        print(f"[container] config load failed path={config_path}: {exc}")
        return {}

    return data if isinstance(data, dict) else {}


def _section(config: Dict[str, Any], name: str) -> Dict[str, Any]:
    value = config.get(name)
    return value if isinstance(value, dict) else {}


def _as_bool(value: Any, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    return default


def _env_bool(name: str, default: bool) -> bool:
    return _as_bool(os.getenv(name), default)


def _env_int(name: str, default: int) -> int:
    try:
        return int(float(str(os.getenv(name, str(default))).strip()))
    except Exception:
        return default


def _as_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except Exception:
        return default


def _as_int(value: Any, default: int) -> int:
    try:
        return int(float(value))
    except Exception:
        return default


def build_container() -> ServiceContainer:
    config = _load_config()
    runtime_cfg = _section(config, "runtime")
    recognition_cfg = _section(config, "recognition")
    attendance_cfg = _section(config, "attendance")

    use_gpu = _env_bool("USE_GPU", _as_bool(runtime_cfg.get("use_gpu"), False))
    model_name = os.getenv(
        "AI_MODEL_NAME",
        str(recognition_cfg.get("model_name") or "buffalo_m"),
    )
    similarity_threshold = env_float(
        "SIMILARITY_THRESHOLD",
        _as_float(recognition_cfg.get("similarity_threshold"), 0.35),
    )
    gallery_refresh_s = env_float(
        "GALLERY_REFRESH_SECONDS",
        _as_float(recognition_cfg.get("gallery_refresh_s"), 5.0),
    )
    cooldown_s = _env_int(
        "ATTENDANCE_COOLDOWN_SECONDS",
        _as_int(attendance_cfg.get("cooldown_seconds"), 60),
    )
    stable_hits_required = _env_int(
        "STABLE_ID_CONFIRMATIONS",
        _as_int(attendance_cfg.get("stable_hits_required"), 3),
    )

    camera_rt = CameraRuntime()

    attendance_rt = AttendanceRuntime(
        use_gpu=use_gpu,
        model_name=model_name,
        similarity_threshold=similarity_threshold,
        gallery_refresh_s=gallery_refresh_s,
        cooldown_s=cooldown_s,
        stable_hits_required=stable_hits_required,
    )

    rec_worker = RecognitionWorker(camera_rt=camera_rt, attendance_rt=attendance_rt)
    enroller2_auto = EnrollmentAutoService2(camera_rt=camera_rt)

    hls_rt = HLSRuntime()

    stream_clients = StreamClientManager(attendance_rt=attendance_rt)

    presence_rt = PresenceRuntime()
    presence_worker = PresenceWorker(camera_rt=camera_rt, presence_rt=presence_rt)
    presence_clients = PresenceStreamClients()

    return ServiceContainer(
        camera_rt=camera_rt,
        attendance_rt=attendance_rt,
        rec_worker=rec_worker,
        enroller2_auto=enroller2_auto,
        hls_rt=hls_rt,
        presence_rt=presence_rt,
        presence_worker=presence_worker,
        presence_clients=presence_clients,
        stream_clients=stream_clients,
    )
