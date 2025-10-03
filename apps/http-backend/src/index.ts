import express from "express";
import { middleware } from "./middleware";
import jwt from "jsonwebtoken";
import {
  SignInSchema,
  SignUpSchema,
  CreateRoomSchema,
} from "@repo/common/types";

const secretKey = "asdasd";

const app = express();

app.use(express.json());

app.post("/signup", async (req, res) => {
  const parseResult = SignUpSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }

  const token = jwt.sign(
    { userId: req.userId, email: parseResult.data.email },
    secretKey,
    { expiresIn: "7d" },
  );

  res.status(201).json({
    success: true,
    data: {
      userId: req.userId,
      email: parseResult.data.email,
      token,
    },
  });

  //db call
});

app.post("/signin", async (req, res) => {
  const parseResult = SignInSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }
  const token = jwt.sign({ userId: req.userId }, secretKey, {
    expiresIn: "7d",
  });

  if (!token) {
    return res.status(500).json({ error: "Could not create token" });
  }

  res.status(201).json({
    success: true,
    data: {
      userId: req.userId,
      email: parseResult.data.email,
      token,
    },
  });
});

app.post("/createRoom", middleware, async (req, res) => {
  const parseResult = CreateRoomSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }
  // db call
  res.json({ roomId: 456 });
});
