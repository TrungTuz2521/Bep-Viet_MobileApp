import apiClient from './apiClient';
import { API_ENDPOINTS } from '@/constants/api';
import { Recipe } from '@/types/api';

export interface ChatbotResponse {
  success: boolean;
  message?: string;
  intent?: {
    ingredients?: string[];
    max_time?: number | null;
    diet_type?: string | null;
    difficulty?: string | null;
    categories?: string[];
  };
  data?: Recipe[];
  fallbackToSearch?: boolean;
}

export const chatbotService = {
  // Gửi prompt tự nhiên để AI gợi ý món ăn theo nguyên liệu / thời gian
  async askDiscoverAssistant(query: string): Promise<ChatbotResponse> {
    const res = await apiClient.post<ChatbotResponse>(API_ENDPOINTS.CHATBOT.DISCOVER, {
      query,
    });
    return res.data;
  },
};

export default chatbotService;
