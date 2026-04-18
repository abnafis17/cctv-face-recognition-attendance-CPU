"use client";

import { useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import axiosInstance, { AI_HOST } from "@/config/axiosInstance";
import CameraViewHeader from "@/components/modules/cameras-live/CameraViewHeader";
import CameraMonitorCard from "@/components/modules/cameras-live/CameraMonitorCard";
import { useTaskCameraWall } from "@/hooks/useTaskCameraWall";
import { cn } from "@/lib/utils";
import type { Camera } from "@/types";

const FULLSCREEN_CARD_CLASS_NAME =
  "fixed inset-4 z-[70] rounded-md shadow-2xl ring-1 ring-white/10";

export default function BoundingBoxCameraGrid() {
  const disableAttendanceAfterStart = useCallback(async (camera: Camera) => {
    await axiosInstance.post("/attendance-control/disable", {
      cameraId: camera.id,
    });
  }, []);

  const {
    actionCamId,
    activeScreens,
    cameraSortOrder,
    cameraWallClassName,
    cameraWallRef,
    cameraWallStyle,
    closeFullscreen,
    err,
    fullscreenCardId,
    offlineScreens,
    shouldFillViewportGrid,
    sortedCams,
    startCamera,
    stopCamera,
    toggleCameraSortOrder,
    toggleFullscreen,
    totalScreens,
  } = useTaskCameraWall({
    task: "box",
    onAfterStart: disableAttendanceAfterStart,
  });

  const cameraWallItemClassName = cn(
    "camera-wall-item",
    shouldFillViewportGrid && "h-full",
  );
  const getCardClassName = (isFullscreen: boolean) =>
    cn(
      shouldFillViewportGrid && "h-full",
      "transition-all duration-300 ease-out",
      isFullscreen && FULLSCREEN_CARD_CLASS_NAME,
    );

  return (
    <div className="space-y-4">
      <CameraViewHeader
        title="Bounding Box"
        description={
          <>
            Live recognition overlay for cameras assigned to Bounding Box (AI:{" "}
            {AI_HOST})
          </>
        }
        totalScreens={totalScreens}
        activeScreens={activeScreens}
        offlineScreens={offlineScreens}
        cameraSortOrder={cameraSortOrder}
        onToggleCameraSortOrder={toggleCameraSortOrder}
      />

      {err ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <AnimatePresence>
        {fullscreenCardId ? (
          <motion.button
            type="button"
            aria-label="Exit full screen camera"
            className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-[1.5px]"
            onClick={closeFullscreen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      {sortedCams.length > 0 ? (
        <section
          ref={cameraWallRef}
          className={cameraWallClassName}
          style={cameraWallStyle}
        >
          {sortedCams.map((camera) => {
            const cardId = `box:${camera.id}`;
            const isFullscreen = fullscreenCardId === cardId;
            const streamUrl = `${AI_HOST}/camera/recognition/stream/${encodeURIComponent(
              camera.id,
            )}/${encodeURIComponent(camera.name)}`;

            return (
              <div key={camera.id} className={cameraWallItemClassName}>
                <CameraMonitorCard
                  camera={camera}
                  streamUrl={streamUrl}
                  busy={actionCamId === camera.id}
                  isFullscreen={isFullscreen}
                  fillContainer={shouldFillViewportGrid}
                  showAttendanceActions={false}
                  onScreenDoubleClick={() => toggleFullscreen(cardId)}
                  className={getCardClassName(isFullscreen)}
                  onStart={startCamera}
                  onStop={stopCamera}
                />
              </div>
            );
          })}
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center">
          <p className="text-sm font-medium text-zinc-700">
            No bounding box cameras available
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Add cameras in Camera List with task set to Bounding Box to monitor
            them here.
          </p>
        </div>
      )}
    </div>
  );
}
