"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReusableModal from "@/components/reusable/ReusableModal";
import { createRelayCamera } from "../api";

export default function CreateRelayCameraModal({
  open,
  onClose,
  relayAgentId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  relayAgentId: string;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");

  const [sendFps, setSendFps] = useState(2);
  const [sendWidth, setSendWidth] = useState(640);
  const [sendHeight, setSendHeight] = useState(360);
  const [jpegQuality, setJpegQuality] = useState(70);

  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!name.trim() || !rtspUrl.trim() || !relayAgentId) return;

    setLoading(true);
    try {
      await createRelayCamera({
        name: name.trim(),
        rtspUrl: rtspUrl.trim(),
        relayAgentId,
        sendFps,
        sendWidth,
        sendHeight,
        jpegQuality,
      });
      onCreated();
      onClose();
      setName("");
      setRtspUrl("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Add Relay Camera"
      description="RTSP is encrypted for the selected agent; cloud will receive frames via ingest."
      maxWidth="xl"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Camera Name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="Gate Cam 01"
          />
        </div>

        <div className="space-y-1">
          <div className="text-sm font-medium">RTSP URL (LAN)</div>
          <input
            value={rtspUrl}
            onChange={(e) => setRtspUrl(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm font-mono"
            placeholder="rtsp://user:pass@192.168.1.10:554/..."
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">Send FPS</div>
            <input
              type="number"
              value={sendFps}
              onChange={(e) => setSendFps(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Width</div>
            <input
              type="number"
              value={sendWidth}
              onChange={(e) => setSendWidth(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Height</div>
            <input
              type="number"
              value={sendHeight}
              onChange={(e) => setSendHeight(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">JPEG Quality</div>
            <input
              type="number"
              value={jpegQuality}
              onChange={(e) => setJpegQuality(Number(e.target.value))}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading}>
            {loading ? "Saving..." : "Create"}
          </Button>
        </div>
      </div>
    </ReusableModal>
  );
}
