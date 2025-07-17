"use client";

import { useSession, signOut } from "next-auth/react"; // ✅ import signOut
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

      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button
          onClick={() => router.push("/dashboard/play")}
          className={styles.lobbyButton}
        >
          Go to Lobby
        </button>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })} // ✅ logout here
          className={styles.logoutButton}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
