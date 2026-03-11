export type RelaySettingsResponse = {
  id?: string | null;
  relayOnUrl?: string | null;
  relaySilentUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type RelayApiRow = {
  id: string;
  relayOnUrl: string | null;
  relaySilentUrl: string | null;
  createdAt: string;
  updatedAt: string;
};
