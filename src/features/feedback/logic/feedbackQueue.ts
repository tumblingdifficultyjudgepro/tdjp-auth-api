// src/features/feedback/logic/feedbackQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// עדכון הממשק כדי שיתאים למה שאנחנו שולחים מה-Modal
export interface FeedbackItem {
  id?: string;
  type: 'idea' | 'bug';
  fullName: string;
  subject: string;
  content: string;
  images: string[]; // מערך של URIs
  timestamp: number;
  status?: 'pending' | 'sent';
}

const FEEDBACK_STORAGE_KEY = '@tdjp_feedback_queue_v2';

// הפונקציה מקבלת כעת אובייקט אחד (item)
export const addFeedbackToQueue = async (item: FeedbackItem): Promise<void> => {
  try {
    const newFeedback: FeedbackItem = {
      ...item,
      id: item.id || Date.now().toString(),
      status: 'pending',
    };

    const existingQueueJSON = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    const existingQueue: FeedbackItem[] = existingQueueJSON ? JSON.parse(existingQueueJSON) : [];

    const updatedQueue = [...existingQueue, newFeedback];
    await AsyncStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedQueue));
    
    console.log('Feedback added to queue:', newFeedback);
  } catch (error) {
    console.error('Error adding feedback to queue:', error);
    throw error;
  }
};

export const getFeedbackQueue = async (): Promise<FeedbackItem[]> => {
  try {
    const queueJSON = await AsyncStorage.getItem(FEEDBACK_STORAGE_KEY);
    return queueJSON ? JSON.parse(queueJSON) : [];
  } catch (error) {
    return [];
  }
};

export const clearQueue = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FEEDBACK_STORAGE_KEY);
  } catch (error) { }
};