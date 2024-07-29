import express from "express";
import cors from "cors";
import { logRequests } from "./middlewares/logging.middleware";
import accountRoutes from "./routes/account.routes";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(logRequests);

app.use("/api/accounts", accountRoutes);

export default app;
