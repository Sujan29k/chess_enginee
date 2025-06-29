// lib/socket.ts
import { io } from "socket.io-client";

let socket: any;
export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:3001"); // Match server port
  }
  return socket;
};
