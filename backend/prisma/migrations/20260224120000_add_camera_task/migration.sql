-- Add camera task to support per-camera routing (attendance/presence)
ALTER TABLE "Camera" ADD COLUMN IF NOT EXISTS "task" TEXT NOT NULL DEFAULT 'attendance';
