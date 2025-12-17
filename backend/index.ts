import dotenv from "dotenv";
import { app } from "./src/app";
import { bootstrap } from "./src/bootstrap";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

bootstrap().catch(console.error);

app.listen(PORT, () => {
  console.log(`✅ Backend running: http://localhost:${PORT}`);
});
