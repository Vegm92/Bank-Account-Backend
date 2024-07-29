import express from "express";
import cors from "cors";
import { logRequests } from "./middlewares/logging.middleware";
import accountRoutes from "./routes/account.routes";

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(logRequests);

app.use("/api/accounts", accountRoutes);

export default app;
