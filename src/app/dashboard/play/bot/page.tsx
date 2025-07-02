"use client";

import ChessBoard from "@/components/ChessBoard";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function BotGamePage() {
  const [playerId, setPlayerId] = useState("");
  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    // Simulate player ID generation (since there's no session logic for bot games)
    const id = uuidv4();
    setPlayerId(id);
    setGameReady(true);
  }, []);

  return (
    <div className="flex justify-center items-center h-screen">
      {gameReady ? (
        <ChessBoard
          gameId="vs-bot"
          playerColor="w"
          vsBot={true}
          playerId={playerId}
        />
      ) : (
        <div className="text-xl font-semibold text-gray-600">
          Preparing bot game...
        </div>
      )}
    </div>
  );
}
