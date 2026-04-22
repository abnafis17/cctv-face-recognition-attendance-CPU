export const CAMERA_TASK_OPTIONS = [
  { value: "attendance", label: "Attendance" },
  { value: "box", label: "Bounding Box" },
  { value: "presence", label: "Presence" },
  { value: "gate_pass", label: "Gate Pass" },
] as const;

export const DEFAULT_CAMERA_TASK = CAMERA_TASK_OPTIONS[0].value;
