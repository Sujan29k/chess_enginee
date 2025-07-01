import { NextRequest } from "next/server";
import path from "path";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const { fen } = await req.json();
  const stockfishPath = path.resolve("public/stockfish/stockfish/stockfish");

  return new Promise((resolve) => {
    const engine = spawn(stockfishPath);
    let bestMove = "";

    engine.stdin.write("uci\n");
    engine.stdin.write(`position fen ${fen}\n`);
    engine.stdin.write("go depth 15\n");

    engine.stdout.on("data", (data) => {
      const lines = data.toString().split("\n");
      for (const line of lines) {
        if (line.startsWith("bestmove")) {
          bestMove = line.split(" ")[1];
          engine.stdin.end();
          resolve(
            Response.json({
              move: {
                from: bestMove.slice(0, 2),
                to: bestMove.slice(2, 4),
                promotion: bestMove.length > 4 ? bestMove.slice(4) : undefined,
              },
            })
          );
        }
      }
    });
  });
}
