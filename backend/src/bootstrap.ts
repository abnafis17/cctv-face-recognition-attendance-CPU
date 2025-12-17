import { prisma } from "./prisma";

export async function bootstrap() {
  // Ensure default laptop webcam exists
  const webcamId = "cam1";

  const existing = await prisma.camera.findUnique({ where: { id: webcamId } });
  if (!existing) {
    await prisma.camera.create({
      data: {
        id: webcamId,
        name: "Laptop Camera",
        rtspUrl: "0",
        isActive: false,
      },
    });
    console.log("✅ Default camera created: cam1 (Laptop Camera)");
  }
}
