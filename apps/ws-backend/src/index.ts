import WebSocket, { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { checkRoomExists, prismaClient } from "@repo/db/db";

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map<number, Set<MyWebSocket>>();
const clients = new Map<string, MyWebSocket>();

interface CachedMessage {
  userId: string;
  senderName: string;
  content: string;
  createdAt: Date;
}
const roomMessages = new Map<number, CachedMessage[]>();
const MAX_CACHE = 50;

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

async function saveMessage(roomId: number, userId: string, content: string) {
  const savedMessage = await prismaClient.message.create({
    data: { roomId, userId, content },
  });

  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  return { ...savedMessage, user };
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

  const cache = roomMessages.get(roomId) || [];
  sendResponse(ws, "history", { roomId, messages: cache });
}

async function sendToRoom(
  roomId: number,
  userId: string,
  message: string,
  ws: MyWebSocket,
) {
  const room = rooms.get(roomId);

  if (!room || !room.has(ws)) {
    sendResponse(ws, "error", { message: `You are not in room ${roomId}` });
    return;
  }

  const saved = await saveMessage(roomId, userId, message);

  const cachedMsg: CachedMessage = {
    userId: saved.userId,
    senderName: saved.user?.name || "Unknown",
    content: saved.content,
    createdAt: saved.createdAt,
  };

  if (!roomMessages.has(roomId)) roomMessages.set(roomId, []);
  const queue = roomMessages.get(roomId)!;
  queue.push(cachedMsg);
  if (queue.length > MAX_CACHE) queue.shift();

  room.forEach((client) => {
    sendResponse(client, "message", cachedMsg);
  });
}

async function autoJoinRooms(ws: MyWebSocket) {
  if (!ws.user) return;
  const userRooms = await prismaClient.userRoom.findMany({
    where: { userId: ws.user.userId },
    select: { roomId: true },
  });

  for (const r of userRooms) {
    await joinRoom(r.roomId, ws);
  }
}

wss.on("connection", async (ws: MyWebSocket, req) => {
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

    await autoJoinRooms(ws);

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
        await sendToRoom(Number(data.roomId), ws.user.userId, data.message, ws);
      }
    });

    sendResponse(ws, "info", { message: "Connected successfully!" });
  } catch (err) {
    ws.close(4002, "Invalid token");
  }
});
