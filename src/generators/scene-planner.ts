import { promises as fs } from 'fs';
import { join } from 'path';
import type { VideoScript } from '../schemas/video-script.schema';
import { ScenePlanSchema, type ScenePlan, type Scene } from '../schemas/scene-plan.schema';

const createSlug = (theme: string): string => {
  return theme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const ensureOutputDir = async (): Promise<void> => {
  const outputDir = join(process.cwd(), 'output');
  await fs.mkdir(outputDir, { recursive: true });
};

const refineImagePrompt = (originalDescription: string, sceneNumber: number): string => {
  const basePrompt = originalDescription;
  const styleModifiers = 'cinematic, high quality, 1080x1920 vertical format, Instagram Reels optimized, professional photography';
  return `${basePrompt}, ${styleModifiers}, scene ${sceneNumber} of 10`;
};

const calculateSceneTiming = (totalDuration: number, factCount: number): number[] => {
  const baseDuration = Math.floor(totalDuration / factCount);
  const remainder = totalDuration % factCount;
  
  const durations: number[] = Array(factCount).fill(baseDuration);
  
  for (let i = 0; i < remainder; i++) {
    durations[i]++;
  }
  
  return durations;
};

export const planScenes = async (
  script: VideoScript,
  theme: string
): Promise<{ plan: ScenePlan; filePath: string }> => {
  console.log('Planning scenes with timing...');

  const sceneDurations = calculateSceneTiming(script.totalDuration, script.facts.length);
  
  let currentTime = 0;
  const scenes: Scene[] = script.facts.map((fact, index) => {
    const duration = sceneDurations[index];
    const startTime = currentTime;
    const endTime = currentTime + duration;
    currentTime = endTime;

    return {
      sceneId: index + 1,
      startTime,
      endTime,
      duration,
      factText: fact.text,
      voiceNarration: fact.voiceNarration,
      imagePrompt: refineImagePrompt(fact.imageDescription, index + 1),
    };
  });

  const plan: ScenePlan = {
    title: script.title,
    totalDuration: script.totalDuration,
    backgroundMood: script.backgroundMood,
    scenes,
  };

  console.log('Validating scene plan against schema...');
  const validatedPlan = ScenePlanSchema.parse(plan);
  console.log('✓ Scene plan validation passed');

  await ensureOutputDir();

  const slug = createSlug(theme);
  const timestamp = Date.now();
  const fileName = `${slug}-scenes-${timestamp}.json`;
  const filePath = join(process.cwd(), 'output', fileName);

  await fs.writeFile(filePath, JSON.stringify(validatedPlan, null, 2), 'utf-8');
  console.log(`✓ Scene plan saved to: ${filePath}`);

  return { plan: validatedPlan, filePath };
};
