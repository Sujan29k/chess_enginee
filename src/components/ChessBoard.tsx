"use client";

import { useState, useEffect, useRef } from "react";
import { Chess, Square, Move, PieceSymbol } from "chess.js";
import Image from "next/image";
import { getSocket } from "@/lib/socket";
import ChatBox from "@/components/ChatBox"; // <-- Import ChatBox

export default function ChessBoard({
  gameId,
  playerColor,
  playerId,
  vsBot = false,
  level = 10, // Default bot level
}: {
  gameId: string;
  playerColor: "w" | "b";
  playerId: string;
  vsBot?: boolean;
  level?: number; // Bot difficulty level
}) {
  const [game, setGame] = useState(new Chess());
  const gameRef = useRef(game);
  const socket = getSocket();

  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [promotionMove, setPromotionMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAvailable, setRematchAvailable] = useState(false);
  const [botLevel, setBotLevel] = useState(level); // Default difficulty

  const [capturedPieces, setCapturedPieces] = useState<{
    w: Record<PieceSymbol, number>;
    b: Record<PieceSymbol, number>;
  }>({
    w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
  });

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (vsBot) return;
    socket.emit("join", gameId);

    socket.on(
      "move",
      (move: { from: Square; to: Square; promotion?: PieceSymbol }) => {
        const newGame = new Chess(gameRef.current.fen());
        const result = newGame.move(move);
        if (result) updateGameAfterMove(newGame, result, false);
      }
    );

    socket.on("undo", ({ fen }: { fen: string }) => {
      const newGame = new Chess(fen);
      setGame(newGame);
      setFenHistory((prev) => [...prev.slice(0, -1), fen]);
      setMoveHistory((prev) => prev.slice(0, -1));
      setTurn(newGame.turn());
      setCapturedPieces(recalcCaptures(moveHistory.slice(0, -1)));
    });

    socket.on(
      "opponentQuit",
      ({ playerId: quitterId }: { playerId: string }) => {
        if (quitterId !== playerId) {
          alert("Your opponent has quit the game.");
          setGameOver("Opponent has quit the game.");
          setRematchAvailable(true);
        }
      }
    );

    socket.on("rematchRequest", () => {
      setRematchRequested(true);
      setRematchAvailable(true);
    });

    socket.on("rematch", () => {
      const newGame = new Chess();
      setGame(newGame);
      setFenHistory([newGame.fen()]);
      setMoveHistory([]);
      setCapturedPieces({
        w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
        b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      });
      setTurn("w");
      setGameOver(null);
      setRematchRequested(false);
      setRematchAvailable(false);
      setSelectedSquare(null);
      setLegalMoves([]);
      setPromotionMove(null);
      gameRef.current = newGame;
    });

    return () => {
      socket.off("move");
      socket.off("undo");
      socket.off("opponentQuit");
      socket.off("rematch");
      socket.off("rematchRequest");
    };
  }, [gameId, socket, vsBot, moveHistory, playerId]);

  const updateGameAfterMove = (newGame: Chess, move: Move, isLocal = true) => {
    setGame(newGame);
    setFenHistory((prev) => [...prev, newGame.fen()]);
    setMoveHistory((prev) => [...prev, move]);
    setTurn(newGame.turn());

    if (move.captured) {
      const color = move.color === "w" ? "b" : "w";
      const captured = move.captured as PieceSymbol;
      setCapturedPieces((prev) => ({
        ...prev,
        [color]: {
          ...prev[color],
          [captured]: prev[color][captured] + 1,
        },
      }));
    }

    if (newGame.isCheckmate()) {
      setGameOver(`Checkmate! ${move.color === "w" ? "White" : "Black"} wins`);
      setRematchAvailable(true);
    } else if (newGame.isDraw()) {
      setGameOver("Draw!");
      setRematchAvailable(true);
    }
  };

  const recalcCaptures = (moves: Move[]) => {
    const initial: typeof capturedPieces = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };
    moves.forEach((m) => {
      if (m.captured) {
        const color = m.color === "w" ? "b" : "w";
        const captured = m.captured as PieceSymbol;
        initial[color][captured]++;
      }
    });
    return initial;
  };

  const handleUndo = () => {
    if (fenHistory.length < 2) return;
    const prevFen = fenHistory[fenHistory.length - 2];
    const newGame = new Chess(prevFen);
    setGame(newGame);
    setFenHistory((prev) => prev.slice(0, -1));
    setMoveHistory((prev) => prev.slice(0, -1));
    setTurn(newGame.turn());
    setCapturedPieces(recalcCaptures(moveHistory.slice(0, -1)));
    socket.emit("undo", { gameId, fen: prevFen });
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleQuit = () => {
    socket.emit("quit", { gameId, playerId });
    setGameOver("You have quit the game.");
    setRematchAvailable(true);
  };

  const requestRematch = () => {
    if (rematchRequested) {
      socket.emit("rematch", { gameId });
      const newGame = new Chess();
      setGame(newGame);
      gameRef.current = newGame;
      setMoveHistory([]);
      setTurn("w");
      setGameOver(null);
      setCapturedPieces({
        w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
        b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      });
      setSelectedSquare(null);
      setLegalMoves([]);
      setPromotionMove(null);
      setRematchRequested(false);
    } else {
      socket.emit("rematchRequest", { gameId });
      setRematchRequested(true);
    }
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || turn !== playerColor) return;

    const file = "abcdefgh"[col];
    const rank = `${8 - row}`;
    const square = `${file}${rank}` as Square;

    if (selectedSquare && legalMoves.includes(square)) {
      const newGame = new Chess(game.fen());
      const moveObj = { from: selectedSquare, to: square };

      const verboseMoves = game.moves({
        square: selectedSquare,
        verbose: true,
      });
      const promotionNeeded = verboseMoves.some(
        (m) => m.to === square && m.promotion
      );

      if (promotionNeeded) {
        setPromotionMove(moveObj);
        return;
      }

      const move = newGame.move(moveObj);
      if (move) {
        setSelectedSquare(null);
        setLegalMoves([]);
        if (!vsBot) {
          socket.emit("move", {
            gameId,
            move: { from: move.from, to: move.to },
          });
        }
        updateGameAfterMove(newGame, move);
      }
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === playerColor) {
      const moves = game
        .moves({ square, verbose: true })
        .map((m) => m.to as Square);
      setSelectedSquare(square);
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };
  const handlePromotion = (piece: PieceSymbol) => {
    if (!promotionMove) return;

    const newGame = new Chess(game.fen());
    const move = newGame.move({ ...promotionMove, promotion: piece });

    if (move) {
      updateGameAfterMove(newGame, move);
      setGame(newGame); // Important
      gameRef.current = newGame; // VERY Important
      setSelectedSquare(null);
      setLegalMoves([]);
      setPromotionMove(null);

      if (!vsBot) {
        socket.emit("move", {
          gameId,
          move: {
            from: move.from,
            to: move.to,
            promotion: piece,
          },
        });
      }
    }
  };

  useEffect(() => {
    if (!vsBot || gameOver || turn === playerColor) return;

    const timer = setTimeout(async () => {
      const res = await fetch("/api/bot/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: game.fen(), level: botLevel }),
      });

      const data = await res.json();
      if (!data.move) return;

      const newGame = new Chess(game.fen());
      const result = newGame.move(data.move);
      if (result) {
        updateGameAfterMove(newGame, result, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [vsBot, game, turn, playerColor, gameOver, botLevel]);

  return (
    <>
      <div className="flex gap-6 mt-6">
        {/* Left: Captures */}
        <div className="w-24">
          <h4 className="font-bold mb-2">Black Captured</h4>
          {Object.entries(capturedPieces.b).map(([type, count]) =>
            count > 0 ? (
              <div key={type} className="mb-1">
                <Image
                  src={`/icpieces/b${type.toUpperCase()}.svg`}
                  alt={type}
                  width={30}
                  height={30}
                />
                ×{count}
              </div>
            ) : null
          )}
        </div>

        {/* Center: Board */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold mb-2">Game ID: {gameId}</div>
          <div className="mb-2 font-semibold">
            Turn: {turn === "w" ? "White" : "Black"}
          </div>
          {gameOver && (
            <div className="text-red-500 font-bold mb-2">{gameOver}</div>
          )}

          {rematchAvailable && (
            <button
              onClick={requestRematch}
              className="mb-2 px-4 py-1 bg-blue-600 text-white rounded"
            >
              {rematchRequested ? "Confirm Rematch" : "Rematch"}
            </button>
          )}

          <button
            onClick={handleUndo}
            className="mb-2 px-4 py-1 bg-yellow-400 text-black rounded"
          >
            Undo
          </button>

          <button
            onClick={handleQuit}
            className="mb-4 px-4 py-1 bg-red-500 text-white rounded"
          >
            Quit
          </button>

          <div className="grid grid-cols-8 w-[480px] h-[480px] border-4 border-neutral-800">
            {game.board().map((row, rowIndex) =>
              row.map((_, colIndex) => {
                const square = ("abcdefgh"[colIndex] +
                  (8 - rowIndex)) as Square;
                const piece = game.get(square);
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isHighlighted = legalMoves.includes(square);
                const isSelected = selectedSquare === square;
                let bg = isLight ? "bg-gray-300" : "bg-gray-700";
                if (isHighlighted) bg = "bg-green-400";
                else if (isSelected) bg = "bg-yellow-400";

                return (
                  <div
                    key={square}
                    className={`aspect-square flex items-center justify-center ${bg} cursor-pointer`}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                  >
                    {piece && (
                      <Image
                        src={`/icpieces/${
                          piece.color
                        }${piece.type.toUpperCase()}.svg`}
                        alt={piece.type}
                        width={60}
                        height={60}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: White Captured + Move History */}
        <div className="w-40">
          <div className="mb-4">
            <h4 className="font-bold mb-2">White Captured</h4>
            {Object.entries(capturedPieces.w).map(([type, count]) =>
              count > 0 ? (
                <div key={type} className="mb-1">
                  <Image
                    src={`/icpieces/w${type.toUpperCase()}.svg`}
                    alt={type}
                    width={30}
                    height={30}
                  />
                  ×{count}
                </div>
              ) : null
            )}
          </div>

          <div className="text-sm">
            <h4 className="font-semibold mb-1">Moves:</h4>
            <ol className="list-decimal pl-5 max-h-60 overflow-y-auto">
              {moveHistory.map((m, idx) => (
                <li key={idx}>{`${m.color === "w" ? "White" : "Black"}: ${
                  m.san
                }`}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {!vsBot && (
        <div className="mt-6 flex justify-center text-black">
          <ChatBox gameId={gameId} playerId={playerId} />
        </div>
      )}
      {vsBot && (
        <div className="mb-4 flex items-center gap-2">
          <label htmlFor="difficulty" className="font-semibold">
            Bot Difficulty:
          </label>
          <select
            id="difficulty"
            value={botLevel}
            onChange={(e) => setBotLevel(Number(e.target.value))}
            className="border px-2 py-1 rounded"
          >
            {Array.from({ length: 21 }, (_, i) => (
              <option key={i} value={i}>
                Level {i}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Promotion UI */}
      {promotionMove && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <h2 className="text-lg font-bold mb-2">Choose Promotion</h2>
            <div className="flex gap-4">
              {["q", "r", "n", "b"].map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromotion(p as PieceSymbol)}
                  className="border p-2 hover:bg-gray-200 rounded"
                >
                  <Image
                    src={`/icpieces/${playerColor}${p.toUpperCase()}.svg`}
                    alt={p}
                    width={40}
                    height={40}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
