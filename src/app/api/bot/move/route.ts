import { NextRequest } from "next/server";
import path from "path";
import { spawn } from "child_process";

export async function POST(req: NextRequest) {
  const { fen, level = 10 } = await req.json(); // Default level is 10
  const stockfishPath = path.resolve("stockfish/stockfish/stockfish-macos-m1-apple-silicon");

  return new Promise((resolve) => {
    try {
      const engine = spawn(stockfishPath);
      let bestMove = "";

      engine.stdin.write("uci\n");
      engine.stdin.write(`setoption name Skill Level value ${level}\n`);
      engine.stdin.write(`position fen ${fen}\n`);
      engine.stdin.write("go depth 15\n");

      engine.stdout.on("data", (data) => {
        const lines = data.toString().split("\n");
        for (const line of lines) {
          if (line.startsWith("bestmove")) {
            bestMove = line.split(" ")[1];
            engine.stdin.end();

            return resolve(
              Response.json({
                move: bestMove
                  ? {
                      from: bestMove.slice(0, 2),
                      to: bestMove.slice(2, 4),
                      promotion:
                        bestMove.length > 4 ? bestMove.slice(4) : undefined,
                    }
                  : null,
              })
            );
          }
        }
      });

      engine.on("error", (err) => {
        console.error("Stockfish engine failed:", err);
        resolve(Response.json({ error: "Stockfish error" }, { status: 500 }));
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      resolve(
        Response.json({ error: "Unexpected server error" }, { status: 500 })
      );
    }
  });
}
