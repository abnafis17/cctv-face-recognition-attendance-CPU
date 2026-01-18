"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import AgentsTable from "@/features/agent-admin/components/AgentsTable";
import PairCodeModal from "@/features/agent-admin/components/PairCodeModal";
import AgentCamerasTable from "@/features/agent-admin/components/AgentCamerasTable";
import CreateRelayCameraModal from "@/features/agent-admin/components/CreateRelayCameraModal";
import { listAgents, listCameras } from "@/features/agent-admin/api";
import type { RelayAgent } from "@/features/agent-admin/types";
import { SearchableSelect } from "@/components/reusable/SearchableSelect";

function isOnline(lastSeenAt: string | null, seconds = 30) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < seconds * 1000;
}

export default function AgentAdminPage() {
  const [agents, setAgents] = useState<RelayAgent[]>([]);
  const [cams, setCams] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<RelayAgent | null>(null);

  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loadingCams, setLoadingCams] = useState(false);

  const [pairOpen, setPairOpen] = useState(false);
  const [createCamOpen, setCreateCamOpen] = useState(false);

  async function refreshAgents() {
    setLoadingAgents(true);
    try {
      const a = await listAgents();
      setAgents(a);
      if (!selectedAgent && a.length) setSelectedAgent(a[0]);
      if (selectedAgent) {
        const still = a.find((x) => x.id === selectedAgent.id) || null;
        setSelectedAgent(still);
      }
    } finally {
      setLoadingAgents(false);
    }
  }

  async function refreshCameras() {
    setLoadingCams(true);
    try {
      const c = await listCameras();
      setCams(c);
    } finally {
      setLoadingCams(false);
    }
  }

  useEffect(() => {
    refreshAgents();
    refreshCameras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const agentItems = useMemo(
    () =>
      agents.map((a) => ({
        value: a.id,
        label: `${a.name} ${isOnline(a.lastSeenAt) ? "(ONLINE)" : "(OFFLINE)"}`,
      })),
    [agents]
  );

  const selectedId = selectedAgent?.id ?? "";
  const agentCameras = useMemo(
    () => cams.filter((c: any) => String(c.relayAgentId ?? "") === selectedId),
    [cams, selectedId]
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-bold">Agent Admin</div>
          <div className="text-sm text-muted-foreground">
            Manage relay agents + relay cameras.
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              refreshAgents();
              refreshCameras();
            }}
          >
            Refresh
          </Button>
          <Button onClick={() => setPairOpen(true)}>Generate Pair Code</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Agents */}
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Agents</div>
          </div>

          <SearchableSelect
            value={selectedId}
            items={agentItems}
            placeholder="Select agent..."
            onChange={(val: string) => {
              const a = agents.find((x) => x.id === val) || null;
              setSelectedAgent(a);
            }}
          />

          <AgentsTable
            data={agents}
            selectedAgentId={selectedId}
            onSelect={(a) => setSelectedAgent(a)}
            loading={loadingAgents}
          />
        </div>

        {/* Cameras for selected agent */}
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Agent Cameras</div>
            <Button
              disabled={!selectedAgent}
              onClick={() => setCreateCamOpen(true)}
            >
              Add Relay Camera
            </Button>
          </div>

          {selectedAgent ? (
            <div className="text-xs text-muted-foreground">
              Selected: <span className="font-mono">{selectedAgent.id}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Select an agent first.
            </div>
          )}

          <AgentCamerasTable
            cameras={agentCameras}
            loading={loadingCams}
            onChanged={async () => {
              await refreshAgents();
              await refreshCameras();
            }}
          />
        </div>
      </div>

      <PairCodeModal open={pairOpen} onClose={() => setPairOpen(false)} />

      {selectedAgent ? (
        <CreateRelayCameraModal
          open={createCamOpen}
          onClose={() => setCreateCamOpen(false)}
          relayAgentId={selectedAgent.id}
          onCreated={refreshCameras}
        />
      ) : null}
    </div>
  );
}
