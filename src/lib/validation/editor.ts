import { z } from "zod";

export const renameSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
});

export const moveSchema = z.object({
  direction: z.enum(["up", "down"]),
});

export const sceneSaveSchema = z.object({
  content: z.string().default(""),
  projectId: z.string().uuid(),
});

export const sceneMemoryResponseSchema = z.object({
  review: z
    .object({
      summary: z.array(z.string()),
      strengths: z.array(z.string()),
      critiques: z.array(z.string()),
      challenge: z.string(),
    })
    .nullable(),
  entities: z.array(
    z.object({
      id: z.string().uuid(),
      kind: z.string(),
      name: z.string(),
      occurrences: z.number().nonnegative(),
      last_seen_chapter: z.number().nullable(),
      details: z.any().nullable(),
    })
  ),
});

export type RenameInput = z.infer<typeof renameSchema>;
export type MoveInput = z.infer<typeof moveSchema>;
export type SceneSaveInput = z.infer<typeof sceneSaveSchema>;
export type SceneMemoryResponse = z.infer<typeof sceneMemoryResponseSchema>;
