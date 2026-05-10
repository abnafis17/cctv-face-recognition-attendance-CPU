from __future__ import annotations

import os
from pathlib import Path


def normalize_model_pack_layout(model_name: str, root: str = "~/.insightface") -> Path:
    """
    InsightFace model packs are expected at:
      ~/.insightface/models/<model_name>/*.onnx

    Some pack archives extract one level deeper instead:
      ~/.insightface/models/<model_name>/<model_name>/*.onnx

    This normalizes that layout in-place so the installed InsightFace runtime
    can discover the pack without patching site-packages.
    """
    model_dir = Path(os.path.expanduser(root)) / "models" / str(model_name)
    if not model_dir.exists() or not model_dir.is_dir():
        return model_dir

    top_level_onnx = list(model_dir.glob("*.onnx"))
    if top_level_onnx:
        return model_dir

    child_dirs = [p for p in model_dir.iterdir() if p.is_dir()]
    if len(child_dirs) != 1:
        return model_dir

    nested_dir = child_dirs[0]
    nested_onnx = list(nested_dir.glob("*.onnx"))
    if not nested_onnx:
        return model_dir

    moved_any = False
    for src in nested_dir.iterdir():
        dst = model_dir / src.name
        if dst.exists():
            continue
        src.replace(dst)
        moved_any = True

    if moved_any:
        try:
            nested_dir.rmdir()
        except OSError:
            pass

    return model_dir
