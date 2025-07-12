import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongoose"; // Your MongoDB connection helper
import {User} from "@/models/User"; // Your User model

export async function POST(req: NextRequest) {
  try {
    await connectToDB();

    const { winnerId, type, botLevel } = await req.json();

    console.log(
      "API Hit: WinnerID",
      winnerId,
      "Type",
      type,
      "BotLevel",
      botLevel
    );

    let pointsToAdd = 0;
    if (type === "bot") {
      pointsToAdd = botLevel || 0;
    } else if (type === "player") {
      pointsToAdd = 20;
    }

    const updatedUser = await User.findByIdAndUpdate(
      winnerId,
      { $inc: { points: pointsToAdd } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, newPoints: updatedUser.points });
  } catch (err) {
    console.error("Error awarding points:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
