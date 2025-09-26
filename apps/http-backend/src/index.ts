import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import {
  CreateRoom,
  CreateSignInSchema,
  CreateSignUpSchema,
} from "@repo/common/types";

dotenv.config({ path: require("path").resolve(__dirname, "../../../.env") });

const app = express();

app.use(express.json());

app.post("/signin", (req, res) => {
  //db call
  const parsedData = CreateSignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "Incorrect inputs",
    });
  }
});

app.post("/signup", (req, res) => {
  //db call
  const parsedData = CreateSignUpSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.json({
      message: "incorrect inputs",
    });
  }

  const userId = 1;
  const token = jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET!
  );
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
