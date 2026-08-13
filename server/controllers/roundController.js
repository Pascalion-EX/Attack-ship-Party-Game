import mongoose from "mongoose";

import gameModel from "../models/gameModel.js";
import teamModel from "../models/teamModel.js";
import roundModel from "../models/roundModel.js";

import { generateAlternatingTurnQueue } from "../services/turnQueueService.js";

const validateAttackEntries = ({
  teams,
  attackEntries,
}) => {
  if (!Array.isArray(attackEntries)) {
    throw new Error("Attack entries are required.");
  }

  if (attackEntries.length !== teams.length) {
    throw new Error("Every team must have an attack value.");
  }

  const gameTeamIds = new Set(
    teams.map((team) => String(team._id))
  );

  const receivedTeamIds = new Set();

  for (const entry of attackEntries) {
    const teamId = String(entry.teamId || "");
    const attacks = Number(entry.attacks);

    if (!gameTeamIds.has(teamId)) {
      throw new Error("One of the supplied teams does not belong to this game.");
    }

    if (receivedTeamIds.has(teamId)) {
      throw new Error("A team was included more than once.");
    }

    if (!Number.isInteger(attacks) || attacks < 0 || attacks > 2000) {
      throw new Error(
        "Attacks must be whole numbers between 0 and 20."
      );
    }

    receivedTeamIds.add(teamId);
  }
};

export const setupRound = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { gameId } = req.params;
    const { attackEntries } = req.body;

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

    if (game.status === "finished" || game.phase === "finished") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "A finished game cannot start another round.",
      });
    }

    if (game.phase === "attack") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The current round is still active.",
      });
    }

    if (game.currentRound >= game.totalRounds) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "All configured rounds have already been played.",
      });
    }

    const teams = await teamModel
      .find({
        game: game._id,
      })
      .sort({
        turnPosition: 1,
      })
      .session(session);

    if (teams.length !== 4) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The game must contain exactly four teams.",
      });
    }

    try {
      validateAttackEntries({
        teams,
        attackEntries,
      });
    } catch (error) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const entryMap = new Map(
      attackEntries.map((entry) => [
        String(entry.teamId),
        Number(entry.attacks),
      ])
    );

    const queueEntries = teams.map((team) => ({
      teamId: team._id.toString(),
      attacks: entryMap.get(team._id.toString()),
      turnPosition: team.turnPosition,
    }));

    const turnQueue =
      generateAlternatingTurnQueue(queueEntries);

    if (turnQueue.length === 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "At least one team must receive an attack.",
      });
    }

    const nextRoundNumber = game.currentRound + 1;

    const roundDocuments = await roundModel.create(
      [
        {
          game: game._id,
          roundNumber: nextRoundNumber,
          status: "setup",

          teams: teams.map((team) => ({
            team: team._id,
            attacksGranted: entryMap.get(team._id.toString()),
            attacksUsed: 0,
          })),

          initialTurnQueue: turnQueue,
          createdBy: req.userId,
        },
      ],
      {
        session,
      }
    );

    const round = roundDocuments[0];

    for (const team of teams) {
      team.attacksRemaining = entryMap.get(
        team._id.toString()
      );

      await team.save({
        session,
      });
    }

    game.currentRound = nextRoundNumber;
    game.activeRound = round._id;
    game.turnQueue = turnQueue;
    game.currentTurnTeam = turnQueue[0];
    game.phase = "waiting";
    game.status = "ready";
    game.turnEndsAt = null;

    await game.save({
      session,
    });

    await session.commitTransaction();

    await game.populate({
      path: "teams",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
    });

    await game.populate({
      path: "currentTurnTeam",
      select: "name color score attacksRemaining",
    });

    return res.status(201).json({
      success: true,
      message: `Round ${nextRoundNumber} configured.`,
      round: {
        id: round._id,
        roundNumber: round.roundNumber,
        status: round.status,
        initialTurnQueue: round.initialTurnQueue,
      },
      game,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This round has already been created.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Could not configure round.",
    });
  } finally {
    session.endSession();
  }
};

export const startRound = async (req, res) => {
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

    if (!game.activeRound) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Configure the round before starting it.",
      });
    }

    if (!game.turnQueue.length || !game.currentTurnTeam) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The round has no available turns.",
      });
    }

    if (game.phase === "attack") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "The round has already started.",
      });
    }

    const round = await roundModel
      .findOne({
        _id: game.activeRound,
        game: game._id,
      })
      .session(session);

    if (!round) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Active round not found.",
      });
    }

    const now = new Date();

    game.phase = "attack";
    game.status = "attack";
    game.roundStartedAt = now;
    game.turnEndsAt = new Date(
      now.getTime() + game.turnDurationSeconds * 1000
    );

    round.status = "active";
    round.startedAt = now;

    await Promise.all([
      game.save({
        session,
      }),
      round.save({
        session,
      }),
    ]);

    await session.commitTransaction();

    await game.populate({
      path: "teams",
      select:
        "name color score attacksRemaining shipsRemaining turnPosition",
    });

    await game.populate({
      path: "currentTurnTeam",
      select: "name color score attacksRemaining",
    });

    if (req.io) {
      req.io.to(`game:${gameId}`).emit("round:started", {
        currentRound: game.currentRound,
        phase: game.phase,
        currentTurnTeam: game.currentTurnTeam,
        turnEndsAt: game.turnEndsAt,
        turnQueue: game.turnQueue,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Round ${game.currentRound} started.`,
      game,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Could not start round.",
    });
  } finally {
    session.endSession();
  }
};

export const getCurrentRound = async (req, res) => {
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

    if (!game.activeRound) {
      return res.status(200).json({
        success: true,
        round: null,
      });
    }

    const round = await roundModel
      .findById(game.activeRound)
      .populate({
        path: "teams.team",
        select:
          "name color score attacksRemaining shipsRemaining turnPosition",
      })
      .populate({
        path: "initialTurnQueue",
        select: "name color",
      });

    return res.status(200).json({
      success: true,
      round,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Could not retrieve round.",
    });
  }
};