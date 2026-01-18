export type RelayAgent = {
  id: string;
  name: string;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PairCodeResponse = {
  code: string;
  expiresAt: string;
};

export type Camera = {
  id: string;
  camId?: string | null;
  name: string;
  rtspUrl: string;
  isActive: boolean;

  relayAgentId?: string | null;
  rtspUrlEnc?: string | null;

  sendFps?: number;
  sendWidth?: number;
  sendHeight?: number;
  jpegQuality?: number;

  createdAt?: string;
  updatedAt?: string;
};
