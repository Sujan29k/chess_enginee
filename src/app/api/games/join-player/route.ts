import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { Game } from "@/models/Game";

export async function POST(req: Request) {
  const { gameId, userId } = await req.json();
  console.log("Join request payload:", { gameId, userId });

  if (!gameId || !userId) {
    console.log("Error: missing fields");
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await connectToDB();
  const game = await Game.findOne({ gameId });
  if (!game) {
    console.log("Error: game not found");
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const w = game.whitePlayer?.toString();
  const b = game.blackPlayer?.toString();
  console.log("Current game state:", { w, b });

  if (!b && w !== userId) {
    game.blackPlayer = userId;
    await game.save();
    console.log("User joined as black");
    return NextResponse.json({ message: "Joined as black" });
  }

  console.log("Game full or already joined");
  return NextResponse.json(
    { error: "Game full or already joined" },
    { status: 403 }
  );
}
