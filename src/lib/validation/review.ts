import { z } from "zod";

export const reviewRequestSchema = z.object({
  projectId: z.string().uuid(),
  sceneId: z.string().uuid(),
});

export const reviewResponseSchema = z.object({
  summary: z.string().min(1),
  clarity: z.number().min(0).max(10),
  pacing: z.number().min(0).max(10),
  show_vs_tell: z.number().min(0).max(10),
  suggestions: z.array(z.string()).length(5),
});

export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
export type ReviewResponseOutput = z.infer<typeof reviewResponseSchema>;
