"use client";

import ChessBoard from "@/components/ChessBoard";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./bot.module.css";

export default function BotGamePage() {
  const [playerId, setPlayerId] = useState("");
  const [gameReady, setGameReady] = useState(false);
  const [level, setLevel] = useState(10);

  useEffect(() => {
    setPlayerId(uuidv4());
  }, []);

  const handleStart = () => {
    setGameReady(true);
  };

  if (!gameReady) {
    return (
      <div className={styles.botContainer}>
        <h2 className={styles.title}>Select Bot Difficulty</h2>
        <select
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className={styles.select}
        >
          {Array.from({ length: 21 }, (_, i) => (
            <option key={i} value={i}>
              Level {i}
            </option>
          ))}
        </select>
        <button onClick={handleStart} className={styles.button}>
          Start Game
        </button>
      </div>
    );
  }

  return (
    <div className={styles.boardWrapper}>
      <ChessBoard
        gameId="vs-bot"
        playerColor="w"
        vsBot={true}
        playerId={playerId}
        level={level}
      />
    </div>
  );
}
