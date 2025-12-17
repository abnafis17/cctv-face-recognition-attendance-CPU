import express from "express";
import cors from "cors";
import routes from "./routes";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use(routes);
