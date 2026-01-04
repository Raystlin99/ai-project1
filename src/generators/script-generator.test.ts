import { VideoScriptSchema } from '../schemas/video-script.schema';

describe('VideoScript Schema', () => {
  it('should validate a correctly structured video script', () => {
    const validScript = {
      title: '10 Amazing Facts About Space',
      totalDuration: 75,
      backgroundMood: 'cosmic and mysterious',
      facts: Array.from({ length: 10 }, (_, i) => ({
        text: `Interesting fact number ${i + 1} about the universe and space exploration`,
        voiceNarration: `Did you know? This is an amazing fact number ${i + 1} about space that will blow your mind!`,
        imageDescription: `A stunning cosmic scene showing galaxies and stars with vibrant colors and nebulae in the background, scene ${i + 1}`,
      })),
    };

    const result = VideoScriptSchema.safeParse(validScript);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.facts).toHaveLength(10);
      expect(result.data.totalDuration).toBeGreaterThanOrEqual(60);
      expect(result.data.totalDuration).toBeLessThanOrEqual(90);
    }
  });
});
