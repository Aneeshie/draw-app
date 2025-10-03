import z from "zod";

export const SignUpSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  username: z.string().min(3).max(20),
});

export const SignInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const CreateRoomSchema = z.object({
  name: z.string().min(3).max(50),
});
