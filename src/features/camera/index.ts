// Camera feature exports
export { default as CameraScreen } from './CameraScreen';
export { default as MediaGallery } from './MediaGallery';
export { default as VideoPlayer } from './VideoPlayer';

// Types
export interface MediaItem {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  filename: string;
  creationTime: number;
  duration?: number;
} 