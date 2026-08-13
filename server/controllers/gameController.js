import mongoose from "mongoose";

import gameModel from "../models/gameModel.js";
import teamModel from "../models/teamModel.js";
import boardModel from "../models/boardModel.js";

import {
  generateShipLayout,
  getShipConfiguration,
  validateManualShipLayout,
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

/*
 * Normalize and validate the four teams.
 */
const normalizeTeamData = (customTeams) => {
  if (
    !Array.isArray(customTeams) ||
    customTeams.length === 0
  ) {
    return defaultTeams;
  }

  if (customTeams.length !== 4) {
    throw new Error(
      "Exactly four teams are required."
    );
  }

  const normalizedTeams =
    customTeams.map((team, index) => {
      const fallbackTeam =
        defaultTeams[index];

      return {
        name:
          typeof team?.name === "string" &&
          team.name.trim()
            ? team.name.trim()
            : fallbackTeam.name,

        color:
          typeof team?.color === "string" &&
          team.color.trim()
            ? team.color.trim()
            : fallbackTeam.color,
      };
    });

  const names = normalizedTeams.map(
    (team) => team.name.toLowerCase()
  );

  if (new Set(names).size !== 4) {
    throw new Error(
      "Every team must have a unique name."
    );
  }

  return normalizedTeams;
};

/*
 * Convert a game document to the safe game
 * object sent to the frontend.
 *
 * Ship coordinates are never exposed here.
 */
const formatPublicGame = (game) => {
  return {
    id: game._id,
    name: game.name,

    status: game.status,
    phase: game.phase,

    boardSize: game.boardSize,

    placementMode:
      game.placementMode || "random",

    shipsPlaced:
      game.shipsPlaced ?? true,

    totalRounds: game.totalRounds,
    currentRound: game.currentRound,

    activeRound: game.activeRound,

    currentTurnTeam:
      game.currentTurnTeam,

    turnDurationSeconds:
      game.turnDurationSeconds,

    turnEndsAt: game.turnEndsAt,
    roundStartedAt:
      game.roundStartedAt,

    scoreRules: game.scoreRules,

    teams: game.teams,

    createdBy: game.createdBy,

    startedAt: game.startedAt,
    finishedAt: game.finishedAt,

    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  };
};

/*
 * POST /api/games
 *
 * Creates:
 * - game
 * - four teams
 * - four boards
 *
 * Random mode:
 * ships are generated immediately.
 *
 * Manual mode:
 * boards are created empty and the admin
 * must place the ships afterward.
 */
export const createGame = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      name,
      boardSize,
      totalRounds,
      turnDurationSeconds,
      scoreRules,
      teams,
      placementMode = "random",
    } = req.body;

    /*
     * Game name
     */
    if (!name?.trim()) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Game name is required.",
      });
    }

    /*
     * Board size
     */
    const normalizedBoardSize =
      Number(boardSize);

    if (
      ![6, 8, 10].includes(
        normalizedBoardSize
      )
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Board size must be 6, 8, or 10.",
      });
    }

    /*
     * Number of rounds
     */
    const normalizedTotalRounds =
      Number(totalRounds || 6);

    if (
      !Number.isInteger(
        normalizedTotalRounds
      ) ||
      normalizedTotalRounds < 1 ||
      normalizedTotalRounds > 5000
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Total rounds must be between 1 and 5000.",
      });
    }

    /*
     * Turn duration
     */
    const normalizedTurnDuration =
      Number(
        turnDurationSeconds || 60
      );

    if (
      !Number.isInteger(
        normalizedTurnDuration
      ) ||
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

    /*
     * Placement mode
     */
    if (
      placementMode !== "random" &&
      placementMode !== "manual"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Placement mode must be random or manual.",
      });
    }

    /*
     * Teams
     */
    let normalizedTeams;

    try {
      normalizedTeams =
        normalizeTeamData(teams);
    } catch (error) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    /*
     * Fleet
     */
    const fleetConfiguration =
      getShipConfiguration(
        normalizedBoardSize
      );

    /*
     * Create game
     */
    const gameDocuments =
      await gameModel.create(
        [
          {
            name: name.trim(),

            boardSize:
              normalizedBoardSize,

            totalRounds:
              normalizedTotalRounds,

            turnDurationSeconds:
              normalizedTurnDuration,

            placementMode,

            shipsPlaced:
              placementMode ===
              "random",

            scoreRules: {
              hitPoints: Number(
                scoreRules?.hitPoints ??
                  10
              ),

              sunkPoints: Number(
                scoreRules?.sunkPoints ??
                  20
              ),

              finalShipPoints: Number(
                scoreRules?.finalShipPoints ??
                  40
              ),
            },

            createdBy: req.userId,

            status:
              placementMode ===
              "random"
                ? "ready"
                : "setup",

            phase:
              placementMode ===
              "random"
                ? "waiting"
                : "setup",
          },
        ],
        {
          session,
        }
      );

    const game = gameDocuments[0];

    /*
     * Create teams.
     */
    const teamDocuments =
      normalizedTeams.map(
        (team, index) => ({
          game: game._id,

          name: team.name,
          color: team.color,

          score: 0,
          attacksRemaining: 0,

          /*
           * The fleet size is known even
           * before manual placement.
           */
          shipsRemaining:
            fleetConfiguration.length,

          turnPosition: index,
        })
      );

    const createdTeams =
      await teamModel.insertMany(
        teamDocuments,
        {
          session,
        }
      );

    /*
     * Create boards.
     *
     * RANDOM:
     * Generate the full ship layout.
     *
     * MANUAL:
     * Create an empty board.
     */
    const boardDocuments =
      createdTeams.map((team) => {
        const isRandom =
          placementMode === "random";

        return {
          game: game._id,
          team: team._id,

          size:
            normalizedBoardSize,

          ships: isRandom
            ? generateShipLayout(
                normalizedBoardSize
              )
            : [],

          placementComplete:
            isRandom,

          attackedCells: [],
        };
      });

    await boardModel.insertMany(
      boardDocuments,
      {
        session,
      }
    );

    /*
     * Attach teams to game.
     */
    game.teams =
      createdTeams.map(
        (team) => team._id
      );

    /*
     * Random mode is immediately ready.
     *
     * Manual mode stays in setup until
     * all four boards are completed.
     */
    if (
      placementMode === "random"
    ) {
      game.status = "ready";
      game.phase = "waiting";
      game.shipsPlaced = true;
    } else {
      game.status = "setup";
      game.phase = "setup";
      game.shipsPlaced = false;
    }

    await game.save({
      session,
    });

    await session.commitTransaction();

    /*
     * Populate safe team information.
     */
    await game.populate({
      path: "teams",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
    });

    return res.status(201).json({
      success: true,

      message:
        placementMode === "manual"
          ? "Game created. Place the ships for all four teams."
          : "Game created successfully.",

      game:
        formatPublicGame(game),

      fleet:
        fleetConfiguration,

      requiresManualPlacement:
        placementMode === "manual",
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

    console.error(
      "Create game error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not create game.",
    });
  } finally {
    session.endSession();
  }
};

/*
 * GET /api/games
 */
export const getAllGames = async (
  req,
  res
) => {
  try {
    const games =
      await gameModel
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

      games: games.map(
        formatPublicGame
      ),
    });
  } catch (error) {
    console.error(
      "Get games error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not retrieve games.",
    });
  }
};

/*
 * GET /api/games/:gameId
 */
export const getGameById = async (
  req,
  res
) => {
  try {
    const { gameId } = req.params;

    if (
      !mongoose.isValidObjectId(
        gameId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game ID.",
      });
    }

    const game =
      await gameModel
        .findOne({
          _id: gameId,
          createdBy: req.userId,
        })
        .populate({
          path: "teams",

          select:
            "name color score attacksRemaining shipsRemaining turnPosition",
        })
        .populate({
          path: "currentTurnTeam",

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
      game:
        formatPublicGame(game),
    });
  } catch (error) {
    console.error(
      "Get game error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not retrieve game.",
    });
  }
};

/*
 * GET /api/games/:gameId/public-boards
 *
 * This endpoint intentionally DOES NOT
 * return ship locations.
 */
export const getPublicBoards = async (
  req,
  res
) => {
  try {
    const { gameId } = req.params;

    if (
      !mongoose.isValidObjectId(
        gameId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game ID.",
      });
    }

    const game =
      await gameModel.findOne({
        _id: gameId,
        createdBy: req.userId,
      });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    const boards =
      await boardModel
        .find({
          game: gameId,
        })
        .select(
          "team size attackedCells placementComplete"
        )
        .populate({
          path: "team",
          select:
            "name color score",
        });

    const publicBoards =
      boards.map((board) => ({
        id: board._id,

        team: board.team,

        size: board.size,

        placementComplete:
          board.placementComplete,

        attackedCells:
          board.attackedCells.map(
            (cell) => ({
              coordinate:
                cell.coordinate,

              result:
                cell.result,

              attackedBy:
                cell.attackedBy,

              round:
                cell.round,

              attackedAt:
                cell.attackedAt,
            })
          ),
      }));

    return res.status(200).json({
      success: true,
      boards: publicBoards,
    });
  } catch (error) {
    console.error(
      "Get public boards error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not retrieve public boards.",
    });
  }
};

/*
 * GET
 * /api/games/:gameId/teams/:teamId/board
 *
 * Admin-only endpoint used by the manual
 * placement screen.
 *
 * This IS allowed to return ship locations
 * because it is protected by userAuth +
 * requireAdmin.
 */
export const getManualBoard = async (
  req,
  res
) => {
  try {
    const {
      gameId,
      teamId,
    } = req.params;

    /*
     * Validate IDs.
     */
    if (
      !mongoose.isValidObjectId(
        gameId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid game ID.",
      });
    }

    if (
      !mongoose.isValidObjectId(
        teamId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid team ID.",
      });
    }

    /*
     * Game must belong to this admin.
     */
    const game =
      await gameModel.findOne({
        _id: gameId,
        createdBy: req.userId,
      });

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    /*
     * Team must belong to the game.
     */
    const team =
      await teamModel.findOne({
        _id: teamId,
        game: game._id,
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found.",
      });
    }

    /*
     * Ships normally use select:false.
     *
     * We explicitly request them here.
     */
    const board =
      await boardModel
        .findOne({
          game: game._id,
          team: team._id,
        })
        .select("+ships");

    if (!board) {
      return res.status(404).json({
        success: false,
        message:
          "Board not found.",
      });
    }

    return res.status(200).json({
      success: true,

      team: {
        id: team._id,
        name: team.name,
        color: team.color,
      },

      board: {
        id: board._id,

        team: team._id,

        size: board.size,

        ships: board.ships,

        placementComplete:
          Boolean(
            board.placementComplete
          ),
      },

      fleet:
        getShipConfiguration(
          game.boardSize
        ),
    });
  } catch (error) {
    console.error(
      "Get manual board error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not retrieve board.",
    });
  }
};

/*
 * PUT
 * /api/games/:gameId/teams/:teamId/board
 *
 * Saves the complete ship layout for
 * a single team.
 */
export const saveManualBoard = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      gameId,
      teamId,
    } = req.params;

    const { ships } = req.body;

    /*
     * Validate IDs.
     */
    if (
      !mongoose.isValidObjectId(
        gameId
      )
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Invalid game ID.",
      });
    }

    if (
      !mongoose.isValidObjectId(
        teamId
      )
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Invalid team ID.",
      });
    }

    /*
     * Load game.
     */
    const game =
      await gameModel
        .findOne({
          _id: gameId,
          createdBy: req.userId,
        })
        .session(session);

    if (!game) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Game not found.",
      });
    }

    /*
     * Only manual-placement games can
     * use this endpoint.
     */
    if (
      game.placementMode !== "manual"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,

        message:
          "This game uses random ship placement.",
      });
    }

    /*
     * Once round one has been configured,
     * ship placement can no longer change.
     */
    if (
      game.currentRound > 0 ||
      game.phase === "attack" ||
      game.phase ===
        "roundComplete" ||
      game.phase === "finished"
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,

        message:
          "Ship placement cannot be changed after the game has started.",
      });
    }

    /*
     * Team must belong to this game.
     */
    const team =
      await teamModel
        .findOne({
          _id: teamId,
          game: game._id,
        })
        .session(session);

    if (!team) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Team not found.",
      });
    }

    /*
     * Validate all ships server-side.
     *
     * The frontend must never be trusted
     * for placement validation.
     */
    let validatedShips;

    try {
      validatedShips =
        validateManualShipLayout({
          boardSize:
            game.boardSize,

          ships,
        });
    } catch (error) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    /*
     * Load hidden board data.
     */
    const board =
      await boardModel
        .findOne({
          game: game._id,
          team: team._id,
        })
        .select("+ships")
        .session(session);

    if (!board) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "Board not found.",
      });
    }

    /*
     * Store the validated layout.
     *
     * Hits/sunk are explicitly reset
     * inside validateManualShipLayout().
     */
    board.ships =
      validatedShips;

    board.attackedCells = [];

    board.placementComplete =
      true;

    /*
     * Ensure the team begins with the
     * correct number of surviving ships.
     */
    team.shipsRemaining =
      validatedShips.length;

    await board.save({
      session,
    });

    await team.save({
      session,
    });

    /*
     * Check whether all four boards are
     * now ready.
     */
    const completedBoards =
      await boardModel.countDocuments({
        game: game._id,
        placementComplete: true,
      }).session(session);

    const allBoardsComplete =
      completedBoards ===
      game.teams.length;

    if (allBoardsComplete) {
      game.shipsPlaced = true;

      game.status = "ready";
      game.phase = "waiting";
    } else {
      game.shipsPlaced = false;

      game.status = "setup";
      game.phase = "setup";
    }

    await game.save({
      session,
    });

    await session.commitTransaction();

    return res.status(200).json({
      success: true,

      message:
        `${team.name} ship placement saved.`,

      placementComplete: true,

      completedBoards,

      totalBoards:
        game.teams.length,

      allBoardsComplete,

      game: {
        id: game._id,
        status: game.status,
        phase: game.phase,
        placementMode:
          game.placementMode,
        shipsPlaced:
          game.shipsPlaced,
      },
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Save manual board error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Could not save ship placement.",
    });
  } finally {
    session.endSession();
  }
};

/*
 * Optional helper:
 *
 * GET
 * /api/games/:gameId/placement-status
 *
 * Useful for the frontend manual placement
 * screen so it can show:
 *
 * 3 / 4 teams completed
 */
export const getPlacementStatus =
  async (req, res) => {
    try {
      const { gameId } =
        req.params;

      if (
        !mongoose.isValidObjectId(
          gameId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid game ID.",
        });
      }

      const game =
        await gameModel
          .findOne({
            _id: gameId,
            createdBy: req.userId,
          })
          .populate({
            path: "teams",

            select:
              "name color turnPosition",
          });

      if (!game) {
        return res.status(404).json({
          success: false,
          message:
            "Game not found.",
        });
      }

      const boards =
        await boardModel
          .find({
            game: game._id,
          })
          .select(
            "team placementComplete"
          );

      const boardStatus =
        new Map(
          boards.map((board) => [
            board.team.toString(),
            Boolean(
              board.placementComplete
            ),
          ])
        );

      const teams =
        game.teams.map(
          (team) => ({
            id: team._id,

            name: team.name,

            color: team.color,

            turnPosition:
              team.turnPosition,

            placementComplete:
              boardStatus.get(
                team._id.toString()
              ) || false,
          })
        );

      const completedBoards =
        teams.filter(
          (team) =>
            team.placementComplete
        ).length;

      return res
        .status(200)
        .json({
          success: true,

          placementMode:
            game.placementMode,

          shipsPlaced:
            game.shipsPlaced,

          completedBoards,

          totalBoards:
            teams.length,

          allBoardsComplete:
            teams.length > 0 &&
            completedBoards ===
              teams.length,

          teams,
        });
    } catch (error) {
      console.error(
        "Get placement status error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Could not retrieve placement status.",
      });
    }
  };