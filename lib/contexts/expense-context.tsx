import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import type {
  Expense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseSummary,
  Currency,
  ExpenseCategory,
} from '@/lib/types/expense';
import * as ExpenseStorage from '@/lib/services/expense-storage';
import { showToast } from '@/components/toast';

interface ExpenseContextValue {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  summary: ExpenseSummary;
  loadExpenses: () => Promise<void>;
  addExpense: (input: CreateExpenseInput) => Promise<Expense | null>;
  updateExpense: (id: string, input: UpdateExpenseInput) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  clearError: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

/**
 * Expense Context Provider
 * Manages global state for expenses with centralized error handling
 */
export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate summary statistics
   */
  const summary = useMemo((): ExpenseSummary => {
    if (expenses.length === 0) {
      return {
        total: 0,
        byCategory: {
          personal: 0,
          collective: 0,
          institutional: 0,
        },
        count: 0,
        currency: 'BRL',
      };
    }

    // Use the most common currency
    const currencyCounts: Record<Currency, number> = { BRL: 0, USD: 0, EUR: 0 };
    expenses.forEach(e => currencyCounts[e.currency]++);
    const mainCurrency = (Object.keys(currencyCounts) as Currency[]).reduce((a, b) =>
      currencyCounts[a] > currencyCounts[b] ? a : b
    );

    // Calculate totals
    const byCategory: Record<ExpenseCategory, number> = {
      personal: 0,
      collective: 0,
      institutional: 0,
    };

    let total = 0;

    expenses.forEach(expense => {
      // Only sum expenses with the main currency
      if (expense.currency === mainCurrency) {
        total += expense.amount;
        byCategory[expense.category] += expense.amount;
      }
    });

    return {
      total,
      byCategory,
      count: expenses.length,
      currency: mainCurrency,
    };
  }, [expenses]);

  /**
   * Load all expenses from storage
   */
  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedExpenses = await ExpenseStorage.loadExpenses();
      const sortedExpenses = loadedExpenses.sort((a, b) => b.createdAt - a.createdAt);
      setExpenses(sortedExpenses);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar gastos';
      setError(message);
      console.error('Error loading expenses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add a new expense
   */
  const addExpense = useCallback(async (input: CreateExpenseInput): Promise<Expense | null> => {
    setError(null);
    try {
      const newExpense = await ExpenseStorage.createExpense(input);
      setExpenses(prev => [newExpense, ...prev]);
      showToast.success('Gasto registrado!', 'O gasto foi adicionado com sucesso');
      return newExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar gasto';
      setError(message);
      console.error('Error creating expense:', err);
      return null;
    }
  }, []);

  /**
   * Update an existing expense
   */
  const updateExpense = useCallback(
    async (id: string, input: UpdateExpenseInput): Promise<Expense | null> => {
      setError(null);
      try {
        const updatedExpense = await ExpenseStorage.updateExpense(id, input);
        if (updatedExpense) {
          setExpenses(prev => prev.map(expense => (expense.id === id ? updatedExpense : expense)));
          showToast.success('Gasto atualizado!', 'As alterações foram salvas');
        }
        return updatedExpense;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao atualizar gasto';
        setError(message);
        console.error('Error updating expense:', err);
        return null;
      }
    },
    []
  );

  /**
   * Delete an expense
   */
  const deleteExpense = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const success = await ExpenseStorage.deleteExpense(id);
      if (success) {
        setExpenses(prev => prev.filter(expense => expense.id !== id));
        showToast.success('Gasto deletado', 'O gasto foi removido com sucesso');
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar gasto';
      setError(message);
      console.error('Error deleting expense:', err);
      return false;
    }
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: ExpenseContextValue = {
    expenses,
    isLoading,
    error,
    summary,
    loadExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    clearError,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

/**
 * Hook to access expense context
 * @throws Error if used outside ExpenseProvider
 */
export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
}
