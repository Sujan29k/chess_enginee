"use client";
import { useEffect, useState } from "react";
import styles from "./leaderboard.module.css"; // Adjust path as needed

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
    <div className={styles.leaderboardContainer}>
      <div className={styles.leaderboardCard}>
        <h1 className={styles.leaderboardTitle}>🏆 Leaderboard</h1>
        <ul>
          {users.map((user, index) => (
            <li
              key={user._id}
              className={`${styles.userItem} ${
                index === 0
                  ? styles.firstPlace
                  : index === 1
                  ? styles.secondPlace
                  : index === 2
                  ? styles.thirdPlace
                  : ""
              }`}
            >
              <span>
                #{index + 1} — {user.username}
              </span>
              <span>{user.points} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Leaderboard;
