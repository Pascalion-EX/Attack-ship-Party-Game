import mongoose from "mongoose";

const scoreRulesSchema = new mongoose.Schema(
  {
    hitPoints: {
      type: Number,
      default: 10,
      min: 0,
    },

    sunkPoints: {
      type: Number,
      default: 20,
      min: 0,
    },

    finalShipPoints: {
      type: Number,
      default: 40,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Game name is required."],
      trim: true,
      minlength: [2, "Game name must contain at least 2 characters."],
      maxlength: [80, "Game name cannot exceed 80 characters."],
    },

    status: {
      type: String,
      enum: [
        "setup",
        "ready",
        "attack",
        "roundComplete",
        "paused",
        "finished",
      ],
      default: "setup",
    },

    phase: {
      type: String,
      enum: [
        "setup",
        "waiting",
        "attack",
        "roundComplete",
        "paused",
        "finished",
      ],
      default: "setup",
    },

    boardSize: {
      type: Number,
      required: true,
      enum: [6, 8, 10],
    },

    totalRounds: {
      type: Number,
      default: 6,
      min: 1,
      max: 50,
    },

    currentRound: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentTurnTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },

    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    turnQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    scoreRules: {
      type: scoreRulesSchema,
      default: () => ({
        hitPoints: 10,
        sunkPoints: 20,
        finalShipPoints: 40,
      }),
    },

    turnDurationSeconds: {
      type: Number,
      default: 60,
      min: 10,
      max: 3600,
    },

    turnEndsAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startedAt: {
      type: Date,
      default: null,
    },

    finishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const gameModel =
  mongoose.models.Game || mongoose.model("Game", gameSchema);

export default gameModel;