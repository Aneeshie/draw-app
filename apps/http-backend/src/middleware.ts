import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secretKey = "asdasd";

export function middleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["authorization"];

  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // verify token
  const decoded = jwt.verify(token, secretKey);

  if (!decoded) {
    return res.status(403).json({ error: "Invalid token" });
  }

  if (typeof decoded === "string") {
    return null;
  }

  req.userId = decoded.userId;
  next();
}
