import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws, req) {
  const url = req.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);

  if (typeof decoded === "string") {
    ws.close();
    return null;
  }

  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
});
