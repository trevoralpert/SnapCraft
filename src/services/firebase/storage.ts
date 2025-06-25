import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadResult {
  url: string;
  path: string;
  metadata: {
    size: number;
    contentType: string;
    timeCreated: string;
  };
}

/**
 * Upload an image to Firebase Storage
 * @param uri - Local image URI
 * @param path - Storage path (e.g., 'posts/user123/image1.jpg')
 * @param onProgress - Progress callback
 * @returns Promise with download URL and metadata
 */
export const uploadImage = async (
  uri: string,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Check your Firebase configuration.');
  }

  try {
    // Fetch the image as a blob
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress callback
          const progress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress?.(progress);
        },
        (error) => {
          // Error callback
          console.error('Upload failed:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          // Success callback
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const metadata = uploadTask.snapshot.metadata;
            
            resolve({
              url: downloadURL,
              path: path,
              metadata: {
                size: metadata.size,
                contentType: metadata.contentType || 'image/jpeg',
                timeCreated: metadata.timeCreated,
              },
            });
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error(`Image upload failed: ${error}`);
  }
};

/**
 * Upload multiple images
 * @param uris - Array of local image URIs
 * @param basePath - Base storage path (e.g., 'posts/user123/')
 * @param onProgress - Progress callback for all uploads
 * @returns Promise with array of upload results
 */
export const uploadMultipleImages = async (
  uris: string[],
  basePath: string,
  onProgress?: (overallProgress: number) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  const totalFiles = uris.length;
  let completedFiles = 0;

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    if (!uri) continue;
    
    const fileName = `image_${Date.now()}_${i}.jpg`;
    const path = `${basePath}${fileName}`;
    
    try {
      const result = await uploadImage(uri, path, (fileProgress) => {
        // Calculate overall progress
        const overallProgress = ((completedFiles + fileProgress.progress / 100) / totalFiles) * 100;
        onProgress?.(overallProgress);
      });
      
      results.push(result);
      completedFiles++;
      onProgress?.((completedFiles / totalFiles) * 100);
    } catch (error) {
      console.error(`Failed to upload image ${i}:`, error);
      throw error; // Stop on first failure
    }
  }

  return results;
};

/**
 * Delete an image from Firebase Storage
 * @param path - Storage path to delete
 * @returns Promise
 */
export const deleteImage = async (path: string): Promise<void> => {
  if (!storage) {
    throw new Error('Firebase Storage not initialized');
  }

  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    console.log('✅ Image deleted successfully:', path);
  } catch (error) {
    console.error('❌ Failed to delete image:', error);
    throw new Error(`Failed to delete image: ${error}`);
  }
};

/**
 * Generate a unique storage path for a user's post
 * @param userId - User ID
 * @param postId - Post ID (optional, will generate if not provided)
 * @returns Storage path
 */
export const generatePostImagePath = (userId: string, postId?: string): string => {
  const id = postId || `post_${Date.now()}`;
  return `craftPosts/${userId}/${id}/`;
};

/**
 * Generate a unique storage path for a user's story
 * @param userId - User ID
 * @param storyId - Story ID (optional, will generate if not provided)
 * @returns Storage path
 */
export const generateStoryImagePath = (userId: string, storyId?: string): string => {
  const id = storyId || `story_${Date.now()}`;
  return `stories/${userId}/${id}/`;
}; 