"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useSession } from "next-auth/react";

export default function PlayLobby() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [joinGameId, setJoinGameId] = useState("");
  const [error, setError] = useState("");

  // 1) Redirect or show loading while auth status isn’t ready
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleCreateGame = async () => {
    setError("");
    const newId = uuid();

    const res = await fetch("/api/games/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: newId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to create game");
    } else {
      alert(`Game created! Share this ID: ${data.gameId}`);
      router.push(`/dashboard/play/${data.gameId}`);
    }
  };

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedId = joinGameId.trim();
    const userId = session!.user.id;

    if (!trimmedId) {
      setError("Please enter a Game ID");
      return;
    }

    const res = await fetch("/api/games/join-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: trimmedId, userId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Invalid Game ID");
    } else {
      router.push(`/dashboard/play/${trimmedId}`);
    }
  };

  const handlePlayVsBot = () => {
    router.push("/dashboard/play/bot");
  };

  if (status === "loading") {
    return <p>Loading session…</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <button
        onClick={handleCreateGame}
        className="bg-green-600 text-white px-6 py-3 rounded text-lg hover:bg-green-700"
      >
        Create New Game
      </button>

      <form
        onSubmit={handleJoinGame}
        className="flex flex-col items-center gap-2"
      >
        <input
          type="text"
          value={joinGameId}
          onChange={(e) => setJoinGameId(e.target.value)}
          placeholder="Enter Game ID to Join"
          className="border p-2 rounded w-80"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Join Game
        </button>
      </form>

      <button
        onClick={handlePlayVsBot}
        className="bg-purple-600 text-white px-6 py-3 rounded text-lg hover:bg-purple-700"
      >
        Play vs Bot
      </button>

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
