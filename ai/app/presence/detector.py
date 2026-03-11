from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple
import threading

import numpy as np


@dataclass
class PersonDetection:
    bbox: Tuple[int, int, int, int]
    conf: float


class YoloPersonDetector:
    """
    YOLO-based person detector (class=person).

    Uses a single model instance with an internal lock to avoid
    concurrent access across camera threads.
    """

    def __init__(
        self,
        model_path: str,
        conf: float = 0.35,
        iou: float = 0.45,
        imgsz: int = 640,
        device: str = "cpu",
        max_det: int = 50,
    ) -> None:
        try:
            from ultralytics import YOLO  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError(
                "Ultralytics YOLO is not installed. Install 'ultralytics' (and torch) to enable presence detection."
            ) from e

        self._model = YOLO(model_path)
        self._conf = float(conf)
        self._iou = float(iou)
        self._imgsz = int(imgsz)
        self._device = str(device or "cpu")
        self._max_det = int(max_det)
        self._lock = threading.Lock()

    def detect(self, frame_bgr: np.ndarray) -> List[PersonDetection]:
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        # Ultralytics expects BGR numpy for OpenCV input. Keep it as-is.
        with self._lock:
            results = self._model.predict(
                source=frame_bgr,
                conf=self._conf,
                iou=self._iou,
                imgsz=self._imgsz,
                classes=[0],  # person
                device=self._device,
                max_det=self._max_det,
                verbose=False,
            )

        if not results:
            return []

        r0 = results[0]
        if r0.boxes is None:
            return []

        dets: List[PersonDetection] = []
        try:
            boxes = r0.boxes
            for b in boxes:
                xyxy = b.xyxy[0].tolist()
                conf = float(b.conf[0]) if b.conf is not None else 0.0
                x1, y1, x2, y2 = [int(round(v)) for v in xyxy]
                dets.append(PersonDetection(bbox=(x1, y1, x2, y2), conf=conf))
        except Exception:
            # Be tolerant to different Ultralytics box formats
            return []

        return dets


class FacePresenceDetector:
    """
    Face-only detector using InsightFace (detection module only).
    Returns face bboxes so the overlay is around faces instead of full bodies.
    """

    def __init__(
        self,
        model_name: str = "buffalo_l",
        det_size: int = 640,
        min_face_size: int = 30,
        min_det_score: float = 0.35,
        use_gpu: bool = False,
    ) -> None:
        from app.vision.insightface_models import FaceDetector

        self._detector = FaceDetector(
            model_name=str(model_name),
            use_gpu=bool(use_gpu),
            det_size=(int(det_size), int(det_size)),
            min_face_size=int(min_face_size),
            min_det_score=float(min_det_score),
        )
        self._lock = threading.Lock()

    def detect(self, frame_bgr: np.ndarray) -> List[PersonDetection]:
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        with self._lock:
            dets = self._detector.detect(frame_bgr)

        out: List[PersonDetection] = []
        for d in dets:
            x1, y1, x2, y2 = [int(round(v)) for v in d.bbox.tolist()]
            out.append(PersonDetection(bbox=(x1, y1, x2, y2), conf=float(d.det_score)))
        return out


class PresenceDetector:
    """
    Switchable presence detector: face-only (default) or person (YOLO).
    """

    def __init__(
        self,
        *,
        mode: str,
        yolo_cfg: dict,
        face_cfg: dict,
    ) -> None:
        normalized = str(mode or "face").strip().lower()
        if normalized in {"face", "faces", "face-only"}:
            self._impl = FacePresenceDetector(**face_cfg)
        elif normalized in {"person", "people", "yolo"}:
            self._impl = YoloPersonDetector(**yolo_cfg)
        else:
            raise ValueError(f"Unknown PRESENCE_DET_MODE: {mode}")

    def detect(self, frame_bgr: np.ndarray) -> List[PersonDetection]:
        return self._impl.detect(frame_bgr)
