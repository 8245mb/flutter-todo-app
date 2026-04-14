/**
 * Expense category types
 */
export type ExpenseCategory = 'personal' | 'collective' | 'institutional';

/**
 * Supported currencies
 */
export type Currency = 'BRL' | 'USD' | 'EUR';

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€',
};

/**
 * Category labels in Portuguese
 */
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  personal: 'Pessoal',
  collective: 'Coletivo',
  institutional: 'Institucional',
};

/**
 * Category colors for visual distinction
 */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  personal: '#3B82F6', // Blue
  collective: '#10B981', // Green
  institutional: '#8B5CF6', // Purple
};

/**
 * Expense model representing a financial record
 */
export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  createdAt: number;
  updatedAt: number;
  taskId?: string; // Optional reference to a task
}

/**
 * Input type for creating a new expense
 */
export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Input type for updating an existing expense
 */
export type UpdateExpenseInput = Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Summary statistics for expenses
 */
export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  count: number;
  currency: Currency;
}
