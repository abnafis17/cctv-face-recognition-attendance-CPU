"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

import axiosInstance, { AI_HOST } from "@/config/axiosInstance";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { Camera } from "@/types";
import { getCompanyIdFromToken } from "@/lib/authStorage";
import PresenceLaptopCamera from "./PresenceLaptopCamera";

export default function PresencePage() {
  const [companyId, setCompanyId] = useState<string>("");
  const [cams, setCams] = useState<Camera[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>("");
  const [cameraActionLoading, setCameraActionLoading] = useState(false);
  const [loadingCams, setLoadingCams] = useState(false);

  const camsInFlightRef = useRef(false);

  const selectedCam = useMemo(
    () => cams.find((c) => c.id === selectedCamId) || null,
    [cams, selectedCamId]
  );

  const availableCams = useMemo(() => {
    return cams.filter((c) => !c.isActive || c.id === selectedCamId);
  }, [cams, selectedCamId]);

  const selectedCamIsActive = Boolean(selectedCam?.isActive);

  const streamUrl = useMemo(() => {
    if (!selectedCam) return "";
    return `${AI_HOST}/presence/stream/${encodeURIComponent(selectedCam.id)}`;
  }, [selectedCam]);

  const fetchCameras = useCallback(async () => {
    if (camsInFlightRef.current) return;
    camsInFlightRef.current = true;
    setLoadingCams(true);

    try {
      const response = await axiosInstance.get("/cameras");
      const list = (response?.data || []) as Camera[];
      setCams(list);

      if (selectedCamId) {
        const stillExists = list.some((c) => c.id === selectedCamId);
        if (!stillExists) setSelectedCamId("");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load cameras");
      setCams([]);
    } finally {
      camsInFlightRef.current = false;
      setLoadingCams(false);
    }
  }, [selectedCamId]);

  useEffect(() => {
    setCompanyId(getCompanyIdFromToken() || "");
  }, []);

  useEffect(() => {
    fetchCameras();
    const t = window.setInterval(fetchCameras, 4000);
    return () => window.clearInterval(t);
  }, [fetchCameras]);

  const handleCameraSelect = useCallback(
    (newId: string) => {
      const cam = cams.find((c) => c.id === newId);
      if (cam?.isActive && cam.id !== selectedCamId) {
        toast.error("Camera is active. Please select a free camera.");
        return;
      }
      setSelectedCamId(newId);
    },
    [cams, selectedCamId]
  );

  const startSelectedCamera = useCallback(async () => {
    if (!selectedCamId) return;
    setCameraActionLoading(true);
    try {
      await axiosInstance.post(`/cameras/start/${selectedCamId}`);
      await fetchCameras();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Failed to start camera");
      toast.error(msg);
    } finally {
      setCameraActionLoading(false);
    }
  }, [fetchCameras, selectedCamId]);

  const stopSelectedCamera = useCallback(async () => {
    if (!selectedCamId) return;
    setCameraActionLoading(true);
    try {
      await axiosInstance.post(`/cameras/stop/${selectedCamId}`);
      await fetchCameras();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        (error instanceof Error ? error.message : "Failed to stop camera");
      toast.error(msg);
    } finally {
      setCameraActionLoading(false);
    }
  }, [fetchCameras, selectedCamId]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Presence & Dwell</h1>
      <p className="mt-1 text-sm text-gray-500">
        YOLO person detection with dwell-time tracking (AI: {AI_HOST})
      </p>

      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
            <label className="text-xs font-medium text-gray-600">Camera</label>
            <select
              value={selectedCamId}
              onChange={(e) => handleCameraSelect(e.target.value)}
              className="text-sm outline-none bg-transparent"
              disabled={loadingCams}
            >
              <option value="">Select free camera...</option>
              {availableCams.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                  disabled={Boolean(c.isActive) && c.id !== selectedCamId}
                >
                  {c.name}
                  {c.isActive && c.id !== selectedCamId ? " (Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500">
            Only free cameras are selectable
          </div>

          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              selectedCamIsActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {selectedCamIsActive ? "ACTIVE" : "OFF"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={
                selectedCamIsActive ? stopSelectedCamera : startSelectedCamera
              }
              className={cn(
                "rounded-md border px-3 py-1 text-xs font-semibold transition",
                selectedCamIsActive
                  ? "border-red-300 bg-red-50 text-red-600"
                  : "border-green-300 bg-green-50 text-green-700"
              )}
              disabled={!selectedCamId || cameraActionLoading}
            >
              {selectedCamIsActive ? "Stop Camera" : "Start Camera"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
          <PresenceLaptopCamera companyId={companyId} />

          {selectedCam ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{selectedCam.name}</div>
                  {selectedCam.rtspUrl ? (
                    <div className="mt-1 break-all text-xs text-gray-400">
                      {selectedCam.rtspUrl}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 overflow-hidden rounded-lg border bg-gray-100">
                {selectedCamIsActive && streamUrl ? (
                  <div className="aspect-video w-full">
                    <Image
                      src={streamUrl}
                      alt="Presence stream"
                      className="h-full w-full object-cover"
                      width={1280}
                      height={720}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-sm text-gray-600">
                    Camera OFF
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center flex items-center justify-center">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Select a free camera from dropdown
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Start the camera to view its presence stream here.
                </p>
              </div>
            </div>
          )}
        </div>

        {!selectedCamId ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
            <p className="text-sm font-medium text-gray-700">
              Select a free camera to start presence monitoring
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Cameras that are active in other modules are disabled here.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
