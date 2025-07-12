"use client";
import { useState, useEffect } from "react";

const Leaderboard = () => {
  const [users, setUsers] = useState<
    { _id: string; username: string; points: number }[]
  >([]);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        return res.json();
      })
      .then((data) => setUsers(data.topUsers))
      .catch((error) => console.error(error));
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🏆 Leaderboard</h1>
      <ul className="bg-white shadow rounded p-4 text-black">
        {users.map(
          (
            user: { _id: string; username: string; points: number },
            index: number
          ) => (
            <li key={user._id} className="mb-2 flex justify-between">
              <span>
                {index + 1}. {user.username}
              </span>
              <span>{user.points} pts</span>
            </li>
          )
        )}
      </ul>
    </div>
  );
};

export default Leaderboard;
