import express from "express";

import {
  createGame,
  getAllGames,
  getGameById,
  getPublicBoards,
  getManualBoard,
  saveManualBoard,
  getPlacementStatus,
} from "../controllers/gameController.js";

import userAuth from "../middleware/userAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const gameRouter =
  express.Router();

gameRouter.use(
  userAuth,
  requireAdmin
);

gameRouter.post(
  "/",
  createGame
);

gameRouter.get(
  "/",
  getAllGames
);

gameRouter.get(
  "/:gameId/placement-status",
  getPlacementStatus
);

gameRouter.get(
  "/:gameId/public-boards",
  getPublicBoards
);

gameRouter.get(
  "/:gameId/teams/:teamId/board",
  getManualBoard
);

gameRouter.put(
  "/:gameId/teams/:teamId/board",
  saveManualBoard
);

gameRouter.get(
  "/:gameId",
  getGameById
);

export default gameRouter;