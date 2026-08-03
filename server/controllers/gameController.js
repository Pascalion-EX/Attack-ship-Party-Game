import mongoose from "mongoose";

import gameModel from "../models/gameModel.js";
import teamModel from "../models/teamModel.js";
import boardModel from "../models/boardModel.js";

import {
  generateShipLayout,
  getShipConfiguration,
} from "../services/shipPlacementService.js";

const defaultTeams = [
  {
    name: "Red Team",
    color: "#ef4444",
  },
  {
    name: "Blue Team",
    color: "#3b82f6",
  },
  {
    name: "Green Team",
    color: "#22c55e",
  },
  {
    name: "Yellow Team",
    color: "#eab308",
  },
];

const normalizeTeamData = (customTeams) => {
  if (!Array.isArray(customTeams) || customTeams.length === 0) {
    return defaultTeams;
  }

  if (customTeams.length !== 4) {
    throw new Error("Exactly four teams are required.");
  }

  const normalizedTeams = customTeams.map((team, index) => {
    const fallbackTeam = defaultTeams[index];

    return {
      name:
        typeof team?.name === "string" && team.name.trim()
          ? team.name.trim()
          : fallbackTeam.name,

      color:
        typeof team?.color === "string" && team.color.trim()
          ? team.color.trim()
          : fallbackTeam.color,
    };
  });

  const names = normalizedTeams.map((team) =>
    team.name.toLowerCase()
  );

  if (new Set(names).size !== 4) {
    throw new Error("Every team must have a unique name.");
  }

  return normalizedTeams;
};

const formatPublicGame = (game) => {
  return {
    id: game._id,
    name: game.name,
    status: game.status,
    phase: game.phase,
    boardSize: game.boardSize,
    totalRounds: game.totalRounds,
    currentRound: game.currentRound,
    currentTurnTeam: game.currentTurnTeam,
    turnDurationSeconds: game.turnDurationSeconds,
    scoreRules: game.scoreRules,
    teams: game.teams,
    createdBy: game.createdBy,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
};

export const createGame = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      name,
      boardSize,
      totalRounds,
      turnDurationSeconds,
      scoreRules,
      teams,
    } = req.body;

    if (!name?.trim()) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Game name is required.",
      });
    }

    const normalizedBoardSize = Number(boardSize);

    if (![6, 8, 10].includes(normalizedBoardSize)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Board size must be 6, 8, or 10.",
      });
    }

    const normalizedTotalRounds = Number(totalRounds || 6);

    if (
      !Number.isInteger(normalizedTotalRounds) ||
      normalizedTotalRounds < 1 ||
      normalizedTotalRounds > 50
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Total rounds must be between 1 and 50.",
      });
    }

    const normalizedTurnDuration = Number(
      turnDurationSeconds || 60
    );

    if (
      !Number.isInteger(normalizedTurnDuration) ||
      normalizedTurnDuration < 10 ||
      normalizedTurnDuration > 3600
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Turn duration must be between 10 and 3600 seconds.",
      });
    }

    let normalizedTeams;

    try {
      normalizedTeams = normalizeTeamData(teams);
    } catch (error) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const gameDocuments = await gameModel.create(
      [
        {
          name: name.trim(),
          boardSize: normalizedBoardSize,
          totalRounds: normalizedTotalRounds,
          turnDurationSeconds: normalizedTurnDuration,

          scoreRules: {
            hitPoints: Number(scoreRules?.hitPoints ?? 10),
            sunkPoints: Number(scoreRules?.sunkPoints ?? 20),
            finalShipPoints: Number(
              scoreRules?.finalShipPoints ?? 40
            ),
          },

          createdBy: req.userId,
          status: "setup",
          phase: "setup",
        },
      ],
      {
        session,
      }
    );

    const game = gameDocuments[0];

    const fleetConfiguration = getShipConfiguration(
      normalizedBoardSize
    );

    const teamDocuments = normalizedTeams.map((team, index) => ({
      game: game._id,
      name: team.name,
      color: team.color,
      score: 0,
      attacksRemaining: 0,
      shipsRemaining: fleetConfiguration.length,
      turnPosition: index,
    }));

    const createdTeams = await teamModel.insertMany(
      teamDocuments,
      {
        session,
      }
    );

    const boardDocuments = createdTeams.map((team) => ({
      game: game._id,
      team: team._id,
      size: normalizedBoardSize,
      ships: generateShipLayout(normalizedBoardSize),
      attackedCells: [],
    }));

    await boardModel.insertMany(boardDocuments, {
      session,
    });

    game.teams = createdTeams.map((team) => team._id);
    game.status = "ready";
    game.phase = "waiting";

    await game.save({
      session,
    });

    await session.commitTransaction();

    await game.populate({
      path: "teams",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
    });

    return res.status(201).json({
      success: true,
      message: "Game created successfully.",
      game: formatPublicGame(game),
      fleet: fleetConfiguration,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A team or board with the same identifier already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Could not create game.",
    });
  } finally {
    session.endSession();
  }
};

export const getAllGames = async (req, res) => {
  try {
    const games = await gameModel
      .find({
        createdBy: req.userId,
      })
      .populate({
        path: "teams",
        select:
          "name color score attacksRemaining shipsRemaining turnPosition",
      })
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      games: games.map(formatPublicGame),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Could not retrieve games.",
    });
  }
};

export const getGameById = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!mongoose.isValidObjectId(gameId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID.",
      });
    }

    const game = await gameModel
      .findOne({
        _id: gameId,
        createdBy: req.userId,
      })
      .populate({
        path: "teams",
        select:
          "name color score attacksRemaining shipsRemaining turnPosition",
      });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    return res.status(200).json({
      success: true,
      game: formatPublicGame(game),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Could not retrieve game.",
    });
  }
};

export const getPublicBoards = async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!mongoose.isValidObjectId(gameId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid game ID.",
      });
    }

    const game = await gameModel.findOne({
      _id: gameId,
      createdBy: req.userId,
    });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    const boards = await boardModel
      .find({
        game: gameId,
      })
      .select("team size attackedCells")
      .populate({
        path: "team",
        select: "name color score",
      });

    const publicBoards = boards.map((board) => ({
      id: board._id,
      team: board.team,
      size: board.size,

      attackedCells: board.attackedCells.map((cell) => ({
        coordinate: cell.coordinate,
        result: cell.result,
        attackedBy: cell.attackedBy,
        round: cell.round,
        attackedAt: cell.attackedAt,
      })),
    }));

    return res.status(200).json({
      success: true,
      boards: publicBoards,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error.message || "Could not retrieve public boards.",
    });
  }
};