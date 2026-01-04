import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { join } from 'path';
import type { ScenePlan } from '../schemas/scene-plan.schema';

const createSlug = (theme: string): string => {
  return theme
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const ensureImagesDir = async (): Promise<string> => {
  const imagesDir = join(process.cwd(), 'output', 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  return imagesDir;
};

const generateImageUrl = (prompt: string): string => {
  const encodedPrompt = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1920&nologo=true&enhance=true`;
};

const downloadImage = async (url: string, filePath: string, retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      await fs.writeFile(filePath, buffer);
      return;
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      console.log(`    ⚠ Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

export const generateImages = async (
  plan: ScenePlan,
  theme: string
): Promise<string[]> => {
  console.log('Generating images with Pollinations.ai...');
  
  const imagesDir = await ensureImagesDir();
  const slug = createSlug(theme);
  const timestamp = Date.now();
  const imagePaths: string[] = [];

  for (let i = 0; i < plan.scenes.length; i++) {
    const scene = plan.scenes[i];
    const sceneNumber = i + 1;
    
    console.log(`  [${sceneNumber}/10] Generating image for scene ${sceneNumber}...`);
    
    const imageUrl = generateImageUrl(scene.imagePrompt);
    const fileName = `${slug}-scene-${sceneNumber}-${timestamp}.png`;
    const filePath = join(imagesDir, fileName);
    
    try {
      await downloadImage(imageUrl, filePath);
      imagePaths.push(filePath);
      console.log(`    ✓ Saved: ${fileName}`);
    } catch (error) {
      console.error(`    ✗ Failed to generate image for scene ${sceneNumber}:`, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
    
    // Small delay to avoid overwhelming the API
    if (i < plan.scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`✓ All ${imagePaths.length} images generated successfully`);
  return imagePaths;
};

// Another way to generate images using OpenAI's image generation API
// https://platform.openai.com/docs/guides/image-generation?api=image&lang=javascript&utm_source=chatgpt.com

// import OpenAI from "openai";
// import fs from "fs";
// const openai = new OpenAI();

// const prompt = `
// A children's book drawing of a veterinarian using a stethoscope to 
// listen to the heartbeat of a baby otter.
// `;

// const result = await openai.images.generate({
//     model: "gpt-image-1",
//     prompt,
// });

// // Save the image to a file
// const image_base64 = result.data[0].b64_json;
// const image_bytes = Buffer.from(image_base64, "base64");
// fs.writeFileSync("otter.png", image_bytes);