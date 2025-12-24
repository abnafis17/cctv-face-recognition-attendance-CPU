from __future__ import annotations

import os
from dataclasses import dataclass
from typing import List, Tuple, Optional

import numpy as np
from insightface.app import FaceAnalysis

from .utils import l2_normalize


def _env_bool(name: str, default: bool) -> bool:
    v = str(os.getenv(name, str(int(default)))).strip().lower()
    return v in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    try:
        return int(str(os.getenv(name, str(default))).strip())
    except Exception:
        return default


def _env_str(name: str, default: str) -> str:
    return str(os.getenv(name, default)).strip()


def _pick_providers(use_gpu: bool) -> list[str]:
    """
    ORT_PROVIDER:
      - auto (default): use CUDA if USE_GPU=1 else CPU
      - cuda: force CUDA+CPU
      - tensorrt: TensorRT+CUDA+CPU
      - cpu: CPU only
    """
    ort_provider = _env_str("ORT_PROVIDER", "auto").lower()

    if ort_provider == "cpu":
        return ["CPUExecutionProvider"]

    if ort_provider == "cuda":
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]

    if ort_provider == "tensorrt":
        return ["TensorrtExecutionProvider", "CUDAExecutionProvider", "CPUExecutionProvider"]

    # auto
    if use_gpu:
        return ["CUDAExecutionProvider", "CPUExecutionProvider"]
    return ["CPUExecutionProvider"]


@dataclass
class FaceDet:
    bbox: np.ndarray
    emb: np.ndarray
    kps: Optional[np.ndarray]


class FaceRecognizer:
    def __init__(
        self,
        model_name: str = "buffalo_l",
        use_gpu: bool = True,
        min_face_size: int = 40,
        det_size: tuple[int, int] = (640, 640),
    ):
        # allow env override (but caller can still pass args)
        use_gpu = _env_bool("USE_GPU", use_gpu)
        det_n = _env_int("AI_DET_SIZE", det_size[0])
        det_size = (det_n, det_n)

        self.min_face_size = int(min_face_size)

        providers = _pick_providers(use_gpu)

        # ctx_id is used by InsightFace; keep consistent
        ctx_id = 0 if use_gpu else -1

        self.app = FaceAnalysis(name=model_name, providers=providers)
        self.app.prepare(ctx_id=ctx_id, det_size=det_size)

        print(f"[FaceRecognizer] USE_GPU={int(use_gpu)} ORT_PROVIDER={_env_str('ORT_PROVIDER','auto')} providers={providers} ctx_id={ctx_id} det_size={det_size}")

    def detect_and_embed(self, frame_bgr: np.ndarray) -> List[FaceDet]:
        faces = self.app.get(frame_bgr)
        out: List[FaceDet] = []
        for f in faces:
            bbox = f.bbox.astype(np.float32)
            w = float(bbox[2] - bbox[0])
            h = float(bbox[3] - bbox[1])
            if min(w, h) < self.min_face_size:
                continue
            emb = l2_normalize(f.embedding.astype(np.float32))
            kps = getattr(f, "kps", None)
            out.append(FaceDet(bbox=bbox, emb=emb, kps=kps))
        return out


def match_gallery(emb: np.ndarray, gallery_embs: np.ndarray) -> Tuple[int, float]:
    if gallery_embs.size == 0:
        return -1, -1.0
    sims = gallery_embs @ emb
    i = int(np.argmax(sims))
    return i, float(sims[i])
