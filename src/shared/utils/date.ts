/**
 * Date utility functions for handling Firebase Timestamps and date formatting
 */

/**
 * Converts a Firebase Timestamp to a JavaScript Date object
 * Handles both Firebase Timestamp objects and regular Date objects
 */
export function convertFirebaseTimestamp(timestamp: any): Date | null {
  if (!timestamp) {
    return null;
  }

  // If it's already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // If it's a Firebase Timestamp with seconds property
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }

  // If it's a Firebase Timestamp with nanoseconds (full format)
  if (timestamp && typeof timestamp === 'object' && 'nanoseconds' in timestamp && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
  }

  // If it's a string or number, try to parse it
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Safely formats a Firebase Timestamp as a localized date string
 */
export function formatFirebaseDate(timestamp: any, fallback: string = 'Recently'): string {
  const date = convertFirebaseTimestamp(timestamp);
  if (!date) {
    return fallback;
  }
  
  try {
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Safely formats a Firebase Timestamp as a localized date and time string
 */
export function formatFirebaseDateTime(timestamp: any, fallback: string = 'Recently'): string {
  const date = convertFirebaseTimestamp(timestamp);
  if (!date) {
    return fallback;
  }
  
  try {
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error formatting date time:', error);
    return fallback;
  }
}

/**
 * Gets a relative time string (e.g., "2 days ago", "3 hours ago")
 */
export function getRelativeTimeString(timestamp: any): string {
  const date = convertFirebaseTimestamp(timestamp);
  if (!date) {
    return 'Recently';
  }

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  } else if (diffInWeeks > 0) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
} 