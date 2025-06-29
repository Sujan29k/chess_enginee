"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ChessBoard from "@/components/ChessBoard";

export default function GamePage() {
  // 1) require the session (blocks until loaded)
  const { data: session } = useSession({ required: true });

  // 2) grab gameId
  const params = useParams();
  const gameId = Array.isArray(params?.gameId)
    ? params.gameId[0]
    : params?.gameId || "";

  // 3) local state
  const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
  const [error, setError] = useState("");
  const [loadingGame, setLoadingGame] = useState(true);

  // 4) run once, as soon as session & gameId exist
  useEffect(() => {
    if (!session || !session.user.id || !gameId) {
      console.log("Waiting for session & gameId", { session, gameId });
      return;
    }

    const userId = session.user.id;
    console.log("Starting game fetch/join for:", { gameId, userId });

    (async () => {
      try {
        // FETCH current players
        const res = await fetch(`/api/games/get?gameId=${gameId}`);
        console.log("GET /api/games/get status:", res.status);
        const data = await res.json();
        console.log("GET /api/games/get response:", data);

        if (!res.ok) {
          setError(data.error || "Could not load game");
          setLoadingGame(false);
          return;
        }

        const { whitePlayer, blackPlayer } = data;

        // CREATOR = WHITE?
        if (whitePlayer === userId) {
          console.log("You are the white player");
          setPlayerColor("w");
          setLoadingGame(false);
          return;
        }

        // ALREADY BLACK?
        if (blackPlayer === userId) {
          console.log("You are already the black player");
          setPlayerColor("b");
          setLoadingGame(false);
          return;
        }

        // JOIN AS BLACK IF OPEN
        if (!blackPlayer) {
          console.log("Joining as black…");
          const joinRes = await fetch("/api/games/join-player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ gameId, userId }),
          });
          console.log("POST /api/games/join-player status:", joinRes.status);
          const joinData = await joinRes.json();
          console.log("POST /api/games/join-player response:", joinData);

          if (joinRes.ok) {
            setPlayerColor("b");
          } else {
            setError(joinData.error || "Failed to join game");
          }
          setLoadingGame(false);
          return;
        }

        // ROOM FULL
        setError("Game is full or you’re not part of it");
        setLoadingGame(false);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Something went wrong");
        setLoadingGame(false);
      }
    })();
  }, [session, gameId]);

  // 5) render states
  if (loadingGame) return <p>Loading game…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!playerColor) return <p>Unable to determine your role</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Game ID: {gameId}</h1>
      <ChessBoard
        gameId={gameId}
        playerColor={playerColor}
        playerId={session!.user.id}
      />
    </div>
  );
}
