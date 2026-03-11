from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict
import requests

from .http_client import HttpClient


@dataclass
class ERPClientConfig:
    base_url: str
    prefix: str = ""
    timeout_s: float = 10.0
    api_version: str = "2.0"
    attendance_endpoint: str = "/Attendance/manual-attendance"


def _is_http_url(value: str) -> bool:
    v = str(value or "").strip().lower()
    return v.startswith("http://") or v.startswith("https://")


class ERPClient:
    def __init__(self, cfg: ERPClientConfig):
        # Best practice: x-api-version is its own header.
        # ERP curl shows it inside Content-Type; sending x-api-version separately works reliably.
        default_headers = {
            "accept": "*/*",
            "Content-Type": "application/json",
            "x-api-version": cfg.api_version,
        }

        self.http = HttpClient(
            base_url=cfg.base_url,
            prefix=cfg.prefix,
            timeout_s=cfg.timeout_s,
            default_headers=default_headers,
        )
        endpoint = str(cfg.attendance_endpoint or "").strip()
        if endpoint and (not _is_http_url(endpoint)) and (not endpoint.startswith("/")):
            endpoint = f"/{endpoint}"
        self._attendance_endpoint = endpoint or "/Attendance/manual-attendance"

    def manual_attendance(
        self, attendance_date: str, emp_id: str, in_time: str, in_location: str
    ) -> Any:
        payload: Dict[str, Any] = {
            "attendanceDate": attendance_date,  # "03/01/2026" (dd/mm/yyyy)
            "empId": emp_id,
            "inTime": in_time,  # "09:00:00"
            "inLocation": in_location,
        }
        endpoint = str(self._attendance_endpoint)
        if _is_http_url(endpoint):
            res: requests.Response | None = None
            try:
                res = self.http.session.post(
                    endpoint, json=payload, timeout=self.http.timeout_s
                )
                res.raise_for_status()
                return res.json()
            except requests.RequestException as e:
                if res is not None:
                    try:
                        detail: Any = res.json()
                    except Exception:
                        detail = res.text
                    raise RuntimeError(
                        f"[ERPClient] {res.status_code} {endpoint} -> {detail}"
                    ) from e
                raise RuntimeError(f"[ERPClient] Request failed -> {endpoint}") from e

        return self.http.post(endpoint, payload)
