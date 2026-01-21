# Architecture Evaluation

## Control plane (existing)
- `backend/prisma/schema.prisma` already defines `Company`, `User`, `RelayAgent`, `Camera`, `PairCode`, etc., so the database enforces tenant isolation via `companyId` on every business entity (users, cameras, agents, attendances).
- `backend/src/routes/agents.ts` implements the pairing code flow, heartbeats, and agent-scoped camera lookups, so an agent can only read cameras that share its `companyId`/`relayAgentId` and flows are guarded by `requireCompany`/`requireAgent` middleware.
- The REST API still handles permissions (users + tenants + camera enrollment) through existing controllers (`controllers/*`, `routes/*.ts`), which means the "control plane" (auth, camera registry, agent registry) is mostly in place.

## Current data plane
- The AI service (`ai/app/api_server.py`) drains frames via RTSP into `CameraRuntime`, pushes MJPEG streams through `/camera/stream/*` and `/camera/recognition/stream/*`, and consumes ingestion frames over `/ws/ingest`. That WebSocket is tied to the agent token (see `_verify_agent_token`) and only handles JPEG blobs, not offer/answer or WebRTC transport.
- Viewers still pull MJPEG over HTTP (`StreamingResponse` generators) rather than any low-latency WebRTC mechanism, so there is no `aiortc` gateway, no MediaRelay, and no per-stream publish/watch tokens yet.

## Gap analysis vs. target multi-tenant architecture
| Target | Current | Gap |
| --- | --- | --- |
| WebSocket signaling for offer/answer + ICE | Only REST + simple `/ws/ingest` push for frames | No signaling channel for WebRTC; no ICE candidate handling or stream lifecycle messages |
| aiortc gateway + MediaRelay | Not present; AI server is a FastAPI process that decodes frames and serves MJPEG | Need new service or module that terminates RTSP via aiortc, maintains `RTCPeerConnection`, relays to multiple viewers/AI |
| Stream-specific tokens (publish/watch) | Agent access tokens exist, but no short-lived stream/token binding | Should mint ephemeral tokens tied to `tenant_id:camera_id` with expiry to keep tenants isolated |
| Stream state machine + quotas | No live registry; reconcilers rely on camera runtime status | Should track `OFFLINE`, `CONNECTING`, `LIVE`, etc., plus viewer counts/bitrate for throttling |
| TURN readiness | Not addressed | Must decide now; running TURN is necessary for reliable ICE in enterprise networks |

## Minimal updates and next steps
1. **Document the new data plane plan** so everyone understands that the control plane is ready but the data plane needs a WebSocket signaling server + aiortc gateway. This is the file you are reading; keep it aligned with future implementation notes.
2. **Capture the TURN decision**: allow TURN relays (same infrastructure) so enterprise deployments can traverse NAT and firewalls; we can wire the ICE config once the gateway is built.
3. **Keep existing business logic untouched** for now. The AI server and REST controllers continue to work; adding the WebRTC gateway can be layered beside them without reworking controllers.
4. **Prepare to add stream tokens/state** inside the gateway layer and the signaling server; start by reusing `tenant_id:camera_id` from the database (see `Camera` and `RelayAgent` models) when issuing tokens to agent/clients.

## What this evaluation gives you
- Confirms the control plane is multi-tenant safe and ready to issue pairing codes + relay agents.
- Identifies the missing WebRTC signaling + aiortc gateway to make browsers smooth/low-latency.
- Maps out the concrete gaps to address without touching the existing REST logic yet.
- Sets the TURN policy (TURN allowed) so a deployment blueprint with STUN/TURN config can be written next.
