"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

type ChatBoxProps = {
  gameId: string;
  playerId: string;
};

export default function ChatBox({ gameId, playerId }: ChatBoxProps) {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const socket = getSocket();

  useEffect(() => {
    socket.emit("join", gameId);

    socket.on("chatMessage", (data: { id: string; text: string }) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off("chatMessage");
    };
  }, [socket, gameId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const message = { id: playerId, text: input.trim() };
    socket.emit("chatMessage", { gameId, ...message });
    setMessages((prev) => [...prev, message]);
    setInput("");
  };

  return (
    <div className="w-[320px] max-h-[300px] bg-white border rounded-lg shadow-lg p-3 flex flex-col">
      <div className="flex-1 overflow-y-auto mb-2 border-b pb-2">
        {messages.map((msg, idx) => (
          <div key={idx} className="text-sm">
            <strong>{msg.id === playerId ? "You" : "Opponent"}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Type a message"
        />
        <button
          onClick={sendMessage}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Send
        </button>
      </div>
    </div>
  );
}
