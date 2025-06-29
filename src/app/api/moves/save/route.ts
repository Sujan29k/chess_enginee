import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose";
import { Move } from "@/models/Move";
import { Game } from "@/models/Game";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { gameId, from, to, promotion } = await req.json();

    if (!session?.user?.id || !gameId || !from || !to) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await connectToDB();

    const game = await Game.findOne({ gameId });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const move = await Move.create({
      game: game._id,
      player: session.user.id,
      from,
      to,
      promotion,
    });

    return NextResponse.json({ message: "Move saved", move });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
