/**
 * Serviço de Análise Preditiva
 * Analisa padrões de gastos e gera sugestões personalizadas
 */

import type { Expense, ExpenseCategory } from '@/lib/types/expense';
import type { PredictiveSuggestion } from '@/lib/types/ai-modules';

// Tipo interno para padrões de gastos
interface SpendingPattern {
  id: string;
  type: 'trend' | 'increase' | 'decrease' | 'anomaly';
  category: string;
  description: string;
  percentageChange: number;
  period: string;
  confidence: number;
  detectedAt: string;
}

export class PredictiveAnalysisService {
  /**
   * Analisa padrões de gastos dos últimos meses
   */
  static analyzeSpendingPatterns(expenses: Expense[]): SpendingPattern[] {
    const patterns: SpendingPattern[] = [];
    const now = new Date();

    // Agrupar gastos por mês
    const monthlyData: Record<string, { total: number; byCategory: Record<string, number>; count: number }> = {};

    expenses.forEach((expense) => {
      const date = new Date(expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, byCategory: {}, count: 0 };
      }

      monthlyData[monthKey].total += expense.amount;
      monthlyData[monthKey].count++;

      if (!monthlyData[monthKey].byCategory[expense.category]) {
        monthlyData[monthKey].byCategory[expense.category] = 0;
      }
      monthlyData[monthKey].byCategory[expense.category] += expense.amount;
    });

    const months = Object.keys(monthlyData).sort();

    // Analisar tendências
    if (months.length >= 2) {
      const currentMonth = months[months.length - 1];
      const previousMonth = months[months.length - 2];

      const current = monthlyData[currentMonth];
      const previous = monthlyData[previousMonth];

      // Padrão de gasto total
      const totalChange = ((current.total - previous.total) / previous.total) * 100;

      patterns.push({
        id: `pattern_total_${Date.now()}`,
        type: 'trend',
        category: 'all',
        description: totalChange > 0
          ? `Gastos aumentaram ${Math.abs(totalChange).toFixed(1)}% em relação ao mês anterior`
          : `Gastos diminuíram ${Math.abs(totalChange).toFixed(1)}% em relação ao mês anterior`,
        percentageChange: totalChange,
        period: 'monthly',
        confidence: 0.85,
        detectedAt: now.toISOString(),
      });

      // Analisar por categoria
      const categories: ExpenseCategory[] = ['personal', 'collective', 'institutional'];

      categories.forEach((category) => {
        const currentCat = current.byCategory[category] || 0;
        const previousCat = previous.byCategory[category] || 0;

        if (previousCat > 0 && currentCat > 0) {
          const catChange = ((currentCat - previousCat) / previousCat) * 100;

          if (Math.abs(catChange) > 15) {
            patterns.push({
              id: `pattern_${category}_${Date.now()}`,
              type: catChange > 0 ? 'increase' : 'decrease',
              category,
              description: catChange > 0
                ? `Gastos ${this.getCategoryLabel(category)} subiram ${Math.abs(catChange).toFixed(1)}%`
                : `Gastos ${this.getCategoryLabel(category)} caíram ${Math.abs(catChange).toFixed(1)}%`,
              percentageChange: catChange,
              period: 'monthly',
              confidence: 0.8,
              detectedAt: now.toISOString(),
            });
          }
        }
      });
    }

    // Detectar gastos anormais (outliers)
    const amounts = expenses.map((e) => e.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(
      amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / amounts.length
    );

    const outliers = expenses.filter((e) => e.amount > avgAmount + 2 * stdDev);

    if (outliers.length > 0) {
      patterns.push({
        id: `pattern_outliers_${Date.now()}`,
        type: 'anomaly',
        category: 'all',
        description: `${outliers.length} gasto(s) acima do normal detectado(s)`,
        percentageChange: 0,
        period: 'monthly',
        confidence: 0.75,
        detectedAt: now.toISOString(),
      });
    }

    return patterns;
  }

  /**
   * Gera sugestões baseadas nos padrões detectados
   */
  static generateSuggestions(
    patterns: SpendingPattern[],
    expenses: Expense[]
  ): PredictiveSuggestion[] {
    const suggestions: PredictiveSuggestion[] = [];
    const now = new Date();

    patterns.forEach((pattern) => {
      if (pattern.type === 'increase' && pattern.percentageChange > 20) {
        suggestions.push({
          id: `suggestion_${pattern.id}`,
          type: 'warning',
          title: 'Aumento significativo detectado',
          description: pattern.description,
          impact: 'high',
          relatedPatterns: [pattern.id],
          actionable: true,
          actions: ['Revisar gastos', 'Ajustar orçamento'],
          status: 'pending',
          createdAt: now.toISOString(),
        });
      }

      if (pattern.type === 'decrease' && pattern.percentageChange < -20) {
        suggestions.push({
          id: `suggestion_${pattern.id}`,
          type: 'insight',
          title: 'Ótimo progresso!',
          description: pattern.description,
          impact: 'low',
          relatedPatterns: [pattern.id],
          actionable: false,
          status: 'pending',
          createdAt: now.toISOString(),
        });
      }

      if (pattern.type === 'anomaly') {
        suggestions.push({
          id: `suggestion_${pattern.id}`,
          type: 'opportunity',
          title: 'Gastos fora do padrão',
          description: pattern.description + '. Revise se são necessários.',
          impact: 'medium',
          relatedPatterns: [pattern.id],
          actionable: true,
          actions: ['Revisar gastos'],
          status: 'pending',
          createdAt: now.toISOString(),
        });
      }
    });

    // Sugestão baseada em frequência de gastos
    const thisMonth = expenses.filter((e) => {
      const date = new Date(e.createdAt);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const dayOfMonth = now.getDate();
    const avgDailySpending = thisMonth.reduce((sum, e) => sum + e.amount, 0) / dayOfMonth;

    if (avgDailySpending > 0) {
      const projectedMonthly = avgDailySpending * 30;

      suggestions.push({
        id: `suggestion_projection_${Date.now()}`,
        type: 'insight',
        title: 'Projeção do mês',
        description: `Se continuar assim, você gastará aproximadamente R$ ${projectedMonthly.toFixed(2)} este mês.`,
        impact: 'medium',
        relatedPatterns: [],
        actionable: true,
        actions: ['Ajustar orçamento'],
        status: 'pending',
        createdAt: now.toISOString(),
      });
    }

    return suggestions;
  }

  /**
   * Prevê gastos futuros baseado no histórico
   */
  static predictFutureExpenses(expenses: Expense[]): {
    nextMonth: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  } {
    if (expenses.length < 10) {
      return { nextMonth: 0, confidence: 0.3, trend: 'stable' };
    }

    // Calcular média móvel dos últimos 3 meses
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const recentExpenses = expenses.filter((e) => new Date(e.createdAt) >= threeMonthsAgo);
    const monthlyTotals: number[] = [];

    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthTotal = recentExpenses
        .filter((e) => {
          const date = new Date(e.createdAt);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      monthlyTotals.push(monthTotal);
    }

    const avgMonthly = monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length;

    // Determinar tendência
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (monthlyTotals[0] > monthlyTotals[1] * 1.1) trend = 'up';
    else if (monthlyTotals[0] < monthlyTotals[1] * 0.9) trend = 'down';

    // Aplicar tendência na previsão
    let prediction = avgMonthly;
    if (trend === 'up') prediction *= 1.05;
    else if (trend === 'down') prediction *= 0.95;

    return {
      nextMonth: prediction,
      confidence: 0.7,
      trend,
    };
  }

  private static getCategoryLabel(category: ExpenseCategory): string {
    const labels: Record<ExpenseCategory, string> = {
      personal: 'Pessoais',
      collective: 'Coletivos',
      institutional: 'Institucionais',
    };
    return labels[category];
  }
}
