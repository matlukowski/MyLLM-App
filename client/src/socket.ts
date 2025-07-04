import { io, Socket } from "socket.io-client";
const server_url = "http://localhost:3001";

export const socket: Socket = io(server_url, {
  autoConnect: false,
});
