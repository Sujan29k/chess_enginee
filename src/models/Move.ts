// models/Move.ts
import mongoose, { Schema, Document, models, model } from "mongoose";

export interface IMove extends Document {
  game: mongoose.Types.ObjectId;
  player: mongoose.Types.ObjectId;
  from: string;
  to: string;
  promotion?: string;
  timestamp: Date;
}

const MoveSchema = new Schema<IMove>(
  {
    game: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    player: { type: Schema.Types.ObjectId, ref: "User", required: true },
    from: String,
    to: String,
    promotion: String,
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Move = models.Move || model<IMove>("Move", MoveSchema);
