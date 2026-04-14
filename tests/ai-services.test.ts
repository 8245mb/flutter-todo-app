/**
 * Testes para os serviços de IA
 */

import { describe, it, expect } from 'vitest';
import { FixedBudgetService } from '../lib/services/fixed-budget-service';
import { PredictiveAnalysisService } from '../lib/services/predictive-analysis-service';
import type { FixedBudget } from '../lib/types/ai-modules';
import type { Expense } from '../lib/types/expense';

describe('FixedBudgetService', () => {

  describe('calculateProgress', () => {
    it('should return good status when under 70%', () => {
      const budget: FixedBudget = {
        id: '1',
        monthlyLimit: 1000,
        currentSpent: 500,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        dailyAverage: 33.33,
        daysRemaining: 15,
        recommendations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = FixedBudgetService.calculateProgress(budget);
      expect(result.status).toBe('good');
      expect(result.percentUsed).toBe(50);
    });

    it('should return warning status when between 70-90%', () => {
      const budget: FixedBudget = {
        id: '1',
        monthlyLimit: 1000,
        currentSpent: 800,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        dailyAverage: 13.33,
        daysRemaining: 15,
        recommendations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = FixedBudgetService.calculateProgress(budget);
      expect(result.status).toBe('warning');
      expect(result.percentUsed).toBe(80);
    });

    it('should return danger status when over 100%', () => {
      const budget: FixedBudget = {
        id: '1',
        monthlyLimit: 1000,
        currentSpent: 1100,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        dailyAverage: 0,
        daysRemaining: 15,
        recommendations: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = FixedBudgetService.calculateProgress(budget);
      expect(result.status).toBe('danger');
      expect(result.percentUsed).toBe(100); // capped at 100
    });
  });

});

describe('PredictiveAnalysisService', () => {
  describe('analyzeSpendingPatterns', () => {
    it('should return empty array for insufficient data', () => {
      const expenses: Expense[] = [];
      const result = PredictiveAnalysisService.analyzeSpendingPatterns(expenses);
      expect(result).toEqual([]);
    });

    it('should detect patterns with sufficient data', () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 15);

      const expenses: Expense[] = [
        {
          id: '1',
          description: 'Gasto 1',
          amount: 100,
          currency: 'BRL',
          category: 'personal',
          createdAt: lastMonth.getTime(),
          updatedAt: lastMonth.getTime(),
        },
        {
          id: '2',
          description: 'Gasto 2',
          amount: 150,
          currency: 'BRL',
          category: 'personal',
          createdAt: thisMonth.getTime(),
          updatedAt: thisMonth.getTime(),
        },
      ];

      const result = PredictiveAnalysisService.analyzeSpendingPatterns(expenses);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions from patterns', () => {
      const patterns = [
        {
          id: 'pattern_1',
          type: 'increase' as const,
          category: 'personal',
          description: 'Gastos pessoais subiram 30%',
          percentageChange: 30,
          period: 'monthly',
          confidence: 0.8,
          detectedAt: new Date().toISOString(),
        },
      ];

      const expenses: Expense[] = [];
      const result = PredictiveAnalysisService.generateSuggestions(patterns, expenses);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe('warning');
      expect(result[0].status).toBe('pending');
    });
  });

  describe('predictFutureExpenses', () => {
    it('should return low confidence for insufficient data', () => {
      const expenses: Expense[] = [];
      const result = PredictiveAnalysisService.predictFutureExpenses(expenses);
      
      expect(result.confidence).toBe(0.3);
      expect(result.trend).toBe('stable');
    });
  });
});
