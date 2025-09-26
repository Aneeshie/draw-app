import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const middleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"];

  if (!token) return null;

  //if the decoded token exists and jwt is verified that is, the user is authorized then set the userId in the req header and pass on to room

  const decoded = jwt.verify(token, process.env.JWT_SECRET!);

  console.log(
    "this is ur JWT_SECRET FROM HTTP_BACKEND: ",
    process.env.JWT_SECRET
  );

  if (typeof decoded === "string") {
    return null;
  }

  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    return res.status(403).json({
      message: "Could not verify the jwt",
    });
  }
};
