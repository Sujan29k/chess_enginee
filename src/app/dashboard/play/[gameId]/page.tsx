"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ChessBoard from "@/components/ChessBoard";
import styles from "./game.module.css";

export default function GamePage() {
  const { data: session } = useSession({ required: true });
  const params = useParams();
  const gameId = Array.isArray(params?.gameId)
    ? params.gameId[0]
    : params?.gameId || "";

  const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
  const [error, setError] = useState("");
  const [loadingGame, setLoadingGame] = useState(true);

  useEffect(() => {
    if (!session || !session.user.id || !gameId) return;

    const userId = session.user.id;

    (async () => {
      try {
        const res = await fetch(`/api/games/get?gameId=${gameId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load game");
          setLoadingGame(false);
          return;
        }

        const { whitePlayer, blackPlayer } = data;

        if (whitePlayer === userId) {
          setPlayerColor("w");
        } else if (blackPlayer === userId) {
          setPlayerColor("b");
        } else if (!blackPlayer) {
          const joinRes = await fetch("/api/games/join-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, userId }),
          });
          const joinData = await joinRes.json();

          if (joinRes.ok) {
            setPlayerColor("b");
          } else {
            setError(joinData.error || "Failed to join game");
          }
        } else {
          setError("Game is full or you’re not part of it");
        }
      } catch (err) {
        setError("Something went wrong");
      } finally {
        setLoadingGame(false);
      }
    })();
  }, [session, gameId]);

  if (loadingGame) return <p className={styles.loadingMessage}>Loading game…</p>;
  if (error) return <p className={styles.errorMessage}>{error}</p>;
  if (!playerColor) return <p className={styles.errorMessage}>Unable to determine your role</p>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <h1 className={styles.gameHeader}>Game ID: {gameId}</h1>
        <div className={styles.chessArea}>
          <ChessBoard
            gameId={gameId}
            playerColor={playerColor}
            playerId={session!.user.id}
          />
        </div>
      </div>
    </div>
  );
}