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
