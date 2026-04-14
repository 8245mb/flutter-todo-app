/**
 * Serviço de Valor Fixo Inteligente
 * Gerencia orçamento de gastos livres com recomendações proativas
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FixedBudget, BudgetRecommendation } from '@/lib/types/ai-modules';
import type { Expense } from '@/lib/types/expense';

const STORAGE_KEY = '@fixed_budget';

export class FixedBudgetService {
  /**
   * Obtém o orçamento fixo atual
   */
  static async getBudget(): Promise<FixedBudget | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading budget:', error);
      return null;
    }
  }

  /**
   * Cria ou atualiza o orçamento fixo mensal
   */
  static async setBudget(monthlyLimit: number): Promise<FixedBudget> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = endDate.getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed + 1;

    const budget: FixedBudget = {
      id: `budget_${now.getFullYear()}_${now.getMonth() + 1}`,
      monthlyLimit,
      currentSpent: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      dailyAverage: monthlyLimit / daysInMonth,
      daysRemaining,
      recommendations: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
    return budget;
  }

  /**
   * Atualiza gastos atuais e recalcula recomendações
   */
  static async updateSpending(expenses: Expense[]): Promise<FixedBudget | null> {
    const budget = await this.getBudget();
    if (!budget) return null;

    const now = new Date();
    const startOfMonth = new Date(budget.startDate);
    const endOfMonth = new Date(budget.endDate);

    // Filtrar gastos do mês atual
    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    // Calcular total gasto
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calcular dias restantes
    const daysRemaining = Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calcular média diária segura
    const remaining = budget.monthlyLimit - totalSpent;
    const safeDailyAverage = remaining > 0 ? remaining / daysRemaining : 0;

    // Gerar recomendações
    const recommendations = this.generateRecommendations(
      budget.monthlyLimit,
      totalSpent,
      safeDailyAverage,
      daysRemaining
    );

    const updatedBudget: FixedBudget = {
      ...budget,
      currentSpent: totalSpent,
      daysRemaining,
      dailyAverage: safeDailyAverage,
      recommendations,
      updatedAt: now.toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBudget));
    return updatedBudget;
  }

  /**
   * Gera recomendações proativas baseadas no estado atual
   */
  private static generateRecommendations(
    monthlyLimit: number,
    currentSpent: number,
    dailyAverage: number,
    daysRemaining: number
  ): BudgetRecommendation[] {
    const recommendations: BudgetRecommendation[] = [];
    const percentUsed = (currentSpent / monthlyLimit) * 100;
    const percentDaysRemaining = (daysRemaining / 30) * 100;

    // Alerta: Gastou mais de 80% com mais de 20% do mês restante
    if (percentUsed > 80 && percentDaysRemaining > 20) {
      recommendations.push({
        id: `rec_${Date.now()}_warning`,
        type: 'warning',
        message: `Atenção! Você já usou ${Math.round(percentUsed)}% do orçamento com ${daysRemaining} dias restantes.`,
        suggestedDailyLimit: dailyAverage,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    // Alerta: Orçamento estourado
    if (currentSpent >= monthlyLimit) {
      recommendations.push({
        id: `rec_${Date.now()}_exceeded`,
        type: 'warning',
        message: `Orçamento excedido! Você gastou R$ ${(currentSpent - monthlyLimit).toFixed(2)} além do limite.`,
        suggestedDailyLimit: 0,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    // Recomendação diária
    if (dailyAverage > 0 && currentSpent < monthlyLimit) {
      recommendations.push({
        id: `rec_${Date.now()}_daily`,
        type: 'info',
        message: `Gaste no máximo R$ ${dailyAverage.toFixed(2)} por dia para ficar dentro do orçamento.`,
        suggestedDailyLimit: dailyAverage,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    // Sucesso: Está economizando bem
    if (percentUsed < 50 && percentDaysRemaining < 50) {
      recommendations.push({
        id: `rec_${Date.now()}_success`,
        type: 'success',
        message: `Ótimo trabalho! Você está economizando bem este mês.`,
        suggestedDailyLimit: dailyAverage,
        createdAt: new Date().toISOString(),
        dismissed: false,
      });
    }

    return recommendations;
  }

  /**
   * Dispensa uma recomendação
   */
  static async dismissRecommendation(recommendationId: string): Promise<void> {
    const budget = await this.getBudget();
    if (!budget) return;

    budget.recommendations = budget.recommendations.map((rec) =>
      rec.id === recommendationId ? { ...rec, dismissed: true } : rec
    );

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  }

  /**
   * Calcula estatísticas de progresso
   */
  static calculateProgress(budget: FixedBudget): {
    percentUsed: number;
    remaining: number;
    status: 'good' | 'warning' | 'danger';
    statusMessage: string;
  } {
    const percentUsed = (budget.currentSpent / budget.monthlyLimit) * 100;
    const remaining = budget.monthlyLimit - budget.currentSpent;
    const percentDaysRemaining = (budget.daysRemaining / 30) * 100;

    let status: 'good' | 'warning' | 'danger';
    let statusMessage: string;

    if (percentUsed > 100) {
      status = 'danger';
      statusMessage = 'Orçamento excedido';
    } else if (percentUsed > percentDaysRemaining + 20) {
      status = 'warning';
      statusMessage = 'Gastando rápido demais';
    } else {
      status = 'good';
      statusMessage = 'Dentro do planejado';
    }

    return {
      percentUsed: Math.min(percentUsed, 100),
      remaining: Math.max(remaining, 0),
      status,
      statusMessage,
    };
  }

  /**
   * Remove orçamento
   */
  static async deleteBudget(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
