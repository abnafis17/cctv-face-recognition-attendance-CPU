from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable


_WARMED = False


def _env_bool(name: str, default: bool) -> bool:
    v = str(os.getenv(name, str(int(default)))).strip().lower()
    return v in ("1", "true", "yes", "on")


def _env_str(name: str, default: str) -> str:
    return str(os.getenv(name, default)).strip()


def _candidate_models() -> Iterable[Path]:
    explicit = _env_str("INSIGHTFACE_CUDA_WARMUP_ONNX", "")
    if explicit:
        yield Path(explicit).expanduser()

    model_name = _env_str("INSIGHTFACE_MODEL", _env_str("FACE_MODEL", "buffalo_m"))
    root = Path(_env_str("INSIGHTFACE_ROOT", "~/.insightface")).expanduser()
    model_dir = root / "models" / model_name

    yield model_dir / "det_2.5g.onnx"
    yield model_dir / "w600k_r50.onnx"

    models_root = root / "models"
    yield from sorted(models_root.glob("*/det*.onnx"))
    yield from sorted(models_root.glob("*/*.onnx"))


def warmup_ort_cuda_before_insightface_import() -> None:
    """
    On this Jetson/ORT build, importing insightface before the first CUDA
    InferenceSession can make cuDNN handle creation fail. A tiny ORT CUDA
    warmup before insightface is imported keeps CUDA startup stable.
    """
    global _WARMED
    if _WARMED:
        return
    _WARMED = True

    if not _env_bool("USE_GPU", True):
        return

    ort_provider = _env_str("ORT_PROVIDER", "auto").lower()
    if ort_provider == "cpu" or _env_bool("INSIGHTFACE_CUDA_WARMUP_DISABLE", False):
        return

    try:
        import onnxruntime as ort
    except Exception:
        return

    if "CUDAExecutionProvider" not in ort.get_available_providers():
        return

    for model_path in _candidate_models():
        if not model_path.is_file():
            continue
        try:
            sess = ort.InferenceSession(
                str(model_path),
                providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
            )
            del sess
            print(f"[ORT] CUDA warmup ok: {model_path}")
            return
        except Exception as exc:
            print(f"[ORT] CUDA warmup failed for {model_path}: {exc}")
            return
