/**
 * Mock story data for testing Story Mode without calling the backend API.
 * Used when TOGGLES.USE_MOCK_STORY is true.
 */
export const mockStoryScenes = [
  {
    scene_index: 0,
    text: "This majestic landmark stands as a testament to human creativity and historical significance. Its grand architecture has witnessed centuries of change, drawing millions of visitors who come to marvel at its timeless beauty.",
    image_url: null, // Will use placeholder in StoryModal
    audio_url: null  // Will use fallback timer
  },
  {
    scene_index: 1,
    text: "Today, standing before this monument, you feel the weight of history beneath your feet. The intricate details whisper stories of artisans who poured their souls into every stone, making this an unforgettable destination.",
    image_url: null,
    audio_url: null
  }
];

export default mockStoryScenes;
