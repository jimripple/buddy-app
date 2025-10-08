import { z } from "zod";

export const reviewRequestSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
});

export const reviewResponseSchema = z.object({
  summary: z.array(z.string()),
  strengths: z.array(z.string()),
  critiques: z.array(z.string()),
  challenge: z.string(),
});

export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
export type ReviewResponseOutput = z.infer<typeof reviewResponseSchema>;
