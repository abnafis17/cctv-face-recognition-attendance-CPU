"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

import { AI_HOST } from "@/config/axiosInstance";

interface PresenceLaptopCameraProps {
  userId?: string;
  companyId?: string;
  cameraName?: string;
}

const DEFAULT_CAMERA_ID = "cmkdpsq300000j7284bwluxh2";

const PresenceLaptopCamera: React.FC<PresenceLaptopCameraProps> = ({
  userId,
  companyId,
  cameraName,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [localActive, setLocalActive] = useState(false);

  const cameraId = useMemo(() => {
    if (userId?.trim()) return userId.trim();
    if (companyId?.trim()) return `laptop-${companyId.trim()}`;
    return DEFAULT_CAMERA_ID;
  }, [companyId, userId]);

  const displayName = (cameraName?.trim() || "Laptop Camera").trim();

  const streamUrl = useMemo(() => {
    return `${AI_HOST}/presence/stream/${encodeURIComponent(cameraId)}`;
  }, [cameraId]);

  const wsSignalUrl = useMemo(() => {
    const base = String(AI_HOST || "")
      .replace(/^http/i, "ws")
      .replace(/\/$/, "");
    return `${base}/webrtc/signal`;
  }, []);

  const stopLocalCamera = useCallback(() => {
    try {
      if (localVideoRef.current?.srcObject) {
        (localVideoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    } catch {}

    try {
      pcRef.current?.close();
    } catch {}

    try {
      wsRef.current?.close();
    } catch {}

    pcRef.current = null;
    wsRef.current = null;

    setLocalActive(false);
  }, []);

  useEffect(() => {
    return () => stopLocalCamera();
  }, [stopLocalCamera]);

  const prevKeyRef = useRef<string>(`${cameraId}|${companyId || ""}`);
  useEffect(() => {
    const key = `${cameraId}|${companyId || ""}`;
    const changed = prevKeyRef.current !== key;
    if (changed && localActive) stopLocalCamera();
    prevKeyRef.current = key;
  }, [cameraId, companyId, localActive, stopLocalCamera]);

  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play();
      }

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const ws = new WebSocket(wsSignalUrl);
      wsRef.current = ws;

      ws.onerror = () => {
        stopLocalCamera();
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "failed" || s === "disconnected" || s === "closed") {
          stopLocalCamera();
        }
      };

      ws.onopen = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        ws.send(
          JSON.stringify({
            sdp: pc.localDescription,
            cameraId,
            companyId,
            purpose: "presence",
          })
        );
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.sdp && data.cameraId === cameraId) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        } else if (data.ice && data.cameraId === cameraId) {
          await pc.addIceCandidate(data.ice);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              ice: event.candidate,
              cameraId,
              companyId,
              purpose: "presence",
            })
          );
        }
      };

      setLocalActive(true);
    } catch (err) {
      console.error("Camera start failed", err);
      alert("Camera access failed");
      stopLocalCamera();
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm max-w-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{displayName}</div>
          <div className="text-xs text-gray-500">WebRTC + Presence</div>
          <div className="mt-0.5 text-[11px] text-gray-400 break-all">
            CameraId: {cameraId}
          </div>
        </div>

        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            localActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {localActive ? "ACTIVE" : "OFF"}
        </span>
      </div>

      <div className="mt-3 aspect-video overflow-hidden rounded-lg border bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-3 aspect-video overflow-hidden rounded-lg border bg-gray-100">
        {localActive ? (
          <Image
            src={streamUrl}
            alt="Presence stream"
            className="h-full w-full object-cover"
            width={1280}
            height={720}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
            Start camera to view presence overlay
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        {localActive ? (
          <button
            onClick={stopLocalCamera}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs text-red-600"
          >
            Stop Camera
          </button>
        ) : (
          <button
            onClick={startLocalCamera}
            className="rounded-md border border-green-300 bg-green-50 px-3 py-1 text-xs text-green-700"
          >
            Start Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default PresenceLaptopCamera;
