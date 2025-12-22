import { apiClient } from '@/utils/apiClient';

export interface Plan {
  id: string;
  key: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingCycle: string;
  maxLocations: number;
  maxProducts: number;
  maxOffers: number;
  maxBuyers: number;
  features: string[];
  trialDays: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  stripeProductId?: string;
  stripePriceMonthlyId?: string;
  stripePriceYearlyId?: string;
}

export const plansService = {
  getAllPlans: async (): Promise<Plan[]> => {
    try {
      const response = await apiClient.get<Plan[]>('/plans');
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  getPlanById: async (planId: string): Promise<Plan> => {
    try {
      const response = await apiClient.get<Plan>(`/plans/${planId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  },
};

export const { getAllPlans, getPlanById } = plansService;
