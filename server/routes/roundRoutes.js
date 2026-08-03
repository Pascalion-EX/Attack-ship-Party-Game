import express from "express";

import {
  setupRound,
  startRound,
  getCurrentRound,
} from "../controllers/roundController.js";

import userAuth from "../middleware/userAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const roundRouter = express.Router();

roundRouter.use(userAuth);
roundRouter.use(requireAdmin);

roundRouter.post(
  "/games/:gameId/setup",
  setupRound
);

roundRouter.post(
  "/games/:gameId/start",
  startRound
);

roundRouter.get(
  "/games/:gameId/current",
  getCurrentRound
);

roundRouter.get("/test-auth", (req, res) => {
  return res.status(200).json({
    success: true,
    userId: req.userId,
    user: req.user,
  });
});

export default roundRouter;