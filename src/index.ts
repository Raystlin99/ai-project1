import { generateScript } from './generators/script-generator';
import { planScenes } from './generators/scene-planner';
import { generateImages } from './generators/image-generator';

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const theme = args[0];

  if (!theme) {
    console.error('Error: Please provide a theme');
    console.log('Usage: npm start -- "Your Theme Here"');
    console.log('Example: npm start -- "Ancient Rome"');
    process.exit(1);
  }

  try {
    console.log('='.repeat(50));
    console.log('AI Video Script Generator');
    console.log('='.repeat(50));
    console.log();

    const { script, filePath: scriptPath } = await generateScript(theme);

    console.log();
    
    const { plan, filePath: scenesPath } = await planScenes(script, theme);

    console.log();
    
    const imagePaths = await generateImages(plan, theme);

    console.log();
    console.log('='.repeat(50));
    console.log('✓ Generation Complete!');
    console.log('='.repeat(50));
    console.log(`Title: ${script.title}`);
    console.log(`Duration: ${script.totalDuration} seconds`);
    console.log(`Scenes: ${plan.scenes.length}`);
    console.log(`Images: ${imagePaths.length}`);
    console.log(`Mood: ${script.backgroundMood}`);
    console.log();
    console.log('Output Files:');
    console.log(`  Script: ${scriptPath}`);
    console.log(`  Scenes: ${scenesPath}`);
    console.log(`  Images: output/images/ (${imagePaths.length} files)`);
    console.log();
  } catch (error) {
    console.error('Error generating script:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
};

main();
