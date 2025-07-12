// api/leaderboard.ts
import { NextRequest } from "next/server";
import {connectToDB} from "@/lib/mongoose";
import {User} from "@/models/User";

export async function GET(req: NextRequest) {
  await connectToDB();
  const topUsers = await User.find().sort({ points: -1 }).limit(10).select("username points");
  return Response.json({ topUsers });
}
