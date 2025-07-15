"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import styles from "@/styles/ChatBox.module.css";

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
    <div className={styles.chatBox}>
      <div className={styles.messages}>
        {messages.map((msg, idx) => (
          <div key={idx} className={styles.message}>
            <strong>{msg.id === playerId ? "You" : "Opponent"}:</strong>{" "}
            {msg.text}
          </div>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className={styles.inputField}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className={styles.sendButton}>
          Send
        </button>
      </div>
    </div>
  );
}
