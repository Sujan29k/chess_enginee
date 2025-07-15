"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status]);

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.welcomeText}>Welcome, {session?.user?.name}</h1>
      <button
        onClick={() => router.push("/dashboard/play")}
        className={styles.lobbyButton}
      >
        Go to Lobby
      </button>
    </div>
  );
}
