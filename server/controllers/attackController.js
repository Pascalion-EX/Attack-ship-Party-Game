import mongoose from "mongoose";

import gameModel from "../models/gameModel.js";
import teamModel from "../models/teamModel.js";
import boardModel from "../models/boardModel.js";
import roundModel from "../models/roundModel.js";
import attackModel from "../models/attackModel.js";

import {
  isCoordinateValid,
  normalizeCoordinate,
} from "../services/coordinateService.js";

/**
 * Returns the game state with safe team information.
 * Hidden board ships are never included.
 */
const populateGameState = async (gameId) => {
  return gameModel
    .findById(gameId)
    .populate({
      path: "teams",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
      options: {
        sort: {
          turnPosition: 1,
        },
      },
    })
    .populate({
      path: "currentTurnTeam",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
    });
};

/**
 * Moves the game to the next turn.
 * If no turns remain, it completes the round.
 */
const advanceTurn = async ({
  game,
  session,
}) => {
  game.turnQueue.shift();

  if (game.turnQueue.length > 0) {
    game.currentTurnTeam = game.turnQueue[0];

    game.turnEndsAt = new Date(
      Date.now() + game.turnDurationSeconds * 1000
    );

    return;
  }

  game.currentTurnTeam = null;
  game.turnEndsAt = null;
  game.phase = "roundComplete";
  game.status = "roundComplete";

  if (game.activeRound) {
    await roundModel.updateOne(
      {
        _id: game.activeRound,
        game: game._id,
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
        },
      },
      {
        session,
      }
    );
  }
};

/**
 * POST /api/attacks/games/:gameId
 *
 * Body:
 * {
 *   "targetTeamId": "...",
 *   "coordinate": "B4"
 * }
 */
export const processAttack = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { gameId } = req.params;
    const { targetTeamId, coordinate } = req.body;

    if (!mongoose.isValidObjectId(gameId)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid game ID.",
      });
    }

    if (!mongoose.isValidObjectId(targetTeamId)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid target team ID.",
      });
    }

    const game = await gameModel
      .findOne({
        _id: gameId,
        createdBy: req.userId,
      })
      .session(session);

    if (!game) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    if (game.phase !== "attack") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The game is not in the attack phase.",
      });
    }

    if (!game.currentTurnTeam) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "There is no active team turn.",
      });
    }

    if (!Array.isArray(game.turnQueue) || game.turnQueue.length === 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The turn queue is empty.",
      });
    }

    const attackingTeamId = game.currentTurnTeam.toString();
    const normalizedTargetTeamId = targetTeamId.toString();

    if (attackingTeamId === normalizedTargetTeamId) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "A team cannot attack its own board.",
      });
    }

    const targetBelongsToGame = game.teams.some(
      (teamId) =>
        teamId.toString() === normalizedTargetTeamId
    );

    if (!targetBelongsToGame) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The selected team does not belong to this game.",
      });
    }

    const normalizedCoordinate =
      normalizeCoordinate(coordinate);

    if (
      !isCoordinateValid({
        coordinate: normalizedCoordinate,
        boardSize: game.boardSize,
      })
    ) {
      const finalRow = String.fromCharCode(
        64 + game.boardSize
      );

      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: `Coordinate must be between A1 and ${finalRow}${game.boardSize}.`,
      });
    }

    const attackingTeam = await teamModel
      .findOne({
        _id: attackingTeamId,
        game: game._id,
      })
      .session(session);

    if (!attackingTeam) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Attacking team not found.",
      });
    }

    if (attackingTeam.attacksRemaining <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The current team has no attacks remaining.",
      });
    }

    const targetTeam = await teamModel
      .findOne({
        _id: normalizedTargetTeamId,
        game: game._id,
      })
      .session(session);

    if (!targetTeam) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Target team not found.",
      });
    }

    /*
     * The ships field uses select: false in boardModel.
     * It is requested here only because the server must privately
     * determine whether the selected coordinate is a hit.
     */
    const targetBoard = await boardModel
      .findOne({
        game: game._id,
        team: normalizedTargetTeamId,
      })
      .select("+ships")
      .session(session);

    if (!targetBoard) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Target board not found.",
      });
    }

    const coordinateWasAlreadyAttacked =
      targetBoard.attackedCells.some(
        (cell) =>
          cell.coordinate === normalizedCoordinate
      );

    if (coordinateWasAlreadyAttacked) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message: "This coordinate has already been attacked.",
      });
    }

    let result = "miss";
    let shipSunk = false;
    let allShipsSunk = false;
    let pointsAwarded = 0;

    const hitShip = targetBoard.ships.find(
      (ship) =>
        ship.coordinates.includes(
          normalizedCoordinate
        )
    );

    if (hitShip) {
      result = "hit";

      if (
        !hitShip.hits.includes(
          normalizedCoordinate
        )
      ) {
        hitShip.hits.push(
          normalizedCoordinate
        );
      }

      const everyCoordinateWasHit =
        hitShip.coordinates.every(
          (shipCoordinate) =>
            hitShip.hits.includes(shipCoordinate)
        );

      if (
        everyCoordinateWasHit &&
        !hitShip.sunk
      ) {
        hitShip.sunk = true;
        shipSunk = true;
      }

      pointsAwarded +=
        game.scoreRules.hitPoints;

      if (shipSunk) {
        pointsAwarded +=
          game.scoreRules.sunkPoints;

        targetTeam.shipsRemaining = Math.max(
          0,
          targetTeam.shipsRemaining - 1
        );
      }

      allShipsSunk = targetBoard.ships.every(
        (ship) => ship.sunk
      );

      if (allShipsSunk && shipSunk) {
        pointsAwarded +=
          game.scoreRules.finalShipPoints;
      }
    }

    attackingTeam.score += pointsAwarded;

    attackingTeam.attacksRemaining = Math.max(
      0,
      attackingTeam.attacksRemaining - 1
    );

    targetBoard.attackedCells.push({
      coordinate: normalizedCoordinate,
      result,
      attackedBy: attackingTeam._id,
      round: game.currentRound,
      attackedAt: new Date(),
    });

    const createdAttacks = await attackModel.create(
      [
        {
          game: game._id,
          round: game.currentRound,
          attackingTeam: attackingTeam._id,
          targetTeam: targetTeam._id,
          coordinate: normalizedCoordinate,
          result,
          shipSunk,
          allShipsSunk,
          pointsAwarded,
          createdBy: req.userId,
        },
      ],
      {
        session,
      }
    );

    await advanceTurn({
      game,
      session,
    });

    await Promise.all([
      attackingTeam.save({
        session,
      }),

      targetTeam.save({
        session,
      }),

      targetBoard.save({
        session,
      }),

      game.save({
        session,
      }),
    ]);

    await session.commitTransaction();

    const publicGame = await populateGameState(
      game._id
    );

    const createdAttack = createdAttacks[0];

    const publicAttack = {
      id: createdAttack._id,
      round: createdAttack.round,
      attackingTeam: attackingTeam._id,
      targetTeam: targetTeam._id,
      coordinate: normalizedCoordinate,
      result,
      shipSunk,
      allShipsSunk,
      pointsAwarded,
      createdAt: createdAttack.createdAt,
    };

    if (req.io) {
      req.io
        .to(`game:${gameId}`)
        .emit("attack:resolved", {
          attack: publicAttack,
          game: publicGame,
        });
    }

    return res.status(200).json({
      success: true,
      message:
        result === "hit"
          ? "Attack resulted in a hit."
          : "Attack resulted in a miss.",
      attack: publicAttack,
      game: publicGame,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This coordinate has already been attacked.",
      });
    }

    console.error("Process attack error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not process the attack.",
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/attacks/games/:gameId/state
 *
 * Returns only public projector information.
 * Ship coordinates are never returned.
 */
export const getProjectorState = async (
  req,
  res
) => {
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
        options: {
          sort: {
            turnPosition: 1,
          },
        },
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

    /*
     * Explicitly request only public board fields.
     * Do not add ships to this query.
     */
    const boards = await boardModel
      .find({
        game: game._id,
      })
      .select("team size attackedCells")
      .populate({
        path: "team",
        select:
          "name color score attacksRemaining shipsRemaining turnPosition",
      });

    const recentAttacks = await attackModel
      .find({
        game: game._id,
      })
      .sort({
        createdAt: -1,
      })
      .limit(8)
      .populate({
        path: "attackingTeam",
        select: "name color",
      })
      .populate({
        path: "targetTeam",
        select: "name color",
      });

    const sortedBoards = boards.sort(
      (firstBoard, secondBoard) =>
        (firstBoard.team?.turnPosition ?? 0) -
        (secondBoard.team?.turnPosition ?? 0)
    );

    return res.status(200).json({
      success: true,

      game: {
        id: game._id,
        name: game.name,
        boardSize: game.boardSize,
        currentRound: game.currentRound,
        totalRounds: game.totalRounds,
        phase: game.phase,
        status: game.status,
        currentTurnTeam:
          game.currentTurnTeam,
        turnEndsAt: game.turnEndsAt,
        turnDurationSeconds:
          game.turnDurationSeconds,
        remainingTurns:
          game.turnQueue.length,
        teams: game.teams,
      },

      boards: sortedBoards.map((board) => ({
        id: board._id,
        size: board.size,
        team: board.team,

        attackedCells:
          board.attackedCells.map((cell) => ({
            coordinate: cell.coordinate,
            result: cell.result,
            attackedBy: cell.attackedBy,
            round: cell.round,
            attackedAt: cell.attackedAt,
          })),
      })),

      recentAttacks: recentAttacks.map(
        (attack) => ({
          id: attack._id,
          round: attack.round,
          attackingTeam:
            attack.attackingTeam,
          targetTeam: attack.targetTeam,
          coordinate: attack.coordinate,
          result: attack.result,
          shipSunk: attack.shipSunk,
          allShipsSunk:
            attack.allShipsSunk,
          pointsAwarded:
            attack.pointsAwarded,
          createdAt: attack.createdAt,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get projector state error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not retrieve projector state.",
    });
  }
};

/**
 * POST /api/attacks/games/:gameId/skip
 *
 * Uses one attack from the current team and advances
 * to the next team without creating an Attack document.
 */
export const skipCurrentTurn = async (
  req,
  res
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { gameId } = req.params;

    if (!mongoose.isValidObjectId(gameId)) {
      await session.abortTransaction();

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
      .session(session);

    if (!game) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Game not found.",
      });
    }

    if (
      game.phase !== "attack" ||
      !game.currentTurnTeam
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "There is no active turn to skip.",
      });
    }

    if (
      !Array.isArray(game.turnQueue) ||
      game.turnQueue.length === 0
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The turn queue is empty.",
      });
    }

    const skippedTeam = await teamModel
      .findOne({
        _id: game.currentTurnTeam,
        game: game._id,
      })
      .session(session);

    if (!skippedTeam) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Current team not found.",
      });
    }

    if (skippedTeam.attacksRemaining <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "The current team has no attacks remaining.",
      });
    }

    skippedTeam.attacksRemaining = Math.max(
      0,
      skippedTeam.attacksRemaining - 1
    );

    await advanceTurn({
      game,
      session,
    });

    await Promise.all([
      skippedTeam.save({
        session,
      }),

      game.save({
        session,
      }),
    ]);

    await session.commitTransaction();

    const publicGame = await populateGameState(
      game._id
    );

    if (req.io) {
      req.io
        .to(`game:${gameId}`)
        .emit("turn:skipped", {
          skippedTeamId: skippedTeam._id,
          game: publicGame,
        });
    }

    return res.status(200).json({
      success: true,
      message: `${skippedTeam.name}'s turn was skipped.`,
      skippedTeam: {
        id: skippedTeam._id,
        name: skippedTeam.name,
      },
      game: publicGame,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Skip turn error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not skip the current turn.",
    });
  } finally {
    session.endSession();
  }
};