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

/*
 * Database connection.
 *
 * connectDB() should reuse an existing MongoDB/Mongoose
 * connection when possible because Vercel runs the backend
 * using serverless functions.
 */
await connectDB();

/*
 * Allowed frontend origins.
 */
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

/*
 * CORS
 */
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // e.g. Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked request from: ${origin}`)
      );
    },

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

/*
 * Request parsers.
 */
app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(cookieParser());

/*
 * Health check.
 */
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Attackship API is running.",
    environment: process.env.NODE_ENV || "development",
  });
});

/*
 * API routes.
 */
app.use("/api/auth", authRouter);
app.use("/api/games", gameRouter);
app.use("/api/rounds", roundRouter);
app.use("/api/attacks", attackRouter);

/*
 * Unknown routes.
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
      process.env.NODE_ENV === "production"
        ? "Internal server error."
        : error.message || "Internal server error.",
  });
});

/*
 * Start normal Express server only during local development.
 *
 * Vercel handles the HTTP server itself in production.
 */
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/*
 * Required for Vercel.
 */
export default app;