// app/dashboard/play/bot/page.tsx
"use client";

import ChessBoard from "@/components/ChessBoard"; // Assuming you already have this
import { useEffect, useState } from "react";

export default function BotGamePage() {
  const [vsBot, setVsBot] = useState(true);

  useEffect(() => {
    // You could set default color or logic here
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      <ChessBoard gameId="vs-bot" playerColor="w" vsBot={vsBot} playerId={""} />
    </div>
  );
}
