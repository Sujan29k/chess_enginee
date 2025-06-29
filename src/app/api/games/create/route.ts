import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { Game } from "@/models/Game";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { gameId } = await req.json();

    if (!session?.user?.id || !gameId) {
      return NextResponse.json(
        { error: "Unauthorized or missing gameId" },
        { status: 401 }
      );
    }

    await connectToDB();

    const existing = await Game.findOne({ gameId });
    if (existing) {
      return NextResponse.json(
        { error: "Game ID already exists" },
        { status: 409 }
      );
    }

    const newGame = await Game.create({
      gameId,
      whitePlayer: session.user.id,
    });

    return NextResponse.json({
      message: "Game created",
      gameId: newGame.gameId,
    });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
