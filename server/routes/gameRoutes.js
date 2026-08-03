import express from "express";

import {
  createGame,
  getAllGames,
  getGameById,
  getPublicBoards,
} from "../controllers/gameController.js";

import userAuth from "../middleware/userAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const gameRouter = express.Router();

gameRouter.use(userAuth, requireAdmin);

gameRouter.post("/", createGame);

gameRouter.get("/", getAllGames);

gameRouter.get("/:gameId", getGameById);

gameRouter.get(
  "/:gameId/public-boards",
  getPublicBoards
);

export default gameRouter;