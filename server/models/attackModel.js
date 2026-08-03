import mongoose from "mongoose";

const attackSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },

    round: {
      type: Number,
      required: true,
      min: 1,
    },

    attackingTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    targetTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    coordinate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    result: {
      type: String,
      enum: ["hit", "miss"],
      required: true,
    },

    shipSunk: {
      type: Boolean,
      default: false,
    },

    allShipsSunk: {
      type: Boolean,
      default: false,
    },

    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
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

attackSchema.index(
  {
    game: 1,
    targetTeam: 1,
    coordinate: 1,
  },
  {
    unique: true,
  }
);

const attackModel =
  mongoose.models.Attack ||
  mongoose.model("Attack", attackSchema);

export default attackModel;