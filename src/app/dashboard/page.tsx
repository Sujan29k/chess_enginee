"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Welcome, {session?.user?.name}</h1>
      <button
        onClick={() => router.push("/dashboard/play")}
        className="bg-blue-500 px-4 py-2 text-white rounded"
      >
        Go to Lobby
      </button>
    </div>
  );
}
