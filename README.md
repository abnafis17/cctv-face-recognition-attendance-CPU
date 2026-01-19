# cctv-face-recognition-attendance

## Run on one host PC (LAN)

**Goal:** run `ai` + `backend` + `front-end` on PC A, and open the UI from PC B/C/etc without restarting the camera.

1. Set host IP in env

- `front-end/.env`: set `NEXT_PUBLIC_BACKEND_URL=http://<PC_A_IP>:3001` and `NEXT_PUBLIC_AI_URL=http://<PC_A_IP>:8000`
- `backend/.env`: set `AI_BASE_URL=http://<PC_A_IP>:8000` and add `http://<PC_A_IP>:3000` to `CORS_ORIGIN`

2. Start services on PC A

- AI (FastAPI): `cd ai; python -m uvicorn app.api_server:app --host 0.0.0.0 --port 8000`
- Backend (Express): `cd backend; npm run dev` (default `PORT=3001`)
- UI (Next.js): `cd front-end; npm run build; npm run start -- -H 0.0.0.0 -p 3000`

3. Open from other devices

- `http://<PC_A_IP>:3000`

If Windows Firewall blocks remote access, allow inbound ports `3000`, `3001`, `8000` on PC A.

 <!-- Relay Agent Adding Command -->

Below is a copy-paste checklist (commands only) to test and run the full relay flow: public server URLs → pair agent → start agent → publish laptop webcam as RTSP → add camera → start → verify frames.

I’m giving two sets:

A) LAN test (everything on same network)

B) Public-domain test (agent laptop on mobile SIM / different network)

A) LAN TEST (same network)

1. Backend health
   curl http://10.81.100.89:3001/api/v1/health

2. AI health
   curl http://10.81.100.89:8000/health

3. Pair the agent (use your Pair Code)
   relay_agent.exe pair --server http://10.81.100.89:3001/api/v1 --ai ws://10.81.100.89:8000 --code XXXX-YYYY

4. Run the agent
   relay_agent.exe run

5. (Optional webcam test RTSP locally) MediaMTX
   mediamtx.exe

6. (Optional webcam test RTSP locally) FFmpeg webcam → RTSP
   ffmpeg -f dshow -i video="Integrated Camera" -vf "scale=640:360,fps=15" -vcodec libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -f rtsp -rtsp_transport tcp rtsp://127.0.0.1:8554/webcam

7. Verify snapshot from AI (replace CAMERA_ID)
   curl -o snap.jpg http://10.81.100.89:8000/camera/snapshot/CAMERA_ID

B) PUBLIC DOMAIN TEST (agent laptop on mobile SIM / different network)

1. Backend health (public)
   curl https://api.yourdomain.com/api/v1/health

2. AI health (public)
   curl https://ai.yourdomain.com/health

3. Pair the agent (public URLs + Pair Code)
   relay_agent.exe pair --server https://api.yourdomain.com/api/v1 --ai wss://ai.yourdomain.com --code XXXX-YYYY

4. Run the agent
   relay_agent.exe run

C) Laptop Webcam as RTSP (best way to test remote laptop camera)

1. MediaMTX (local RTSP server on laptop)
   mediamtx.exe

2. Find webcam device name (Windows)
   ffmpeg -list_devices true -f dshow -i dummy

3. Publish webcam to RTSP (replace device name)
   ffmpeg -f dshow -i video="Integrated Camera" -vf "scale=640:360,fps=15" -vcodec libx264 -preset ultrafast -tune zerolatency -pix_fmt yuv420p -f rtsp -rtsp_transport tcp rtsp://127.0.0.1:8554/webcam

4. RTSP URL to add in your UI
   rtsp://127.0.0.1:8554/webcam

D) Backend token test (agent access token) — PowerShell (optional)
Invoke-RestMethod `  -Uri "http://127.0.0.1:3001/api/v1/agents/token"`
-Method POST `  -Headers @{ "Content-Type" = "application/json" }`
-Body '{
"agentId": "YOUR_AGENT_ID",
"refreshToken": "YOUR_REFRESH_TOKEN"
}'

E) Heartbeat test — PowerShell (optional)
Invoke-RestMethod `  -Uri "http://127.0.0.1:3001/api/v1/agents/YOUR_AGENT_ID/heartbeat"`
-Method POST `  -Headers @{ "Authorization" = "Bearer YOUR_AGENT_ACCESS_TOKEN"; "Content-Type"="application/json" }`
-Body "{}"

F) AI ingest WebSocket quick check (optional)

If you have wscat installed:

wscat -c "wss://ai.yourdomain.com/ws/ingest?token=YOUR_AGENT_ACCESS_TOKEN"

What you do in UI (no code)

Generate Pair Code

Pair agent (command above)

Agent Admin → confirm ONLINE

Add Relay Camera → set RTSP URL (C4)

Start Camera

Verify snapshot (A7 or public equivalent)

If you want, tell me whether your public exposure will be VPS+Nginx or Cloudflare Tunnel, and I’ll give the exact commands to create api.yourdomain.com and ai.yourdomain.com with working WSS.
