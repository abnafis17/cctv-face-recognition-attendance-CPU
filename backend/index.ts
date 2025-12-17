import dotenv from "dotenv";
import { app } from "./src/app";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
  console.log(`✅ Backend running: http://localhost:${PORT}`);
});
