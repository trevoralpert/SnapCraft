import { uploadImage } from './storage';

/**
 * Generate a thumbnail from a video file
 * @param videoUri - Local video file URI
 * @param userId - User ID for storage path
 * @param storyId - Story ID for unique naming
 * @returns Promise with thumbnail URL
 */
export const generateVideoThumbnail = async (
  videoUri: string,
  userId: string,
  storyId: string
): Promise<string> => {
  try {
    console.log('🎬 Attempting to generate thumbnail for video:', videoUri);
    
    // Check if expo-video-thumbnails is available
    let VideoThumbnails;
    try {
      VideoThumbnails = require('expo-video-thumbnails');
    } catch (requireError) {
      console.warn('🎬 expo-video-thumbnails not available in this build, skipping thumbnail generation');
      throw new Error('Video thumbnails not available in current build');
    }
    
    // Generate thumbnail at 1 second mark
    const { uri: thumbnailUri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 1000, // 1 second into the video
      quality: 0.8,
    });
    
    console.log('🎬 Thumbnail generated:', thumbnailUri);
    
    // Upload thumbnail to Firebase Storage
    const thumbnailPath = `craftStories/${userId}/${storyId}/thumbnail.jpg`;
    const uploadResult = await uploadImage(thumbnailUri, thumbnailPath);
    
    console.log('🎬 Thumbnail uploaded:', uploadResult.url);
    return uploadResult.url;
  } catch (error) {
    console.error('🎬 Error generating video thumbnail:', error);
    throw new Error(`Failed to generate video thumbnail: ${error}`);
  }
};

/**
 * Get the best thumbnail for a story (video thumbnail, image, or fallback)
 * @param story - CraftStory object
 * @returns Thumbnail URL or null
 */
export const getStoryThumbnail = (story: any): string | null => {
  // Priority: thumbnailUrl > imageUrl > null
  if (story.content.thumbnailUrl) {
    return story.content.thumbnailUrl;
  }
  
  if (story.content.imageUrl) {
    return story.content.imageUrl;
  }
  
  return null;
}; 