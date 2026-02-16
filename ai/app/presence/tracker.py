from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import time

from .detector import PersonDetection


@dataclass
class PresenceTrack:
    track_id: int
    bbox: Tuple[int, int, int, int]
    first_seen_ts: float
    last_seen_ts: float
    hits: int
    conf: float

    def dwell_seconds(self, now: float) -> float:
        return max(0.0, float(now) - float(self.first_seen_ts))


@dataclass
class PresenceExit:
    track_id: int
    first_seen_ts: float
    last_seen_ts: float
    dwell_s: float


def _bbox_iou(a: Tuple[int, int, int, int], b: Tuple[int, int, int, int]) -> float:
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


class PresenceTracker:
    def __init__(
        self,
        match_iou: float = 0.30,
        max_lost_s: float = 2.0,
        min_hits: int = 1,
        max_events: int = 200,
    ) -> None:
        self.match_iou = float(match_iou)
        self.max_lost_s = float(max_lost_s)
        self.min_hits = int(max(1, min_hits))
        self.max_events = int(max(10, max_events))

        self._tracks: Dict[int, PresenceTrack] = {}
        self._next_id = 1
        self._recent_exits: List[PresenceExit] = []

    def update(
        self,
        detections: List[PersonDetection],
        *,
        now: Optional[float] = None,
        frame_shape: Optional[Tuple[int, int, int]] = None,
    ) -> List[PresenceTrack]:
        ts = time.time() if now is None else float(now)

        # Clamp detections to frame bounds when provided
        h = w = None
        if frame_shape is not None:
            h, w = int(frame_shape[0]), int(frame_shape[1])

        valid: List[Tuple[PersonDetection, Tuple[int, int, int, int]]] = []
        for d in detections:
            x1, y1, x2, y2 = d.bbox
            if w is not None and h is not None:
                x1 = max(0, min(w - 1, x1))
                y1 = max(0, min(h - 1, y1))
                x2 = max(0, min(w, x2))
                y2 = max(0, min(h, y2))
            if x2 <= x1 or y2 <= y1:
                continue
            valid.append((d, (x1, y1, x2, y2)))

        # Greedy IoU matching
        pairs: List[Tuple[float, int, int]] = []
        track_items = list(self._tracks.items())
        for det_idx, (_det, det_box) in enumerate(valid):
            for tid, tr in track_items:
                iou = _bbox_iou(tr.bbox, det_box)
                if iou >= self.match_iou:
                    pairs.append((iou, tid, det_idx))

        pairs.sort(reverse=True, key=lambda x: x[0])

        assigned_tracks = set()
        assigned_dets = set()

        for iou, tid, det_idx in pairs:
            if tid in assigned_tracks or det_idx in assigned_dets:
                continue
            assigned_tracks.add(tid)
            assigned_dets.add(det_idx)

            tr = self._tracks.get(tid)
            if tr is None:
                continue

            det, det_box = valid[det_idx]
            tr.bbox = det_box
            tr.last_seen_ts = ts
            tr.hits += 1
            tr.conf = float(det.conf)

        # New tracks for unassigned detections
        for det_idx, (det, det_box) in enumerate(valid):
            if det_idx in assigned_dets:
                continue
            tid = self._next_id
            self._next_id += 1
            self._tracks[tid] = PresenceTrack(
                track_id=tid,
                bbox=det_box,
                first_seen_ts=ts,
                last_seen_ts=ts,
                hits=1,
                conf=float(det.conf),
            )

        # Remove lost tracks
        dead: List[int] = []
        for tid, tr in self._tracks.items():
            if (ts - tr.last_seen_ts) > self.max_lost_s:
                dead.append(tid)

        for tid in dead:
            tr = self._tracks.pop(tid, None)
            if tr is None:
                continue
            self._recent_exits.append(
                PresenceExit(
                    track_id=tr.track_id,
                    first_seen_ts=tr.first_seen_ts,
                    last_seen_ts=tr.last_seen_ts,
                    dwell_s=tr.dwell_seconds(tr.last_seen_ts),
                )
            )

        if len(self._recent_exits) > self.max_events:
            self._recent_exits = self._recent_exits[-self.max_events :]

        return list(self._tracks.values())

    def active_tracks(self) -> List[PresenceTrack]:
        if self.min_hits <= 1:
            return list(self._tracks.values())
        return [t for t in self._tracks.values() if int(t.hits) >= int(self.min_hits)]

    def recent_exits(self, limit: int = 20) -> List[PresenceExit]:
        limit = max(1, min(int(limit or 20), self.max_events))
        return list(self._recent_exits[-limit:])

    def reset(self) -> None:
        self._tracks.clear()
        self._recent_exits.clear()
        self._next_id = 1
