/**
 * Context para o Assistente Proativo
 * Gerencia todos os módulos de economia automática
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FixedBudget,
  ChangeSavings,
  ChangeRounding,
  SavingsGoal,
  RecurringExpense,
  SubscriptionAlert,
  AISettings,
} from '@/lib/types/ai-modules';
import type { Expense } from '@/lib/types/expense';
import { FixedBudgetService } from '@/lib/services/fixed-budget-service';
import { useExpenses } from './expense-context';

const STORAGE_KEYS = {
  changeSavings: '@change_savings',
  changeRoundings: '@change_roundings',
  savingsGoal: '@savings_goal',
  recurringExpenses: '@recurring_expenses',
  subscriptionAlerts: '@subscription_alerts',
  aiSettings: '@ai_settings',
};

interface AssistantContextType {
  // Valor Fixo Inteligente
  fixedBudget: FixedBudget | null;
  setMonthlyBudget: (amount: number) => Promise<void>;
  refreshBudget: () => Promise<void>;

  // Guardar o Troco
  changeSavings: ChangeSavings;
  changeRoundings: ChangeRounding[];
  addChangeRounding: (originalAmount: number, expenseId: string) => Promise<number>;

  // Meta de Economia
  savingsGoal: SavingsGoal | null;
  setSavingsGoal: (targetAmount: number, deadline: string) => Promise<void>;
  updateSavingsProgress: (amount: number) => Promise<void>;

  // Caçador de Assinaturas
  recurringExpenses: RecurringExpense[];
  subscriptionAlerts: SubscriptionAlert[];
  detectRecurringExpenses: () => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;

  // Configurações
  aiSettings: AISettings;
  updateAISettings: (settings: Partial<AISettings>) => Promise<void>;

  // Estado
  isLoading: boolean;
}

const defaultSettings: AISettings = {
  ocrEnabled: true,
  autoExtractData: true,
  fixedBudgetEnabled: true,
  changeRoundingEnabled: true,
  savingsGoalEnabled: true,
  subscriptionHunterEnabled: true,
  predictiveAnalysisEnabled: true,
  notificationsEnabled: true,
};

const defaultChangeSavings: ChangeSavings = {
  totalSaved: 0,
  transactionCount: 0,
  averageSaving: 0,
};

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const { expenses } = useExpenses();

  const [fixedBudget, setFixedBudget] = useState<FixedBudget | null>(null);
  const [changeSavings, setChangeSavings] = useState<ChangeSavings>(defaultChangeSavings);
  const [changeRoundings, setChangeRoundings] = useState<ChangeRounding[]>([]);
  const [savingsGoal, setSavingsGoalState] = useState<SavingsGoal | null>(null);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [subscriptionAlerts, setSubscriptionAlerts] = useState<SubscriptionAlert[]>([]);
  const [aiSettings, setAISettings] = useState<AISettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais
  useEffect(() => {
    loadAllData();
  }, []);

  // Atualizar orçamento quando gastos mudam
  useEffect(() => {
    if (fixedBudget && expenses.length > 0) {
      FixedBudgetService.updateSpending(expenses).then((updated) => {
        if (updated) setFixedBudget(updated);
      });
    }
  }, [expenses]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Carregar orçamento fixo
      const budget = await FixedBudgetService.getBudget();
      setFixedBudget(budget);

      // Carregar economia do troco
      const savingsData = await AsyncStorage.getItem(STORAGE_KEYS.changeSavings);
      if (savingsData) setChangeSavings(JSON.parse(savingsData));

      const roundingsData = await AsyncStorage.getItem(STORAGE_KEYS.changeRoundings);
      if (roundingsData) setChangeRoundings(JSON.parse(roundingsData));

      // Carregar meta de economia
      const goalData = await AsyncStorage.getItem(STORAGE_KEYS.savingsGoal);
      if (goalData) setSavingsGoalState(JSON.parse(goalData));

      // Carregar gastos recorrentes
      const recurringData = await AsyncStorage.getItem(STORAGE_KEYS.recurringExpenses);
      if (recurringData) setRecurringExpenses(JSON.parse(recurringData));

      const alertsData = await AsyncStorage.getItem(STORAGE_KEYS.subscriptionAlerts);
      if (alertsData) setSubscriptionAlerts(JSON.parse(alertsData));

      // Carregar configurações
      const settingsData = await AsyncStorage.getItem(STORAGE_KEYS.aiSettings);
      if (settingsData) setAISettings(JSON.parse(settingsData));
    } catch (error) {
      console.error('Error loading assistant data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Valor Fixo Inteligente
  const setMonthlyBudget = async (amount: number) => {
    const budget = await FixedBudgetService.setBudget(amount);
    const updated = await FixedBudgetService.updateSpending(expenses);
    setFixedBudget(updated || budget);
  };

  const refreshBudget = async () => {
    const updated = await FixedBudgetService.updateSpending(expenses);
    if (updated) setFixedBudget(updated);
  };

  // Guardar o Troco
  const addChangeRounding = async (originalAmount: number, expenseId: string): Promise<number> => {
    // Arredondar para o próximo inteiro
    const roundedAmount = Math.ceil(originalAmount);
    const savedAmount = roundedAmount - originalAmount;

    if (savedAmount <= 0) return 0;

    const rounding: ChangeRounding = {
      id: `rounding_${Date.now()}`,
      originalAmount,
      roundedAmount,
      savedAmount,
      expenseId,
      createdAt: new Date().toISOString(),
    };

    const newRoundings = [...changeRoundings, rounding];
    setChangeRoundings(newRoundings);
    await AsyncStorage.setItem(STORAGE_KEYS.changeRoundings, JSON.stringify(newRoundings));

    // Atualizar totais
    const newSavings: ChangeSavings = {
      totalSaved: changeSavings.totalSaved + savedAmount,
      transactionCount: changeSavings.transactionCount + 1,
      averageSaving: (changeSavings.totalSaved + savedAmount) / (changeSavings.transactionCount + 1),
    };
    setChangeSavings(newSavings);
    await AsyncStorage.setItem(STORAGE_KEYS.changeSavings, JSON.stringify(newSavings));

    return savedAmount;
  };

  // Meta de Economia
  const setSavingsGoal = async (targetAmount: number, deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const monthsRemaining = Math.max(1, Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));

    const goal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      targetAmount,
      currentAmount: 0,
      deadline,
      suggestedMonthlyContribution: targetAmount / monthsRemaining,
      status: 'active',
      progress: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    setSavingsGoalState(goal);
    await AsyncStorage.setItem(STORAGE_KEYS.savingsGoal, JSON.stringify(goal));
  };

  const updateSavingsProgress = async (amount: number) => {
    if (!savingsGoal) return;

    const newAmount = savingsGoal.currentAmount + amount;
    const progress = Math.min(100, (newAmount / savingsGoal.targetAmount) * 100);

    const updated: SavingsGoal = {
      ...savingsGoal,
      currentAmount: newAmount,
      progress,
      status: progress >= 100 ? 'completed' : 'active',
      updatedAt: new Date().toISOString(),
    };

    setSavingsGoalState(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.savingsGoal, JSON.stringify(updated));
  };

  // Caçador de Assinaturas
  const detectRecurringExpenses = useCallback(async () => {
    // Agrupar gastos por descrição similar
    const expenseGroups: Record<string, Expense[]> = {};

    expenses.forEach((expense) => {
      const key = expense.description.toLowerCase().trim();
      if (!expenseGroups[key]) expenseGroups[key] = [];
      expenseGroups[key].push(expense);
    });

    const detected: RecurringExpense[] = [];

    Object.entries(expenseGroups).forEach(([name, group]) => {
      if (group.length >= 2) {
        // Verificar se os gastos são regulares (mensal)
        const sortedByDate = group.sort((a, b) => a.createdAt - b.createdAt);
        const intervals: number[] = [];

        for (let i = 1; i < sortedByDate.length; i++) {
          const daysDiff = (sortedByDate[i].createdAt - sortedByDate[i - 1].createdAt) / (1000 * 60 * 60 * 24);
          intervals.push(daysDiff);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        let frequency: 'mensal' | 'semanal' | 'anual' = 'mensal';

        if (avgInterval >= 25 && avgInterval <= 35) frequency = 'mensal';
        else if (avgInterval >= 5 && avgInterval <= 10) frequency = 'semanal';
        else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'anual';
        else return; // Não é recorrente

        const lastExpense = sortedByDate[sortedByDate.length - 1];
        const nextRenewal = new Date(lastExpense.createdAt);
        if (frequency === 'mensal') nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        else if (frequency === 'semanal') nextRenewal.setDate(nextRenewal.getDate() + 7);
        else nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);

        detected.push({
          id: `recurring_${Date.now()}_${name.slice(0, 10)}`,
          name: group[0].description,
          amount: group[group.length - 1].amount,
          frequency,
          nextRenewalDate: nextRenewal.toISOString(),
          category: group[0].category as 'pessoal' | 'coletivo' | 'institucional',
          detectedExpenseIds: group.map((e) => e.id),
          confidence: Math.min(0.9, 0.5 + group.length * 0.1),
          alertEnabled: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    setRecurringExpenses(detected);
    await AsyncStorage.setItem(STORAGE_KEYS.recurringExpenses, JSON.stringify(detected));

    // Gerar alertas para renovações próximas
    const now = new Date();
    const alerts: SubscriptionAlert[] = [];

    detected.forEach((recurring) => {
      const renewalDate = new Date(recurring.nextRenewalDate);
      const daysUntil = Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 7 && daysUntil > 0) {
        alerts.push({
          id: `alert_${recurring.id}`,
          recurringExpenseId: recurring.id,
          message: `${recurring.name} será renovado em ${daysUntil} dia${daysUntil > 1 ? 's' : ''} (R$ ${recurring.amount.toFixed(2)})`,
          daysUntilRenewal: daysUntil,
          dismissed: false,
          createdAt: now.toISOString(),
        });
      }
    });

    setSubscriptionAlerts(alerts);
    await AsyncStorage.setItem(STORAGE_KEYS.subscriptionAlerts, JSON.stringify(alerts));
  }, [expenses]);

  const dismissAlert = async (alertId: string) => {
    const updated = subscriptionAlerts.map((alert) =>
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    );
    setSubscriptionAlerts(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.subscriptionAlerts, JSON.stringify(updated));
  };

  // Configurações
  const updateAISettings = async (settings: Partial<AISettings>) => {
    const updated = { ...aiSettings, ...settings };
    setAISettings(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(updated));
  };

  return (
    <AssistantContext.Provider
      value={{
        fixedBudget,
        setMonthlyBudget,
        refreshBudget,
        changeSavings,
        changeRoundings,
        addChangeRounding,
        savingsGoal,
        setSavingsGoal,
        updateSavingsProgress,
        recurringExpenses,
        subscriptionAlerts,
        detectRecurringExpenses,
        dismissAlert,
        aiSettings,
        updateAISettings,
        isLoading,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}
