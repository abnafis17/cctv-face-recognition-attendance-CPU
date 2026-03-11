export type CameraRow = {
  id: string;
  camId: string | null;
  name: string;
  rtspUrl: string | null;
  isActive: boolean;
  task: string;
  relayAgentId: string | null;
  rtspUrlEnc: string | null;
  sendFps: number;
  sendWidth: number;
  sendHeight: number;
  jpegQuality: number;
  createdAt: string;
  updatedAt: string;
};

export type CameraUpdatePayload = {
  camId?: string | null;
  name?: string;
  rtspUrl?: string | null;
  task?: string;
  relayAgentId?: string | null;
  rtspUrlEnc?: string | null;
  sendFps?: number;
  sendWidth?: number;
  sendHeight?: number;
  jpegQuality?: number;
  isActive?: boolean;
};
