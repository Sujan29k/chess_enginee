import mongoose from "mongoose";
const { Schema } = mongoose;

const GameSchema = new Schema({
  gameId: { type: String, required: true, unique: true },
  whitePlayer: { type: Schema.Types.ObjectId, ref: "User" },
  blackPlayer: { type: Schema.Types.ObjectId, ref: "User" },
});

export const Game = mongoose.models.Game || mongoose.model("Game", GameSchema);
