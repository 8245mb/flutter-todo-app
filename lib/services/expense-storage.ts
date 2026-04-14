import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '@/lib/types/expense';

const STORAGE_KEY = '@expenses';

/**
 * Generate a unique ID for an expense
 */
function generateId(): string {
  return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all expenses from storage
 */
export async function loadExpenses(): Promise<Expense[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Expense[];
  } catch (error) {
    console.error('Error loading expenses:', error);
    throw new Error('Não foi possível carregar os gastos');
  }
}

/**
 * Save expenses to storage
 */
async function saveExpenses(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error('Error saving expenses:', error);
    throw new Error('Não foi possível salvar os gastos');
  }
}

/**
 * Create a new expense
 */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  try {
    const expenses = await loadExpenses();
    const now = Date.now();
    
    const newExpense: Expense = {
      ...input,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    expenses.push(newExpense);
    await saveExpenses(expenses);
    
    return newExpense;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw new Error('Não foi possível criar o gasto');
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  input: UpdateExpenseInput
): Promise<Expense | null> {
  try {
    const expenses = await loadExpenses();
    const index = expenses.findIndex(e => e.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedExpense: Expense = {
      ...expenses[index],
      ...input,
      updatedAt: Date.now(),
    };
    
    expenses[index] = updatedExpense;
    await saveExpenses(expenses);
    
    return updatedExpense;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Não foi possível atualizar o gasto');
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<boolean> {
  try {
    const expenses = await loadExpenses();
    const filtered = expenses.filter(e => e.id !== id);
    
    if (filtered.length === expenses.length) {
      return false; // Expense not found
    }
    
    await saveExpenses(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Não foi possível deletar o gasto');
  }
}

/**
 * Get expense by ID
 */
export async function getExpenseById(id: string): Promise<Expense | null> {
  try {
    const expenses = await loadExpenses();
    return expenses.find(e => e.id === id) || null;
  } catch (error) {
    console.error('Error getting expense:', error);
    return null;
  }
}

/**
 * Clear all expenses (for testing/reset purposes)
 */
export async function clearAllExpenses(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing expenses:', error);
    throw new Error('Não foi possível limpar os gastos');
  }
}
