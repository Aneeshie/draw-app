import z, { email } from "zod";

export const CreateSignInSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export const CreateSignUpSchema = z.object({
  email: z.email(),
  password: z.string(),
  name: z.string().min(2),
});

export const CreateRoom = z.object({
  name: z.string(),
});
