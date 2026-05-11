from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional, Sequence
import time

import numpy as np

from .adaptive_scheduler import AdaptiveScheduler
from .pipeline_config import Config
from .tracker_manager import Track
from .insightface_models import FaceEmbedder


@dataclass(slots=True)
class MatchResult:
    person_id: Optional[str]
    name: str
    score: float


class Recognizer:
    """
    Track-level recognizer that uses existing hooks:
      - embed_face(...) via FaceEmbedder
      - match_embedding(emb) -> (person_id,name,score)
    """

    def __init__(
        self,
        cfg: Config,
        *,
        embedder: FaceEmbedder,
        match_embedding: Callable[[np.ndarray], MatchResult],
    ):
        self.cfg = cfg
        self._embedder = embedder
        self._match_embedding = match_embedding

    @staticmethod
    def _coerce_bbox(value: object) -> Optional[tuple[int, int, int, int]]:
        if not isinstance(value, tuple) or len(value) != 4:
            return None
        try:
            x1, y1, x2, y2 = (int(value[0]), int(value[1]), int(value[2]), int(value[3]))
        except Exception:
            return None
        if x2 <= x1 or y2 <= y1:
            return None
        return (x1, y1, x2, y2)

    @staticmethod
    def _bbox_iou(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        ix1, iy1 = max(ax1, bx1), max(ay1, by1)
        ix2, iy2 = min(ax2, bx2), min(ay2, by2)
        iw = max(0, ix2 - ix1)
        ih = max(0, iy2 - iy1)
        inter = iw * ih
        area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
        area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
        union = area_a + area_b - inter + 1e-6
        return float(inter / union)

    @staticmethod
    def _bbox_center_distance(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> float:
        ax1, ay1, ax2, ay2 = a
        bx1, by1, bx2, by2 = b
        acx, acy = (ax1 + ax2) * 0.5, (ay1 + ay2) * 0.5
        bcx, bcy = (bx1 + bx2) * 0.5, (by1 + by2) * 0.5
        dx, dy = (acx - bcx), (acy - bcy)
        return float((dx * dx + dy * dy) ** 0.5)

    @staticmethod
    def _expand_box(
        box: tuple[int, int, int, int],
        frame_w: int,
        frame_h: int,
        scale: float,
    ) -> Optional[tuple[int, int, int, int]]:
        x1, y1, x2, y2 = box
        w = max(1.0, float(x2 - x1))
        h = max(1.0, float(y2 - y1))
        cx = (float(x1) + float(x2)) * 0.5
        cy = (float(y1) + float(y2)) * 0.5

        scaled_w = max(1.0, w * float(max(1.0, scale)))
        scaled_h = max(1.0, h * float(max(1.0, scale)))

        nx1 = int(round(max(0.0, cx - scaled_w * 0.5)))
        ny1 = int(round(max(0.0, cy - scaled_h * 0.5)))
        nx2 = int(round(min(float(frame_w), cx + scaled_w * 0.5)))
        ny2 = int(round(min(float(frame_h), cy + scaled_h * 0.5)))
        if nx2 <= nx1 or ny2 <= ny1:
            return None
        return (nx1, ny1, nx2, ny2)

    @staticmethod
    def _is_center_inside(
        face_box: tuple[int, int, int, int],
        zone_box: tuple[int, int, int, int],
    ) -> bool:
        fx1, fy1, fx2, fy2 = face_box
        zx1, zy1, zx2, zy2 = zone_box
        cx = (fx1 + fx2) * 0.5
        cy = (fy1 + fy2) * 0.5
        return bool(zx1 <= cx <= zx2 and zy1 <= cy <= zy2)

    @staticmethod
    def _clear_identity(track: Track, *, now: float, similarity: float = 0.0) -> None:
        if track.person_id is not None:
            track.last_identity_change_ts = now
        track.person_id = None
        track.name = "Unknown"
        track.similarity = float(similarity)
        track.stable_id_hits = 0
        track.last_known_ts = 0.0
        track.last_known_bbox = None
        track.identity_hold_zone_bbox = None
        track.identity_hold_zone_ts = 0.0
        if track.unknown_since_ts <= 0.0:
            track.unknown_since_ts = now

    def update_tracks(
        self,
        frame_bgr: np.ndarray,
        tracks: Sequence[Track],
        scheduler: AdaptiveScheduler,
        *,
        now: Optional[float] = None,
    ) -> dict[str, int]:
        now = time.time() if now is None else float(now)
        frame_h, frame_w = frame_bgr.shape[:2]

        calls = 0
        unknowns = 0
        borderlines = 0

        zone_enabled = bool(getattr(self.cfg, "identity_hold_zone_enabled", True))
        zone_scale = float(max(1.0, getattr(self.cfg, "identity_hold_zone_scale", 1.6) or 1.6))
        zone_recheck_s = float(
            max(
                0.0,
                getattr(self.cfg, "identity_hold_zone_recheck_seconds", 3.5) or 3.5,
            )
        )
        stable_need = max(1, int(getattr(self.cfg, "stable_id_confirmations", 1) or 1))

        for tr in tracks:
            hold_s = float(getattr(self.cfg, "identity_hold_seconds", 0.0) or 0.0)
            last_known_ts = float(getattr(tr, "last_known_ts", 0.0) or 0.0)
            last_det_ts = float(getattr(tr, "last_det_ts", 0.0) or 0.0)
            det_misses = int(getattr(tr, "det_misses", 0) or 0)
            hold_min_iou = float(getattr(self.cfg, "identity_hold_min_iou", 0.10) or 0.10)
            hold_max_det_misses = int(getattr(self.cfg, "identity_hold_max_det_misses", 1) or 1)
            hold_max_center_shift_ratio = float(
                getattr(self.cfg, "identity_hold_max_center_shift_ratio", 0.35) or 0.35
            )

            last_known_bbox = self._coerce_bbox(getattr(tr, "last_known_bbox", None))
            cur_bbox = self._coerce_bbox(getattr(tr, "bbox", None))
            hold_zone_bbox = self._coerce_bbox(getattr(tr, "identity_hold_zone_bbox", None))
            if not zone_enabled and hold_zone_bbox is not None:
                tr.identity_hold_zone_bbox = None
                tr.identity_hold_zone_ts = 0.0
                hold_zone_bbox = None

            if (
                zone_enabled
                and hold_zone_bbox is None
                and last_known_bbox is not None
                and frame_w > 0
                and frame_h > 0
            ):
                hold_zone_bbox = self._expand_box(last_known_bbox, frame_w, frame_h, zone_scale)
                tr.identity_hold_zone_bbox = hold_zone_bbox
                tr.identity_hold_zone_ts = now if hold_zone_bbox is not None else 0.0

            stable_known = (
                tr.person_id is not None
                and int(getattr(tr, "stable_id_hits", 0) or 0) >= stable_need
            )
            inside_hold_zone = bool(
                zone_enabled
                and cur_bbox is not None
                and hold_zone_bbox is not None
                and self._is_center_inside(cur_bbox, hold_zone_bbox)
            )
            if zone_enabled and stable_known and not inside_hold_zone and not tr.verify_target_id:
                scheduler.force_burst("hold_zone_exit", now=now)
                tr.force_recognition_until_ts = max(
                    tr.force_recognition_until_ts,
                    now + max(0.8, float(self.cfg.embed_refresh_seconds) * 3.0),
                )

            if not scheduler.should_run_recognition(tr, now=now):
                continue

            bbox_iou = 0.0
            center_shift_ok = True
            if (
                last_known_bbox is not None
                and cur_bbox is not None
            ):
                try:
                    bbox_iou = self._bbox_iou(cur_bbox, last_known_bbox)
                    center_shift = self._bbox_center_distance(cur_bbox, last_known_bbox)
                    cx1, cy1, cx2, cy2 = cur_bbox
                    kx1, ky1, kx2, ky2 = last_known_bbox
                    max_dim = float(
                        max(
                            1,
                            cx2 - cx1,
                            cy2 - cy1,
                            kx2 - kx1,
                            ky2 - ky1,
                        )
                    )
                    center_shift_ok = center_shift <= (hold_max_center_shift_ratio * max_dim)
                except Exception:
                    bbox_iou = 0.0
                    center_shift_ok = False

            det_age = (now - last_det_ts) if last_det_ts > 0 else 1e9
            base_hold_ok = (
                hold_s > 0.0
                and (now - last_known_ts) <= hold_s
                and det_misses <= hold_max_det_misses
                and det_age <= min(hold_s, 1.25)
                and (last_known_bbox is None or bbox_iou >= hold_min_iou)
                and center_shift_ok
            )
            zone_hold_ok = (
                zone_enabled
                and stable_known
                and inside_hold_zone
                and det_misses
                <= int(getattr(self.cfg, "track_max_det_misses_known", hold_max_det_misses) or hold_max_det_misses)
                and det_age <= max(0.8, zone_recheck_s if zone_recheck_s > 0.0 else 0.8)
            )
            hold_ok = bool(base_hold_ok or zone_hold_ok)

            if zone_enabled and stable_known and inside_hold_zone and not tr.verify_target_id:
                force_until = float(getattr(tr, "force_recognition_until_ts", 0.0) or 0.0)
                last_embed_ts = float(getattr(tr, "last_embed_ts", 0.0) or 0.0)
                recheck_due = False
                if zone_recheck_s > 0.0:
                    recheck_due = (last_embed_ts <= 0.0) or ((now - last_embed_ts) >= zone_recheck_s)
                if now >= force_until and not recheck_due:
                    # Keep stable identity while face remains inside expanded hold zone.
                    continue

            kps = tr.kps
            kps_max_age = float(getattr(self.cfg, "kps_max_age_seconds", 0.0) or 0.0)
            if kps_max_age > 0.0 and det_age > kps_max_age:
                kps = None

            emb = self._embedder.embed(frame_bgr, bbox=tr.bbox, kps=kps)
            tr.last_embed_ts = now
            calls += 1

            if emb is None:
                # During fast movement/blur, aligned crop can fail. Keep a recent known identity
                # briefly to reduce flicker while we try again on the next frame.
                if tr.person_id is not None and hold_ok:
                    tr.similarity = 0.0
                    tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + 0.45)
                else:
                    self._clear_identity(tr, now=now, similarity=0.0)
                    unknowns += 1
                continue

            m = self._match_embedding(emb)
            score = float(m.score)
            new_id = str(m.person_id) if m.person_id is not None else None

            strict_thr = float(
                max(
                    float(self.cfg.similarity_threshold),
                    float(getattr(self.cfg, "strict_similarity_threshold", self.cfg.similarity_threshold)),
                )
            )
            is_new_or_flip = (
                new_id is not None and (tr.person_id is None or tr.person_id != new_id)
            )
            accept_thr = strict_thr if is_new_or_flip else float(self.cfg.similarity_threshold)

            # borderline around decision threshold => burst to disambiguate
            if abs(score - float(self.cfg.similarity_threshold)) <= float(self.cfg.borderline_margin):
                # For already-stable known tracks, prefer a recognition-only recheck instead of
                # forcing GPU detection into BURST (keeps GPU cool when the same person is present).
                stable_known = (
                    tr.person_id is not None
                    and int(getattr(tr, "stable_id_hits", 0) or 0) >= int(self.cfg.stable_id_confirmations)
                )
                if not stable_known:
                    scheduler.force_burst("borderline", now=now)
                tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + self.cfg.burst_seconds)
                borderlines += 1

            if new_id is None or score < accept_thr:
                # If we had a confident identity very recently, keep it briefly even if the
                # current embedding is low-confidence (motion blur / partial face).
                if tr.person_id is not None and hold_ok:
                    tr.similarity = score
                    tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + 0.45)
                    continue

                self._clear_identity(tr, now=now, similarity=score)
                unknowns += 1

                if (now - tr.unknown_since_ts) >= float(self.cfg.unknown_burst_after_seconds):
                    scheduler.force_burst("unknown_persist", now=now)
                    tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + self.cfg.burst_seconds)
                continue

            # Known
            if tr.person_id is not None and tr.person_id != new_id:
                # Avoid rapid flips during movement. Only accept a new id if it is clearly
                # above threshold+margin; otherwise show Unknown (never keep the old name).
                if score < float(self.cfg.similarity_threshold + self.cfg.borderline_margin):
                    scheduler.force_burst("identity_flip", now=now)
                    tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + self.cfg.burst_seconds)
                    self._clear_identity(tr, now=now, similarity=score)
                    continue

                scheduler.force_burst("identity_flip", now=now)
                tr.force_recognition_until_ts = max(tr.force_recognition_until_ts, now + self.cfg.burst_seconds)
                tr.last_identity_change_ts = now
                tr.stable_id_hits = 0

            if tr.person_id == new_id:
                tr.stable_id_hits = int(tr.stable_id_hits) + 1
            else:
                tr.last_identity_change_ts = now
                tr.stable_id_hits = 1

            tr.person_id = new_id
            tr.name = str(m.name or new_id)
            tr.similarity = score
            tr.unknown_since_ts = 0.0
            tr.last_known_ts = now
            tr.last_known_bbox = cur_bbox if cur_bbox is not None else tr.bbox
            known_box = self._coerce_bbox(tr.last_known_bbox)
            if zone_enabled and known_box is not None and frame_w > 0 and frame_h > 0:
                tr.identity_hold_zone_bbox = self._expand_box(known_box, frame_w, frame_h, zone_scale)
                tr.identity_hold_zone_ts = now if tr.identity_hold_zone_bbox is not None else 0.0
            else:
                tr.identity_hold_zone_bbox = None
                tr.identity_hold_zone_ts = 0.0

        return {"recognition_calls": calls, "unknown_tracks": unknowns, "borderline_tracks": borderlines}
