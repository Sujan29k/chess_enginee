"use client";

import ChessBoard from "@/components/ChessBoard";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function BotGamePage() {
  const [playerId, setPlayerId] = useState("");
  const [gameReady, setGameReady] = useState(false);
  const [level, setLevel] = useState(10); // <-- Track level

  useEffect(() => {
    const id = uuidv4();
    setPlayerId(id);
  }, []);

  const handleStart = () => {
    setGameReady(true);
  };

  if (!gameReady) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4 text-white">
        <h2 className="text-xl">Select Bot Difficulty</h2>
        <select
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="p-2 rounded bg-gray-800 text-white"
        >
          {Array.from({ length: 21 }, (_, i) => (
            <option key={i} value={i}>
              Level {i}
            </option>
          ))}
        </select>
        <button
          onClick={handleStart}
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <ChessBoard
        gameId="vs-bot"
        playerColor="w"
        vsBot={true}
        playerId={playerId}
        level={level} // <-- Pass selected level here
      />
    </div>
  );
}
