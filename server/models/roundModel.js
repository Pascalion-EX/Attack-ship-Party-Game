import mongoose from "mongoose";

const teamRoundEntrySchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    attacksGranted: {
      type: Number,
      required: true,
      min: 0,
    },

    attacksUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const roundSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },

    roundNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["setup", "active", "completed"],
      default: "setup",
    },

    teams: {
      type: [teamRoundEntrySchema],
      required: true,
    },

    initialTurnQueue: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

roundSchema.index(
  {
    game: 1,
    roundNumber: 1,
  },
  {
    unique: true,
  }
);

const roundModel =
  mongoose.models.Round || mongoose.model("Round", roundSchema);

export default roundModel;