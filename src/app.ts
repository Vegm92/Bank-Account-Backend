import express from "express";
import cors from "cors";
import { logRequests } from "./middlewares/logging.middleware";
import accountRoutes from "./routes/account.routes";
import dotenv from "dotenv";
import { CORS_ORIGIN } from "./server";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://bankaccount-victorgranda.netlify.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(logRequests);

app.use("/api/accounts", accountRoutes);

export default app;
