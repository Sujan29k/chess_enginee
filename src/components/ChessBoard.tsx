"use client";

import { useState, useEffect, useRef } from "react";
import { Chess, Square, Move, PieceSymbol } from "chess.js";
import Image from "next/image";
import { getSocket } from "@/lib/socket";

export default function ChessBoard({
  gameId,
  playerColor,
  playerId,
}: {
  gameId: string;
  playerColor: "w" | "b";
  playerId: string;
}) {
  // Main chess game state
  const [game, setGame] = useState(new Chess());
  const gameRef = useRef(game);

  // Keep selected square & legal moves for player
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // Track whose turn it is ("w" or "b")
  const [turn, setTurn] = useState<"w" | "b">("w");

  // Track game over message
  const [gameOver, setGameOver] = useState<string | null>(null);

  // Promotion handling (optional)
  const [promotionMove, setPromotionMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const socket = getSocket();

  // Keep gameRef updated to latest game state for socket events
  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Setup socket listeners once on mount
  useEffect(() => {
    socket.emit("join", gameId);

    const handleMove = (move: {
      from: Square;
      to: Square;
      promotion?: PieceSymbol;
    }) => {
      const newGame = new Chess(gameRef.current.fen());
      const result = newGame.move(move);
      if (result) {
        updateGameAfterMove(newGame, result);
        setSelectedSquare(null);
        setLegalMoves([]);
      }
    };

    socket.on("move", handleMove);

    return () => {
      socket.off("move", handleMove);
    };
  }, [gameId, socket]);

  // Update game state and turn after a move
  const updateGameAfterMove = (newGame: Chess, move: Move) => {
    setGame(newGame);
    setTurn(newGame.turn());

    if (newGame.isCheckmate()) {
      setGameOver(`Checkmate! ${move.color === "w" ? "White" : "Black"} wins`);
    } else if (newGame.isDraw()) {
      setGameOver("Draw!");
    }
  };

  // Handle player clicking a square on the board
  const handleSquareClick = (row: number, col: number) => {
    if (gameOver) return;
    if (turn !== playerColor) return; // only allow move on player's turn

    const file = "abcdefgh"[col];
    const rank = `${8 - row}`;
    const square = `${file}${rank}` as Square;

    if (selectedSquare && legalMoves.includes(square)) {
      // Try move with default promotion queen
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
        setGame(newGame);
        setTurn(newGame.turn());
        socket.emit("move", {
          gameId,
          move: { from: move.from, to: move.to, promotion: move.promotion },
        });
      }
      return;
    }

    // Select piece to move
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

  // Handle pawn promotion piece choice
  const handlePromotion = (piece: PieceSymbol) => {
    if (!promotionMove) return;
    const newGame = new Chess(game.fen());
    const move = newGame.move({ ...promotionMove, promotion: piece });
    if (move) {
      setGame(newGame);
      setTurn(newGame.turn());
      socket.emit("move", {
        gameId,
        move: { from: move.from, to: move.to, promotion: piece },
      });
      setPromotionMove(null);
    }
  };

  // Render board squares
  const board = game.board();
  const getPieceImage = (piece: { type: string; color: string }) =>
    `/icpieces/${piece.color}${piece.type.toUpperCase()}.svg`;

  return (
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold mb-2">Game ID: {gameId}</div>
      <div className="mb-2 font-semibold">
        Turn: {turn === "w" ? "White" : "Black"}
      </div>
      {gameOver && <div className="text-red-500 font-bold">{gameOver}</div>}
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

      {/* Promotion modal */}
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
  );
}
