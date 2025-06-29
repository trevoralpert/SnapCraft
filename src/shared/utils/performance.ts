// Task 3.4: Performance Optimization - Performance Utilities
import { Platform, InteractionManager } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

// Image optimization utilities
export const IMAGE_CACHE_CONFIG = {
  // Cache directory for optimized images
  cacheDirectory: `${FileSystem.cacheDirectory}images/`,
  
  // Quality settings for different use cases
  qualities: {
    thumbnail: 0.3,
    preview: 0.7,
    full: 0.9,
  },
  
  // Size limits for different image types
  maxSizes: {
    thumbnail: { width: 150, height: 150 },
    preview: { width: 400, height: 400 },
    gallery: { width: 800, height: 800 },
    full: { width: 1200, height: 1200 },
  },
} as const;

// Image caching and optimization
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private cache = new Map<string, string>();

  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Initialize cache directory
  async initializeCache(): Promise<void> {
    try {
      const cacheDir = IMAGE_CACHE_CONFIG.cacheDirectory;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        console.log('📁 Image cache directory created');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize image cache:', error);
    }
  }

  // Get optimized image URI with caching
  async getOptimizedImage(
    originalUri: string,
    type: keyof typeof IMAGE_CACHE_CONFIG.maxSizes = 'preview'
  ): Promise<string> {
    try {
      // Check if already cached
      const cacheKey = `${originalUri}_${type}`;
      if (this.cache.has(cacheKey)) {
        const cachedUri = this.cache.get(cacheKey)!;
        const fileInfo = await FileSystem.getInfoAsync(cachedUri);
        if (fileInfo.exists) {
          return cachedUri;
        }
      }

      // Generate optimized version
      const optimizedUri = await this.createOptimizedImage(originalUri, type);
      this.cache.set(cacheKey, optimizedUri);
      
      return optimizedUri;
    } catch (error) {
      console.warn('⚠️ Image optimization failed, using original:', error);
      return originalUri;
    }
  }

  private async createOptimizedImage(
    originalUri: string,
    type: keyof typeof IMAGE_CACHE_CONFIG.maxSizes
  ): Promise<string> {
    const { width, height } = IMAGE_CACHE_CONFIG.maxSizes[type];
    const quality = IMAGE_CACHE_CONFIG.qualities[type as keyof typeof IMAGE_CACHE_CONFIG.qualities] || 0.7;
    
    // Create filename for cached version
    const filename = `${Date.now()}_${type}.jpg`;
    const optimizedUri = `${IMAGE_CACHE_CONFIG.cacheDirectory}${filename}`;

    // For now, return original URI - in production, you'd implement actual image resizing
    // This would typically use expo-image-manipulator or similar
    return originalUri;
  }

  // Clear cache when needed
  async clearCache(): Promise<void> {
    try {
      const cacheDir = IMAGE_CACHE_CONFIG.cacheDirectory;
      const dirInfo = await FileSystem.getInfoAsync(cacheDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(cacheDir, { idempotent: true });
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        this.cache.clear();
        console.log('🗑️ Image cache cleared');
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear image cache:', error);
    }
  }

  // Get cache size
  async getCacheSize(): Promise<number> {
    try {
      const cacheDir = IMAGE_CACHE_CONFIG.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      
      let totalSize = 0;
      for (const file of files) {
        const fileInfo = await FileSystem.getInfoAsync(`${cacheDir}${file}`);
        if (fileInfo.exists && !fileInfo.isDirectory) {
          totalSize += (fileInfo as any).size || 0;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('⚠️ Failed to get cache size:', error);
      return 0;
    }
  }
}

// Lazy loading utilities
export const createLazyLoader = <T>(
  loadFunction: () => Promise<T>,
  delay: number = 0
): (() => Promise<T>) => {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        // Use InteractionManager to wait for interactions to complete
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            loadFunction().then(resolve).catch(reject);
          }, delay);
        });
      });
    }
    return promise;
  };
};

// Progressive image loading
export const useProgressiveImage = (uri: string) => {
  const [imageUri, setImageUri] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        const optimizer = ImageOptimizer.getInstance();
        
        // Load thumbnail first
        const thumbnailUri = await optimizer.getOptimizedImage(uri, 'thumbnail');
        setImageUri(thumbnailUri);
        
        // Then load full quality
        const fullUri = await optimizer.getOptimizedImage(uri, 'preview');
        setImageUri(fullUri);
      } catch (error) {
        console.warn('Progressive image loading failed:', error);
        setImageUri(uri);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [uri]);
  
  return { imageUri, isLoading };
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number>();

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTiming(operation: string): void {
    this.metrics.set(operation, Date.now());
  }

  // End timing and log result
  endTiming(operation: string): number {
    const startTime = this.metrics.get(operation);
    if (!startTime) {
      console.warn(`⚠️ No start time found for operation: ${operation}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics.delete(operation);
    
    console.log(`⏱️ ${operation}: ${duration}ms`);
    return duration;
  }

  // Get all current metrics
  getMetrics(): Record<string, number> {
    const now = Date.now();
    const result: Record<string, number> = {};
    
    for (const [operation, startTime] of this.metrics.entries()) {
      result[operation] = now - startTime;
    }
    
    return result;
  }
}

// Memory management utilities
export const cleanupUnusedImages = async (): Promise<void> => {
  try {
    // Clear Expo Image cache
    await Image.clearMemoryCache();
    await Image.clearDiskCache();
    
    console.log('🧹 Image memory cleanup completed');
  } catch (error) {
    console.warn('⚠️ Image cleanup failed:', error);
  }
};

// App startup optimization
export const optimizeAppStartup = async (): Promise<void> => {
  try {
    const monitor = PerformanceMonitor.getInstance();
    monitor.startTiming('app_startup');
    
    // Initialize image cache
    const imageOptimizer = ImageOptimizer.getInstance();
    await imageOptimizer.initializeCache();
    
    // Preload critical resources
    await preloadCriticalResources();
    
    monitor.endTiming('app_startup');
  } catch (error) {
    console.warn('⚠️ App startup optimization failed:', error);
  }
};

// Preload critical resources
const preloadCriticalResources = async (): Promise<void> => {
  try {
    // Preload common icons or images that appear immediately
    const criticalAssets = [
      // Add paths to critical assets here
    ];
    
    await Promise.all(
      criticalAssets.map(asset => Image.prefetch(asset))
    );
    
    console.log('📦 Critical resources preloaded');
  } catch (error) {
    console.warn('⚠️ Failed to preload critical resources:', error);
  }
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}; 