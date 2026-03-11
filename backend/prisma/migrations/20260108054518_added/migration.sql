-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
