// app/api/games/get/route.ts
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { Game } from "@/models/Game";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
    }

    await connectToDB();
    const game = await Game.findOne({ gameId });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Force both IDs to strings:
    const whitePlayer = game.whitePlayer?.toString() ?? null;
    const blackPlayer = game.blackPlayer?.toString() ?? null;

    // ← Debug log on the server
    console.log("GET /api/games/get", { gameId, whitePlayer, blackPlayer });

    return NextResponse.json({ whitePlayer, blackPlayer });
  } catch (err) {
    console.error("Error in GET /api/games/get:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
