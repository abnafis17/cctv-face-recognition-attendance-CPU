export type Employee = {
  id: string;
  name: string;
};

export type AttendanceRow = {
  id: string;
  employeeId: string;
  name: string;
  timestamp: string;
  cameraId?: string | null;
  confidence?: number | null;
};

export type Camera = {
  id: string;
  name: string;
  rtspUrl: string;
  isActive: boolean;
};
