import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { logRequests } from "./middlewares/logging.middleware";
import accountRoutes from "./routes/account.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(logRequests);

app.use("/api/accounts", accountRoutes);

export default app;
