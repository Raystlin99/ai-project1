import { z } from 'zod';

export const FactSchema = z.object({
  text: z.string().min(10).max(200),
  voiceNarration: z.string().min(10).max(300),
  imageDescription: z.string().min(20).max(500),
});

export const VideoScriptSchema = z.object({
  title: z.string().min(5).max(100),
  totalDuration: z.number().min(60).max(90),
  backgroundMood: z.string().min(3).max(100),
  facts: z.array(FactSchema).length(10),
});

export type Fact = z.infer<typeof FactSchema>;
export type VideoScript = z.infer<typeof VideoScriptSchema>;
