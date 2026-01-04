import { Ollama } from 'ollama';
import { promises as fs } from 'fs';
import { join } from 'path';
import { VideoScriptSchema, type VideoScript } from '../schemas/video-script.schema';
import { getScriptPrompt } from '../prompts/script-prompt';

const ollama = new Ollama({ host: 'http://localhost:11434' });

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

export const generateScript = async (theme: string): Promise<{ script: VideoScript; filePath: string }> => {
  const prompt = getScriptPrompt(theme);

  console.log(`Generating script for theme: "${theme}"...`);
  console.log('Calling Ollama llama3.2...');
  console.log('(Make sure Ollama is running: http://localhost:11434)');

  let response;
  try {
    response = await ollama.chat({
      model: 'llama3.2',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch failed')) {
      throw new Error(
        'Cannot connect to Ollama. Please ensure:\n' +
        '  1. Ollama is installed (https://ollama.ai)\n' +
        '  2. Ollama is running (run: ollama serve)\n' +
        '  3. llama3.2 model is installed (run: ollama pull llama3.2)'
      );
    }
    throw error;
  }

  const content = response.message.content;
  console.log('Received response from Ollama');
  console.log('Response preview:', content.substring(0, 200) + '...');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse response. Full content:');
    console.error(content);
    throw new Error(`Failed to parse Ollama response as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('Validating response against schema...');
  const validationResult = VideoScriptSchema.safeParse(parsedJson);
  
  if (!validationResult.success) {
    console.error('Validation failed. Parsed JSON:');
    console.error(JSON.stringify(parsedJson, null, 2));
    throw new Error(`Schema validation failed: ${JSON.stringify(validationResult.error.issues, null, 2)}`);
  }
  
  const script = validationResult.data;
  console.log('✓ Schema validation passed');

  await ensureOutputDir();

  const slug = createSlug(theme);
  const timestamp = Date.now();
  const fileName = `${slug}-${timestamp}.json`;
  const filePath = join(process.cwd(), 'output', fileName);

  await fs.writeFile(filePath, JSON.stringify(script, null, 2), 'utf-8');
  console.log(`✓ Script saved to: ${filePath}`);

  return { script, filePath };
};
