import WebSocket, { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { checkRoomExists } from "@repo/db/db";

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map<number, Set<MyWebSocket>>();
const clients = new Map<string, MyWebSocket>();

interface AuthPayload extends JwtPayload {
  userId: string;
}

interface MyWebSocket extends WebSocket {
  user?: AuthPayload;
}

function sendResponse(ws: MyWebSocket, type: string, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

async function joinRoom(roomId: number, ws: MyWebSocket) {
  const exists = await checkRoomExists(roomId);

  if (!exists) {
    sendResponse(ws, "error", { message: `Room ${roomId} does not exist` });
    return;
  }

  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(ws);

  sendResponse(ws, "connected", { roomId, message: `Joined room ${roomId}` });
}

function sendToRoom(
  roomId: number,
  userId: string,
  message: string,
  ws: MyWebSocket,
) {
  const room = rooms.get(roomId);

  if (!room) {
    sendResponse(ws, "error", { message: `Room ${roomId} does not exist` });
    return;
  }

  if (!room.has(ws)) {
    sendResponse(ws, "error", { message: `You are not in room ${roomId}` });
    return;
  }

  room.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendResponse(client, "message", { roomId, userId, message });
    }
  });
}

wss.on("connection", (ws: MyWebSocket, req) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "No token provided");
    return;
  }

  try {
    const payload = jwt.verify(token, "asdasd") as AuthPayload;
    ws.user = payload;

    clients.set(payload.userId, ws);

    ws.on("close", () => {
      clients.delete(payload.userId);
      rooms.forEach((set, id) => {
        set.delete(ws);
        if (set.size === 0) rooms.delete(id);
      });
    });

    ws.on("message", async (msg) => {
      let data;
      try {
        data = JSON.parse(msg.toString());
      } catch {
        sendResponse(ws, "error", { message: "Invalid JSON" });
        return;
      }

      if (data.type === "join") {
        await joinRoom(Number(data.roomId), ws);
      }

      if (data.type === "message") {
        if (!ws.user?.userId) {
          sendResponse(ws, "error", { message: "Unauthorized" });
          return;
        }
        sendToRoom(Number(data.roomId), ws.user.userId, data.message, ws);
      }
    });

    sendResponse(ws, "info", { message: "Connected successfully!" });
  } catch (err) {
    ws.close(4002, "Invalid token");
  }
});
