import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { Move } from "@/models/Move";
import { Game } from "@/models/Game";

export async function DELETE(req: Request) {
  const { gameId } = await req.json();

  if (!gameId) {
    return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
  }

  await connectToDB();

  const game = await Game.findOne({ gameId });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  await Move.deleteMany({ game: game._id });

  return NextResponse.json({ message: "All moves deleted" });
}
