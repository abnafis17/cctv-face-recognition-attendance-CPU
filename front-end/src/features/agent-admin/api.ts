import axiosInstance from "@/config/axiosInstance";
import type { RelayAgent, PairCodeResponse, Camera } from "./types";

export async function listAgents(): Promise<RelayAgent[]> {
  const res = await axiosInstance.get("/agents");
  return (res.data || []) as RelayAgent[];
}

export async function createPairCode(
  agentName: string
): Promise<PairCodeResponse> {
  const res = await axiosInstance.post("/agents/pair-codes", { agentName });
  return res.data as PairCodeResponse;
}

export async function listCameras(): Promise<Camera[]> {
  const res = await axiosInstance.get("/cameras");
  return (res.data || []) as Camera[];
}

export async function createRelayCamera(input: {
  name: string;
  rtspUrl: string;
  relayAgentId: string;
  sendFps: number;
  sendWidth: number;
  sendHeight: number;
  jpegQuality: number;
}): Promise<Camera> {
  const res = await axiosInstance.post("/cameras", input);
  return res.data as Camera;
}

export async function startCamera(cameraId: string): Promise<void> {
  await axiosInstance.post(`/cameras/start/${cameraId}`);
}

export async function stopCamera(cameraId: string): Promise<void> {
  await axiosInstance.post(`/cameras/stop/${cameraId}`);
}

export async function deleteCamera(cameraId: string): Promise<void> {
  await axiosInstance.delete(`/cameras/${cameraId}`);
}
