"use client";

import { useState, useEffect, useRef } from "react";
import { Chess, Square, Move, PieceSymbol } from "chess.js";
import Image from "next/image";
import { getSocket } from "@/lib/socket";

export default function ChessBoard({
  gameId,
  playerColor,
  playerId,
  vsBot = false,
}: {
  gameId: string;
  playerColor: "w" | "b";
  playerId: string;
  vsBot?: boolean;
}) {
  const [game, setGame] = useState(new Chess());
  const gameRef = useRef(game);

  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [turn, setTurn] = useState<"w" | "b">("w");
  const [gameOver, setGameOver] = useState<string | null>(null);
  const [promotionMove, setPromotionMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const [capturedPieces, setCapturedPieces] = useState<{
    w: Record<PieceSymbol, number>;
    b: Record<PieceSymbol, number>;
  }>({
    w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
  });

  const socket = getSocket();

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (vsBot) return;
    socket.emit("join", gameId);

    const handleMove = (move: {
      from: Square;
      to: Square;
      promotion?: PieceSymbol;
    }) => {
      const newGame = new Chess(gameRef.current.fen());
      const result = newGame.move(move);
      if (result) updateGameAfterMove(newGame, result, false);
    };

    const handleUndoFromSocket = ({ fen }: { fen: string }) => {
      const newGame = new Chess(fen);
      setGame(newGame);
      setFenHistory((prev) => [...prev.slice(0, -1), fen]);
      setMoveHistory((prev) => prev.slice(0, -1));
      setTurn(newGame.turn());
      setCapturedPieces(recalcCaptures(moveHistory.slice(0, -1)));
    };

    socket.on("move", handleMove);
    socket.on("undo", handleUndoFromSocket);

    return () => {
      socket.off("move", handleMove);
      socket.off("undo", handleUndoFromSocket);
    };
  }, [gameId, socket, vsBot, moveHistory]);

  const updateGameAfterMove = async (
    newGame: Chess,
    move: Move,
    isLocal = true
  ) => {
    setGame(newGame);
    setTurn(newGame.turn());
    setFenHistory((prev) => [...prev, newGame.fen()]);
    setMoveHistory((prev) => [...prev, move]);

    if (move.captured) {
      const color = move.color === "w" ? "b" : "w";
      const captured = move.captured as PieceSymbol;
      setCapturedPieces((prev) => ({
        ...prev,
        [color]: { ...prev[color], [captured]: prev[color][captured] + 1 },
      }));
    }

    if (newGame.isCheckmate()) {
      setGameOver(`Checkmate! ${move.color === "w" ? "White" : "Black"} wins`);
      await fetch("/api/move/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
    } else if (newGame.isDraw()) {
      setGameOver("Draw!");
    }

    if (isLocal && !vsBot) {
      await fetch("/api/move/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          from: move.from,
          to: move.to,
          promotion: move.promotion,
        }),
      });
    }

    if (vsBot && playerColor === "w" && newGame.turn() === "b") {
      try {
        const res = await fetch("/api/bot/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fen: newGame.fen() }),
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (res.ok && data?.move) {
          const botGame = new Chess(newGame.fen());
          const botMove = botGame.move(data.move);
          if (botMove) updateGameAfterMove(botGame, botMove, false);
        } else console.error("Bot move failed", data);
      } catch (err) {
        console.error("Bot error", err);
      }
    }
  };

  const recalcCaptures = (history: Move[]) => {
    const init = {
      w: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
      b: { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 },
    };
    return history.reduce((caps, m) => {
      if (m.captured) {
        const clr = m.color === "w" ? "b" : "w";
        caps[clr][m.captured as PieceSymbol]++;
      }
      return caps;
    }, init);
  };

  const handleUndo = (emit = true) => {
    if (fenHistory.length <= 1) return;
    const steps = vsBot ? 2 : 1;
    let newFens = [...fenHistory];
    let newMoves = [...moveHistory];
    for (let i = 0; i < steps && newFens.length > 1; i++) {
      newFens.pop();
      newMoves.pop();
    }
    const prevFen = newFens[newFens.length - 1];
    const newGame = new Chess(prevFen);
    setGame(newGame);
    setFenHistory(newFens);
    setMoveHistory(newMoves);
    setTurn(newGame.turn());
    setCapturedPieces(recalcCaptures(newMoves));
    if (!vsBot && emit) {
      socket.emit("undo", { gameId, fen: prevFen });
    }
  };

  const board = game.board();
  const getPieceImage = (piece: { type: string; color: string }) =>
    `/icpieces/${piece.color}${piece.type.toUpperCase()}.svg`;

  const handleSquareClick = (row: number, col: number) => {
    if (gameOver || turn !== playerColor) return;

    const file = "abcdefgh"[col];
    const rank = `${8 - row}`;
    const square = `${file}${rank}` as Square;

    if (selectedSquare && legalMoves.includes(square)) {
      const newGame = new Chess(game.fen());
      const moveObj = { from: selectedSquare, to: square };
      const promotionNeeded = game
        .moves({ square: selectedSquare, verbose: true })
        .find((m) => m.to === square && m.promotion);

      if (promotionNeeded) {
        setPromotionMove(moveObj);
        return;
      }

      const move = newGame.move({ ...moveObj, promotion: "q" });
      if (move) {
        setSelectedSquare(null);
        setLegalMoves([]);
        if (!vsBot) {
          socket.emit("move", {
            gameId,
            move: { from: move.from, to: move.to, promotion: move.promotion },
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
      if (!vsBot) {
        socket.emit("move", {
          gameId,
          move: { from: move.from, to: move.to, promotion: piece },
        });
      }
      updateGameAfterMove(newGame, move);
      setPromotionMove(null);
    }
  };

  return (
    <div className="flex justify-center items-center gap-6 mt-6">
      {/* Board and Controls */}
      <div className="flex flex-col items-center">
        <div className="mb-2 font-semibold">
          Turn: {turn === "w" ? "White" : "Black"}
        </div>
        {gameOver && <div className="text-red-500 font-bold">{gameOver}</div>}
        <button
          onClick={() => handleUndo()}
          className="mb-2 px-4 py-1 bg-yellow-400 text-black rounded hover:bg-yellow-500"
        >
          Undo Move
        </button>
        <div className="grid grid-cols-8 w-[480px] h-[480px] border-4 border-neutral-800">
          {board.map((row, rowIndex) =>
            row.map((square, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const file = "abcdefgh"[colIndex];
              const rank = `${8 - rowIndex}`;
              const squareName = `${file}${rank}` as Square;
              const isHighlighted = legalMoves.includes(squareName);
              const isSelected = selectedSquare === squareName;

              let squareColor = isLight ? "bg-gray-300" : "bg-gray-700";
              if (isHighlighted) squareColor = "bg-green-400";
              else if (isSelected) squareColor = "bg-yellow-400";

              return (
                <div
                  key={squareName}
                  className={`aspect-square flex items-center justify-center ${squareColor} cursor-pointer`}
                  onClick={() => handleSquareClick(rowIndex, colIndex)}
                >
                  {square && (
                    <Image
                      src={getPieceImage(square)}
                      alt={`${square.color}${square.type}`}
                      width={60}
                      height={60}
                      className="w-4/5 h-4/5 object-contain"
                      priority
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {promotionMove && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
            <div className="bg-white p-4 rounded-md flex gap-4">
              {(["q", "r", "b", "n"] as PieceSymbol[]).map((p) => (
                <Image
                  key={p}
                  src={`/icpieces/${game.turn()}${p.toUpperCase()}.svg`}
                  alt={p}
                  width={50}
                  height={50}
                  onClick={() => handlePromotion(p)}
                  className="cursor-pointer hover:scale-110 transition-transform"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Move History */}
      <div className="w-72 border p-4 bg-white rounded shadow">
        <h3 className="text-lg font-bold mb-2">Move History</h3>
        <ol className="list-decimal ml-4 space-y-1 text-sm text-black">
          {moveHistory.map((move, index) => (
            <li key={index}>
              {move.color === "w" ? "White" : "Black"}: {move.from} → {move.to}
              {move.promotion && ` = ${move.promotion.toUpperCase()}`}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
