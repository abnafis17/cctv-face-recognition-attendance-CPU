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

export type CameraAuthorizedEmployeeOption = {
  id: string;
  empId: string | null;
  publicId: string;
  name: string;
  unit: string | null;
  section: string | null;
  department: string | null;
  line: string | null;
  selected: boolean;
};

export type CameraAuthorizedEmployeesState = {
  camera: {
    id: string;
    camId: string | null;
    name: string;
  };
  employees: CameraAuthorizedEmployeeOption[];
  authorizedEmployeeIds: string[];
  authorizedEmployeePublicIds: string[];
  warning?: string;
};
