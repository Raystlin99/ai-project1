import { z } from 'zod';

export const SceneSchema = z.object({
  sceneId: z.number().min(1).max(10),
  startTime: z.number().min(0),
  endTime: z.number().positive(),
  duration: z.number().min(6).max(9),
  factText: z.string(),
  voiceNarration: z.string(),
  imagePrompt: z.string(),
});

export const ScenePlanSchema = z.object({
  title: z.string(),
  totalDuration: z.number().min(60).max(90),
  backgroundMood: z.string(),
  scenes: z.array(SceneSchema).length(10),
});

export type Scene = z.infer<typeof SceneSchema>;
export type ScenePlan = z.infer<typeof ScenePlanSchema>;
