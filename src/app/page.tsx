import Chessboard from "@/components/ChessBoard";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-900">
      <Link href="/login" className="text-white">
        login
      </Link>
    </main>
  );
}
