import mongoose from "mongoose";

const shipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
      min: 1,
    },

    orientation: {
      type: String,
      enum: ["horizontal", "vertical"],
      required: true,
    },

    coordinates: [
      {
        type: String,
        required: true,
        uppercase: true,
      },
    ],

    hits: [
      {
        type: String,
        uppercase: true,
      },
    ],

    sunk: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

const attackedCellSchema = new mongoose.Schema(
  {
    coordinate: {
      type: String,
      required: true,
      uppercase: true,
    },

    result: {
      type: String,
      enum: ["hit", "miss"],
      required: true,
    },

    attackedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    round: {
      type: Number,
      required: true,
      min: 1,
    },

    attackedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const boardSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      unique: true,
    },

    size: {
      type: Number,
      required: true,
      enum: [6, 8, 10],
    },

    ships: {
      type: [shipSchema],
      required: true,
      default: [],
      select: false,
    },

    attackedCells: {
      type: [attackedCellSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

boardSchema.index(
  {
    game: 1,
    team: 1,
  },
  {
    unique: true,
  }
);

const boardModel =
  mongoose.models.Board || mongoose.model("Board", boardSchema);

export default boardModel;