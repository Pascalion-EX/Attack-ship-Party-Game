import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import gameRouter from "./routes/gameRoutes.js";
import roundRouter from "./routes/roundRoutes.js";
import attackRouter from "./routes/attackRoutes.js";

dotenv.config();

const app = express();

await connectDB();

/*
 * Global middleware must be registered before routes.
 */
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/*
 * Basic server test route.
 */
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Attackship API is running.",
  });
});

/*
 * API routes must come after cookieParser,
 * express.json, and CORS.
 */
app.use("/api/auth", authRouter);
app.use("/api/games", gameRouter);
app.use("/api/rounds", roundRouter);
app.use("/api/attacks", attackRouter);

/*
 * Unknown route handler.
 */
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

/*
 * Global error handler.
 */
app.use((error, req, res, next) => {
  console.error("Server error:", error);

  return res.status(error.status || 500).json({
    success: false,
    message:
      error.message || "Internal server error.",
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});