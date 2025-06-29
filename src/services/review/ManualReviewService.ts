import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { ProjectScoringResult, User } from '../../shared/types';

export interface ReviewRequest {
  id: string;
  projectId: string;
  userId: string;
  scoringId: string;
  originalScoringResult: ProjectScoringResult;
  reviewReason: string;
  status: 'pending' | 'in_review' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  requestedAt: Date;
  assignedReviewerId?: string;
  assignedAt?: Date;
  completedAt?: Date;
  reviewerNotes?: string;
  revisedScore?: number;
  revisedFeedback?: {
    overallFeedback: string;
    strengths: string[];
    improvementAreas: string[];
    nextStepSuggestions: string[];
  };
  userRequestedReview?: boolean; // User manually requested review
  metadata: {
    originalConfidence: number;
    flaggedCriteria: string[];
    aiModelVersion: string;
    reviewType: 'automatic' | 'user_requested' | 'quality_assurance';
  };
}

export interface ReviewerAssignment {
  reviewerId: string;
  reviewerName: string;
  assignedReviews: string[];
  completedReviews: number;
  averageReviewTime: number; // in minutes
  specializations: string[];
}

/**
 * Manual Review Service
 * Manages projects that need human review after AI scoring
 */
export class ManualReviewService {
  private static instance: ManualReviewService;

  private constructor() {}

  public static getInstance(): ManualReviewService {
    if (!ManualReviewService.instance) {
      ManualReviewService.instance = new ManualReviewService();
    }
    return ManualReviewService.instance;
  }

  /**
   * Submit a project for manual review
   */
  async submitForReview(
    scoringResult: ProjectScoringResult,
    userRequested: boolean = false,
    additionalNotes?: string
  ): Promise<string> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      console.log('📝 Submitting project for manual review:', {
        projectId: scoringResult.projectId,
        scoringId: scoringResult.scoringId,
        userRequested,
        needsReview: scoringResult.aiScoringMetadata.needsHumanReview
      });

      const reviewRequest: Omit<ReviewRequest, 'id'> = {
        projectId: scoringResult.projectId,
        userId: scoringResult.projectId.split('_')[0] || 'unknown', // Extract user ID from project ID
        scoringId: scoringResult.scoringId,
        originalScoringResult: scoringResult,
        reviewReason: userRequested 
          ? `User requested manual review: ${additionalNotes || 'No additional notes'}`
          : (scoringResult.aiScoringMetadata.reviewReason || 'AI flagged for review'),
        status: 'pending',
        priority: this.calculateReviewPriority(scoringResult, userRequested),
        requestedAt: new Date(),
        userRequestedReview: userRequested,
        metadata: {
          originalConfidence: scoringResult.aiScoringMetadata.confidence,
          flaggedCriteria: this.getFlaggedCriteria(scoringResult),
          aiModelVersion: scoringResult.aiScoringMetadata.modelVersion,
          reviewType: userRequested ? 'user_requested' : 'automatic'
        }
      };

      const reviewsRef = collection(db, 'reviewRequests');
      const docRef = await addDoc(reviewsRef, {
        ...reviewRequest,
        requestedAt: serverTimestamp()
      });

      console.log('✅ Review request submitted:', docRef.id);
      return docRef.id;

    } catch (error) {
      console.error('❌ Failed to submit review request:', error);
      
      // Check if it's a permission error
      if (error instanceof Error && error.message.includes('permission')) {
        console.warn('⚠️ Review submission failed due to permissions - this is expected during development');
        // Don't throw the error for permission issues - just log it
        // The scoring results will still be shown to the user
        return 'permission-denied';
      }
      
      throw new Error(`Failed to submit review request: ${error}`);
    }
  }

  /**
   * Get pending review requests (for reviewers)
   */
  async getPendingReviews(reviewerId?: string): Promise<ReviewRequest[]> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const reviewsRef = collection(db, 'reviewRequests');
      let reviewQuery;

      if (reviewerId) {
        // Get reviews assigned to specific reviewer
        reviewQuery = query(
          reviewsRef,
          where('assignedReviewerId', '==', reviewerId),
          where('status', 'in', ['pending', 'in_review']),
          orderBy('priority', 'desc'),
          orderBy('requestedAt', 'asc')
        );
      } else {
        // Get all pending reviews
        reviewQuery = query(
          reviewsRef,
          where('status', '==', 'pending'),
          orderBy('priority', 'desc'),
          orderBy('requestedAt', 'asc')
        );
      }

      const snapshot = await getDocs(reviewQuery);
      const reviews: ReviewRequest[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        reviews.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate() || new Date(),
          assignedAt: data.assignedAt?.toDate(),
          completedAt: data.completedAt?.toDate()
        } as ReviewRequest);
      });

      return reviews;

    } catch (error) {
      console.error('❌ Failed to fetch pending reviews:', error);
      throw new Error(`Failed to fetch pending reviews: ${error}`);
    }
  }

  /**
   * Get review status for a specific project
   */
  async getReviewStatus(projectId: string): Promise<ReviewRequest | null> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const reviewsRef = collection(db, 'reviewRequests');
      const reviewQuery = query(
        reviewsRef,
        where('projectId', '==', projectId),
        orderBy('requestedAt', 'desc')
      );

      const snapshot = await getDocs(reviewQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt?.toDate() || new Date(),
        assignedAt: data.assignedAt?.toDate(),
        completedAt: data.completedAt?.toDate()
      } as ReviewRequest;

    } catch (error) {
      console.error('❌ Failed to get review status:', error);
      return null;
    }
  }

  /**
   * Assign a review to a reviewer
   */
  async assignReview(reviewId: string, reviewerId: string, reviewerName: string): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const reviewRef = doc(db, 'reviewRequests', reviewId);
      await updateDoc(reviewRef, {
        assignedReviewerId: reviewerId,
        assignedAt: serverTimestamp(),
        status: 'in_review'
      });

      console.log('✅ Review assigned:', { reviewId, reviewerId });

    } catch (error) {
      console.error('❌ Failed to assign review:', error);
      throw new Error(`Failed to assign review: ${error}`);
    }
  }

  /**
   * Complete a manual review
   */
  async completeReview(
    reviewId: string,
    reviewerNotes: string,
    revisedScore?: number,
    revisedFeedback?: ReviewRequest['revisedFeedback']
  ): Promise<void> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const reviewRef = doc(db, 'reviewRequests', reviewId);
      const updateData: any = {
        status: 'completed',
        completedAt: serverTimestamp(),
        reviewerNotes
      };

      if (revisedScore !== undefined) {
        updateData.revisedScore = revisedScore;
      }

      if (revisedFeedback) {
        updateData.revisedFeedback = revisedFeedback;
      }

      await updateDoc(reviewRef, updateData);

      console.log('✅ Review completed:', reviewId);

    } catch (error) {
      console.error('❌ Failed to complete review:', error);
      throw new Error(`Failed to complete review: ${error}`);
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStats(): Promise<{
    totalPending: number;
    totalInReview: number;
    totalCompleted: number;
    averageReviewTime: number;
    highPriorityCount: number;
  }> {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    try {
      const reviewsRef = collection(db, 'reviewRequests');
      const allReviewsSnapshot = await getDocs(reviewsRef);
      
      let totalPending = 0;
      let totalInReview = 0;
      let totalCompleted = 0;
      let highPriorityCount = 0;
      let reviewTimes: number[] = [];

      allReviewsSnapshot.forEach(doc => {
        const data = doc.data();
        
        switch (data.status) {
          case 'pending':
            totalPending++;
            break;
          case 'in_review':
            totalInReview++;
            break;
          case 'completed':
            totalCompleted++;
            // Calculate review time if dates are available
            if (data.requestedAt && data.completedAt) {
              const requestTime = data.requestedAt.toDate();
              const completeTime = data.completedAt.toDate();
              const reviewTimeMinutes = (completeTime.getTime() - requestTime.getTime()) / (1000 * 60);
              reviewTimes.push(reviewTimeMinutes);
            }
            break;
        }

        if (data.priority === 'high') {
          highPriorityCount++;
        }
      });

      const averageReviewTime = reviewTimes.length > 0 
        ? reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length
        : 0;

      return {
        totalPending,
        totalInReview,
        totalCompleted,
        averageReviewTime: Math.round(averageReviewTime),
        highPriorityCount
      };

    } catch (error) {
      console.error('❌ Failed to get review stats:', error);
      throw new Error(`Failed to get review stats: ${error}`);
    }
  }

  /**
   * Calculate review priority based on scoring result
   */
  private calculateReviewPriority(
    scoringResult: ProjectScoringResult, 
    userRequested: boolean
  ): 'low' | 'medium' | 'high' {
    // User-requested reviews get higher priority
    if (userRequested) return 'high';

    const confidence = scoringResult.aiScoringMetadata.confidence;
    const score = scoringResult.individualSkillScore;

    // Very low confidence or extreme scores get high priority
    if (confidence < 50 || score < 30 || score > 95) {
      return 'high';
    }

    // Medium confidence issues
    if (confidence < 70) {
      return 'medium';
    }

    // Everything else is low priority
    return 'low';
  }

  /**
   * Get criteria that were flagged for review
   */
  private getFlaggedCriteria(scoringResult: ProjectScoringResult): string[] {
    const flagged: string[] = [];
    
    Object.entries(scoringResult.scoringCriteria).forEach(([criterion, data]) => {
      if (data.confidence < 60) {
        flagged.push(criterion);
      }
    });

    return flagged;
  }
} 