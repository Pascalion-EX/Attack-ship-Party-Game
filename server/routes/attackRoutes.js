import express from "express";

import {
  processAttack,
  getProjectorState,
  skipCurrentTurn,
} from "../controllers/attackController.js";

import userAuth from "../middleware/userAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const attackRouter = express.Router();

attackRouter.use(userAuth, requireAdmin);

attackRouter.get(
  "/games/:gameId/state",
  getProjectorState
);

attackRouter.post(
  "/games/:gameId/skip",
  skipCurrentTurn
);

attackRouter.post(
  "/games/:gameId",
  processAttack
);

export default attackRouter;