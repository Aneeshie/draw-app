import express from "express";
import { middleware } from "./middleware";
import jwt from "jsonwebtoken";
import { prismaClient } from "@repo/db/db";
import bcrypt from "bcrypt";

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

  const hashedPassword = await bcrypt.hash(parseResult.data.password, 10);

  try {
    const user = await prismaClient.user.create({
      data: {
        email: parseResult.data.email,
        password: hashedPassword,
        name: parseResult.data.username,
      },
    });

    if (!user) {
      return res.status(500).json({ error: "Could not create user" });
    }

    req.userId = user.id;

    const token = jwt.sign(
      { userId: req.userId, email: parseResult.data.email },
      secretKey,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      data: {
        userId: req.userId,
        email: parseResult.data.email,
        token,
      },
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/signin", async (req, res) => {
  const parseResult = SignInSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: parseResult.data.email,
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(
      parseResult.data.password,
      user.password,
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    req.userId = user.id;

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
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Could not sign in user" });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parseResult = CreateRoomSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.message });
  }

  try {
    const room = await prismaClient.room.create({
      data: {
        name: parseResult.data.name,
      },
    });

    await prismaClient.userRoom.create({
      data: {
        userId: req.userId!,
        roomId: room.id,
      },
    });

    return res.status(201).json({ success: true, data: room });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Could not create room" });
  }
});

app.listen(3001, () => {
  console.log("Listening to port 3001");
});
