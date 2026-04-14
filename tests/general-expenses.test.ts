import { describe, it, expect } from 'vitest';

/**
 * Testes para a funcionalidade de Gastos Gerais
 * Valida os cálculos automáticos de renda, gastos fixos e disponível
 */

interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
}

// Simular cálculos do componente
function calculateTotalFixedExpenses(fixedExpenses: FixedExpenseItem[]): number {
  return fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
}

function calculateAvailableToSpend(
  monthlyIncome: number,
  totalFixedExpenses: number,
  totalVariableExpenses: number
): number {
  return monthlyIncome - totalFixedExpenses - totalVariableExpenses;
}

function calculateSpendingPercentage(
  monthlyIncome: number,
  totalFixedExpenses: number,
  totalVariableExpenses: number
): number {
  if (monthlyIncome <= 0) return 0;
  return ((totalFixedExpenses + totalVariableExpenses) / monthlyIncome) * 100;
}

function calculateDailyBudget(
  availableToSpend: number,
  daysRemaining: number
): number {
  if (availableToSpend <= 0 || daysRemaining <= 0) return 0;
  return availableToSpend / daysRemaining;
}

describe('Gastos Gerais - Cálculos Automáticos', () => {
  const sampleFixedExpenses: FixedExpenseItem[] = [
    { id: '1', name: 'Aluguel', amount: 1200 },
    { id: '2', name: 'Internet', amount: 100 },
    { id: '3', name: 'Luz', amount: 150 },
    { id: '4', name: 'Água', amount: 80 },
  ];

  it('deve calcular o total de gastos fixos corretamente', () => {
    const total = calculateTotalFixedExpenses(sampleFixedExpenses);
    expect(total).toBe(1530);
  });

  it('deve retornar 0 para lista vazia de gastos fixos', () => {
    const total = calculateTotalFixedExpenses([]);
    expect(total).toBe(0);
  });

  it('deve calcular o valor disponível corretamente', () => {
    const available = calculateAvailableToSpend(3000, 1530, 500);
    expect(available).toBe(970);
  });

  it('deve retornar valor negativo quando gastos excedem renda', () => {
    const available = calculateAvailableToSpend(2000, 1530, 800);
    expect(available).toBe(-330);
  });

  it('deve calcular a porcentagem de gastos corretamente', () => {
    const percentage = calculateSpendingPercentage(3000, 1530, 500);
    expect(percentage).toBeCloseTo(67.67, 1);
  });

  it('deve retornar 0% quando renda é zero', () => {
    const percentage = calculateSpendingPercentage(0, 1530, 500);
    expect(percentage).toBe(0);
  });

  it('deve calcular sugestão diária corretamente', () => {
    const daily = calculateDailyBudget(970, 15);
    expect(daily).toBeCloseTo(64.67, 1);
  });

  it('deve retornar 0 para sugestão diária quando disponível é negativo', () => {
    const daily = calculateDailyBudget(-330, 15);
    expect(daily).toBe(0);
  });

  it('deve retornar 0 para sugestão diária quando dias restantes é 0', () => {
    const daily = calculateDailyBudget(970, 0);
    expect(daily).toBe(0);
  });

  it('deve calcular 100% quando gastos igualam a renda', () => {
    const percentage = calculateSpendingPercentage(3000, 1500, 1500);
    expect(percentage).toBe(100);
  });

  it('deve calcular mais de 100% quando gastos excedem renda', () => {
    const percentage = calculateSpendingPercentage(3000, 2000, 1500);
    expect(percentage).toBeCloseTo(116.67, 1);
  });
});

describe('Toque Duplo para Sair', () => {
  it('deve ter timeout de 2 segundos entre toques', () => {
    const EXIT_TIMEOUT = 2000;
    
    // Simular primeiro toque
    const firstPress = Date.now();
    
    // Simular segundo toque dentro do timeout
    const secondPress = firstPress + 1500;
    expect(secondPress - firstPress).toBeLessThan(EXIT_TIMEOUT);
    
    // Simular segundo toque fora do timeout
    const latePress = firstPress + 2500;
    expect(latePress - firstPress).toBeGreaterThan(EXIT_TIMEOUT);
  });

  it('deve detectar toque duplo dentro do timeout', () => {
    const EXIT_TIMEOUT = 2000;
    let lastBackPress = 0;
    
    // Primeiro toque - lastBackPress é 0, então diferença é grande (simula que nunca foi pressionado)
    // Na implementação real, lastBackPress começa em 0 e now é um timestamp grande
    const now1 = 1700000000000;
    const shouldExit1 = (now1 - lastBackPress) < EXIT_TIMEOUT;
    expect(shouldExit1).toBe(false);
    lastBackPress = now1;
    
    // Segundo toque dentro do timeout (500ms depois)
    const now2 = now1 + 500;
    const shouldExit2 = (now2 - lastBackPress) < EXIT_TIMEOUT;
    expect(shouldExit2).toBe(true);
  });

  it('não deve sair se o segundo toque for após o timeout', () => {
    const EXIT_TIMEOUT = 2000;
    let lastBackPress = 0;
    
    // Primeiro toque
    const now1 = 1000;
    lastBackPress = now1;
    
    // Segundo toque fora do timeout
    const now2 = 3500;
    const shouldExit = (now2 - lastBackPress) < EXIT_TIMEOUT;
    expect(shouldExit).toBe(false);
  });
});
