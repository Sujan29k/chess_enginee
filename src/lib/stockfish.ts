export function createStockfishWorker(): Worker {
  const worker = new Worker(new URL("/stockfish.js", import.meta.url), {
    type: "module",
  });

  worker.postMessage("uci");
  return worker;
}
