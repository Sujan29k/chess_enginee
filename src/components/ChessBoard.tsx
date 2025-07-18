"use client";

import { useState, useEffect, useRef } from "react";
import { Chess, Square, Move, PieceSymbol } from "chess.js";
import Image from "next/image";
import { getSocket } from "@/lib/socket";
import ChatBox from "@/components/ChatBox"; // <-- Import ChatBox
import styles from "@/styles/ChessBoard.module.css";
import { Undo2, LogOut, TimerIcon, Volume2 } from "lucide-react";

export default function ChessBoard({
  gameId,
  playerColor,
  playerId,
  vsBot = false,
  level = 10,
}: {
  gameId: string;
  playerColor: "w" | "b";
  playerId: string;
  vsBot?: boolean;
  level?: number;
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
  const [botLevel, setBotLevel] = useState(level);

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
      async ({ playerId: quitterId }: { playerId: string }) => {
        if (quitterId !== playerId) {
          alert("Your opponent has quit the game.");
          setGameOver("Opponent has quit the game.");
          setRematchAvailable(true);

          // ✅ Award 20 points if multiplayer
          if (!vsBot) {
            try {
              const res = await fetch("/api/games/win", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  winnerId: playerId,
                  type: "player",
                }),
              });

              const result = await res.json();
              console.log("✅ Result from /api/games/win:", result);
            } catch (err) {
              console.error("❌ Failed to award points on opponent quit:", err);
              alert("Failed to update your points. Please try again later.");
            }
          }
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

  const updateGameAfterMove = async (
    newGame: Chess,
    move: Move,
    isLocal = true
  ) => {
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

      const winner = move.color;
      if (playerColor === winner) {
        try {
          await fetch("/api/game/win", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              winnerId: playerId,
              type: vsBot ? "bot" : "player",
              botLevel: vsBot ? botLevel : undefined,
            }),
          });
        } catch (error) {
          console.error("Failed to update points:", error);
          alert("Failed to update your points. Please try again later.");
        }
      }
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
      <div className={styles.mainContainer}>
        <div className={styles.leftSection}>
          <div className={styles.sidePanel}>
            <h4 className="font-bold mb-2">Black Captured</h4>
            <div className={styles.capturedRow}>
              {Object.entries(capturedPieces.b).map(([type, count]) =>
                count > 0 ? (
                  <div key={type} className={styles.capturedItem}>
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
          </div>

          <div className={styles.boardPanel}>
            <div className="text-xl font-bold mb-2 flex justify-between items-center w-full">
              <span>Game ID: {gameId}</span>
              <TimerIcon className="text-blue-500" size={22} />
            </div>
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
            <div className="flex gap-3 mb-4">
              <Undo2
                className="cursor-pointer text-yellow-400 hover:text-yellow-300"
                size={28}
                onClick={handleUndo}
              />
              <LogOut
                className="cursor-pointer text-red-500 hover:text-red-400"
                size={28}
                onClick={handleQuit}
              />
            </div>

            <div className={styles.boardGrid}>
              {game.board().map((row, rowIndex) =>
                row.map((_, colIndex) => {
                  const square = ("abcdefgh"[colIndex] +
                    (8 - rowIndex)) as Square;
                  const piece = game.get(square);
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isHighlighted = legalMoves.includes(square);
                  const isSelected = selectedSquare === square;

                  let squareClass = isLight ? styles.light : styles.dark;
                  if (isHighlighted) squareClass = styles.highlight;
                  else if (isSelected) squareClass = styles.selected;

                  return (
                    <div
                      key={square}
                      className={`${styles.square} ${squareClass}`}
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

            {vsBot && (
              <div className="mt-4 flex items-center gap-2">
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
          </div>

          <div className={styles.sidePanel}>
            <h4 className="font-bold mb-2">White Captured</h4>
            <div className={styles.capturedRow}>
              {Object.entries(capturedPieces.w).map(([type, count]) =>
                count > 0 ? (
                  <div key={type} className={styles.capturedItem}>
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
            <div className="mt-4">
              <h4 className="font-semibold mb-1">Moves:</h4>
              <div className={styles.moveListWrapper}>
                <div className={styles.moveList}>
                  {moveHistory.map((m, idx) => (
                    <div key={idx} className={styles.moveItem}>
                      {m.color === "w" ? "W" : "B"}: {m.san}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!vsBot && (
          <div className={styles.rightChat}>
            <ChatBox gameId={gameId} playerId={playerId} />
          </div>
        )}
      </div>

      {promotionMove && (
        <div className={styles.promotionOverlay}>
          <div className={styles.promotionDialog}>
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
