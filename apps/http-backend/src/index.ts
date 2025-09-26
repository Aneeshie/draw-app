import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import {
  CreateRoom,
  CreateSignInSchema,
  CreateSignUpSchema,
} from "@repo/common/types";

import { prismaClient } from "@repo/db/client";

dotenv.config({ path: require("path").resolve(__dirname, "../../../.env") });

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const app = express();

app.use(express.json());

app.post("/signin", async (req, res) => {
  const parsedData = CreateSignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      sucess: false,
      message: "Incorrect inputs",
      errors: parsedData.error,
    });
  }

  try {
    const user = await prismaClient.user.findUnique({
      where: {
        email: parsedData.data.email,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "the user does not exist",
      });
    }

    const isAuth = bcrypt.compare(parsedData.data.password, user.password);

    if (!isAuth) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(200).json({
      success: true,
      message: "Successfully signed in",
      name: user.name,
      token,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "internal server error",
    });
  }
});

app.post("/signup", async (req, res) => {
  //db call
  const parsedData = CreateSignUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({
      success: false,
      message: "incorrect inputs",
      errors: parsedData.error,
    });
  }

  try {
    const existingUser = await prismaClient.user.findUnique({
      where: {
        email: parsedData.data.email,
      },
    });

    if (existingUser) {
      return res
        .json({
          success: false,
          message: "the user already exists",
        })
        .status(409);
    }
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    const user = await prismaClient.user.create({
      data: {
        name: parsedData.data.name,
        email: parsedData.data.email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      success: true,
      message: "user created successfully",
      data: {
        name: user.name,
        token,
      },
    });
  } catch (e) {
    return res.status(401).json({
      message: "could not create user",
    });
  }
});

app.post("/room", (req, res) => {
  const parsedData = CreateRoom.safeParse(req.body);
  if (!parsedData) {
    return res.json({
      message: "incorrect inputs",
    });
  }

  return res.json({
    roomId: 132,
  });

  //
});

app.listen(3001, () => {
  console.log("server is running on port 3001: ", process.env.JWT_SECRET);
});
