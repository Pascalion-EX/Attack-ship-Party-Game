import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    color: {
      type: String,
      required: true,
      trim: true,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
    },

    attacksRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },

    shipsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },

    turnPosition: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index(
  {
    game: 1,
    name: 1,
  },
  {
    unique: true,
  }
);

const teamModel =
  mongoose.models.Team || mongoose.model("Team", teamSchema);

export default teamModel;