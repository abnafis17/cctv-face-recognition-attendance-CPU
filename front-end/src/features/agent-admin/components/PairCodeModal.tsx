"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import ReusableModal from "@/components/reusable/ReusableModal";
import { createPairCode } from "../api";

function formatMMSS(totalSeconds: number) {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PairCodeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // Live countdown until expiry
  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.floor(ms / 1000)));
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  // Reset modal state when closed (optional but keeps UI clean)
  useEffect(() => {
    if (open) return;
    setLoading(false);
    setAgentName("");
    setCode("");
    setExpiresAt("");
    setSecondsLeft(0);
  }, [open]);

  const expired = useMemo(
    () => !!code && secondsLeft <= 0,
    [code, secondsLeft]
  );

  async function onGenerate() {
    const name = agentName.trim();
    if (!name) return;

    setLoading(true);
    try {
      const res = await createPairCode(name);
      setCode(res.code);
      setExpiresAt(res.expiresAt);
      // secondsLeft auto-updates via effect
    } finally {
      setLoading(false);
    }
  }

  return (
    <ReusableModal
      open={open}
      onClose={onClose}
      title="Generate Pair Code"
      description="Create a one-time pairing code for a client PC relay agent."
      maxWidth="lg"
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Agent Name</div>
          <input
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm"
            placeholder="e.g. FactoryGatePC-01"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={onGenerate} disabled={loading || !agentName.trim()}>
            {loading ? "Generating..." : "Generate"}
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            Close
          </Button>
        </div>

        {code ? (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Pair Code:</span>{" "}
              <span className="font-mono">{code}</span>
            </div>

            <div className="text-sm">
              <span className="font-semibold">Expires:</span>{" "}
              {new Date(expiresAt).toLocaleString()}
            </div>

            <div className="text-sm">
              <span className="font-semibold">Time left:</span>{" "}
              {secondsLeft > 0 ? (
                <span className="font-mono">{formatMMSS(secondsLeft)}</span>
              ) : (
                <span className="font-semibold text-red-600">Expired</span>
              )}
            </div>

            <div className="text-sm font-semibold mt-2">
              Client PC commands:
            </div>

            {expired ? (
              <div className="text-sm font-semibold text-red-600">
                Pair code expired. Generate a new one.
              </div>
            ) : (
              <pre className="text-xs whitespace-pre-wrap bg-black text-white rounded-md p-3">
                {`relay_agent.exe pair --server https://YOUR_BACKEND_DOMAIN/api/v1 --ai wss://YOUR_AI_DOMAIN --code ${code}
relay_agent.exe run`}
              </pre>
            )}
          </div>
        ) : null}
      </div>
    </ReusableModal>
  );
}
