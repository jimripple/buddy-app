import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ required_error: "Enter your email" }).email("Enter a valid email"),
  redirectTo: z.string().optional(),
});
