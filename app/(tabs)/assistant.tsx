/**
 * Aba Assistente Proativo
 * Módulos de economia automática: Valor Fixo, Guardar Troco, Metas, Gastos Gerais
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useAssistant } from '@/lib/contexts/assistant-context';
import { FixedBudgetCard } from '@/components/fixed-budget-card';
import { ChangeSavingsCard } from '@/components/change-savings-card';
import { SavingsGoalCard } from '@/components/savings-goal-card';
import { PremiumPaywall } from '@/components/premium-paywall';
import { useAppAuth } from '@/lib/contexts/app-auth-context';
import { useExpenses } from '@/lib/contexts/expense-context';
import { useColors } from '@/hooks/use-colors';

const STORAGE_KEY_INCOME = '@monthly_income';
const STORAGE_KEY_FIXED_EXPENSES = '@fixed_monthly_expenses';

interface FixedExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export default function AssistantScreen() {
  const colors = useColors();
  const { isPremium, user } = useAppAuth();
  const { expenses, summary } = useExpenses();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const {
    fixedBudget,
    setMonthlyBudget,
    refreshBudget,
    changeSavings,
    savingsGoal,
    setSavingsGoal,
    aiSettings,
    isLoading,
  } = useAssistant();

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showAddFixedExpenseModal, setShowAddFixedExpenseModal] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Gastos Gerais state
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [incomeInput, setIncomeInput] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseItem[]>([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  // Refs
  const budgetInputRef = useRef<TextInput>(null);
  const goalAmountRef = useRef<TextInput>(null);
  const goalDeadlineRef = useRef<TextInput>(null);
  const incomeInputRef = useRef<TextInput>(null);
  const expenseNameRef = useRef<TextInput>(null);
  const expenseAmountRef = useRef<TextInput>(null);

  // Carregar dados de renda e gastos fixos
  useEffect(() => {
    loadIncomeAndExpenses();
  }, []);

  const loadIncomeAndExpenses = async () => {
    try {
      const incomeData = await AsyncStorage.getItem(STORAGE_KEY_INCOME);
      if (incomeData) setMonthlyIncome(parseFloat(incomeData));

      const expensesData = await AsyncStorage.getItem(STORAGE_KEY_FIXED_EXPENSES);
      if (expensesData) setFixedExpenses(JSON.parse(expensesData));
    } catch (error) {
      console.error('Error loading income data:', error);
    }
  };

  // Cálculos automáticos
  const totalFixedExpenses = useMemo(() => {
    return fixedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [fixedExpenses]);

  const totalVariableExpenses = useMemo(() => {
    // Gastos variáveis do mês atual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return expenses
      .filter(e => e.createdAt >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const availableToSpend = useMemo(() => {
    return monthlyIncome - totalFixedExpenses - totalVariableExpenses;
  }, [monthlyIncome, totalFixedExpenses, totalVariableExpenses]);

  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate() + 1;
  }, []);

  const dailyBudgetSuggestion = useMemo(() => {
    if (availableToSpend <= 0 || daysRemainingInMonth <= 0) return 0;
    return availableToSpend / daysRemainingInMonth;
  }, [availableToSpend, daysRemainingInMonth]);

  const spendingPercentage = useMemo(() => {
    if (monthlyIncome <= 0) return 0;
    return ((totalFixedExpenses + totalVariableExpenses) / monthlyIncome) * 100;
  }, [monthlyIncome, totalFixedExpenses, totalVariableExpenses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBudget();
    await loadIncomeAndExpenses();
    setRefreshing(false);
  };

  const handleSetBudget = async () => {
    const amount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await setMonthlyBudget(amount);
    setShowBudgetModal(false);
    setBudgetAmount('');
  };

  const handleSetGoal = async () => {
    const amount = parseFloat(goalAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || !goalDeadline) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await setSavingsGoal(amount, goalDeadline);
    setShowGoalModal(false);
    setGoalAmount('');
    setGoalDeadline('');
  };

  const handleSetIncome = async () => {
    const amount = parseFloat(incomeInput.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setMonthlyIncome(amount);
    await AsyncStorage.setItem(STORAGE_KEY_INCOME, amount.toString());
    setShowIncomeModal(false);
    setIncomeInput('');
  };

  const handleAddFixedExpense = async () => {
    const amount = parseFloat(newExpenseAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0 || !newExpenseName.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newItem: FixedExpenseItem = {
      id: `fixed_${Date.now()}`,
      name: newExpenseName.trim(),
      amount,
    };

    const updated = [...fixedExpenses, newItem];
    setFixedExpenses(updated);
    await AsyncStorage.setItem(STORAGE_KEY_FIXED_EXPENSES, JSON.stringify(updated));
    setShowAddFixedExpenseModal(false);
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const handleRemoveFixedExpense = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const updated = fixedExpenses.filter(e => e.id !== id);
    setFixedExpenses(updated);
    await AsyncStorage.setItem(STORAGE_KEY_FIXED_EXPENSES, JSON.stringify(updated));
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Se não for premium, mostrar tela de bloqueio
  if (!isPremium) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-24 h-24 bg-warning/20 rounded-full items-center justify-center mb-6">
            <Text className="text-5xl">⭐</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            Assistente Premium
          </Text>
          <Text className="text-base text-muted text-center mb-8">
            Desbloqueie todas as funcionalidades de IA para economizar mais dinheiro automaticamente.
          </Text>
          
          <View className="w-full bg-surface rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-3">🎯</Text>
              <Text className="text-foreground">Valor Fixo Inteligente</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-3">💰</Text>
              <Text className="text-foreground">Guardar o Troco</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Text className="text-xl mr-3">📊</Text>
              <Text className="text-foreground">Meta de Economia</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-xl mr-3">📋</Text>
              <Text className="text-foreground">Gastos Gerais com Cálculo Automático</Text>
            </View>
          </View>

          <View className="w-full items-center mb-4">
            <Text className="text-3xl font-bold text-foreground">R$ 9,99<Text className="text-lg font-normal text-muted">/mês</Text></Text>
            <Text className="text-sm text-muted">ou R$ 110/ano (economia de 8%)</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowPaywall(true)}
            className="w-full py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Assinar Premium</Text>
          </TouchableOpacity>
        </View>
        
        <PremiumPaywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="mb-6">
          <View className="flex-row items-center">
            <Text className="text-3xl font-bold text-foreground">
              Assistente Proativo
            </Text>
            <View className="ml-2 px-2 py-1 bg-warning rounded-full">
              <Text className="text-xs font-bold text-background">PREMIUM</Text>
            </View>
          </View>
          <Text className="text-muted text-base mt-1">
            Economize automaticamente com inteligência
          </Text>
        </View>

        {/* ========== GASTOS GERAIS ========== */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">
              📋 Gastos Gerais
            </Text>
            <TouchableOpacity
              onPress={() => {
                setIncomeInput(monthlyIncome > 0 ? monthlyIncome.toString() : '');
                setShowIncomeModal(true);
              }}
              className="bg-primary px-4 py-2 rounded-full"
              accessibilityLabel="Definir renda mensal"
              accessibilityRole="button"
            >
              <Text className="text-background font-semibold">
                {monthlyIncome > 0 ? 'Editar Renda' : 'Definir Renda'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resumo de Renda */}
          <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-3">
            <View className="p-4 border-b border-border">
              <Text className="text-sm text-muted mb-1">Renda Mensal</Text>
              <Text className="text-2xl font-bold text-foreground">
                {monthlyIncome > 0 ? formatCurrency(monthlyIncome) : 'Não definida'}
              </Text>
            </View>

            {monthlyIncome > 0 && (
              <>
                {/* Barra de progresso de gastos */}
                <View className="p-4 border-b border-border">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-muted">Gastos do mês</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {spendingPercentage.toFixed(0)}%
                    </Text>
                  </View>
                  <View className="h-3 bg-border rounded-full overflow-hidden">
                    <View
                      style={{
                        width: `${Math.min(spendingPercentage, 100)}%`,
                        backgroundColor: spendingPercentage > 90 ? colors.error : spendingPercentage > 70 ? colors.warning : colors.success,
                        height: '100%',
                        borderRadius: 999,
                      }}
                    />
                  </View>
                </View>

                {/* Resumo de valores */}
                <View className="p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-muted">Gastos Fixos</Text>
                    <Text className="text-sm font-semibold text-error">
                      - {formatCurrency(totalFixedExpenses)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm text-muted">Gastos Variáveis (mês)</Text>
                    <Text className="text-sm font-semibold text-error">
                      - {formatCurrency(totalVariableExpenses)}
                    </Text>
                  </View>
                  <View className="h-px bg-border my-2" />
                  <View className="flex-row justify-between">
                    <Text className="text-base font-bold text-foreground">Disponível</Text>
                    <Text
                      className="text-base font-bold"
                      style={{ color: availableToSpend >= 0 ? colors.success : colors.error }}
                    >
                      {formatCurrency(availableToSpend)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Sugestão diária */}
          {monthlyIncome > 0 && dailyBudgetSuggestion > 0 && (
            <View className="bg-primary/10 p-4 rounded-xl mb-3">
              <Text className="text-primary text-sm font-semibold text-center">
                Sugestão: gaste no máximo {formatCurrency(dailyBudgetSuggestion)}/dia
              </Text>
              <Text className="text-primary/70 text-xs text-center mt-1">
                Restam {daysRemainingInMonth} dias no mês
              </Text>
            </View>
          )}

          {/* Gastos Fixos Mensais */}
          <View className="bg-surface rounded-2xl border border-border p-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-semibold text-foreground">
                Gastos Fixos Mensais
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddFixedExpenseModal(true)}
                style={{ backgroundColor: colors.primary }}
                className="w-8 h-8 rounded-full items-center justify-center"
                accessibilityLabel="Adicionar gasto fixo"
                accessibilityRole="button"
              >
                <Text className="text-white text-lg font-bold">+</Text>
              </TouchableOpacity>
            </View>

            {fixedExpenses.length > 0 ? (
              fixedExpenses.map((item) => (
                <View key={item.id} className="flex-row justify-between items-center py-3 border-b border-border">
                  <View className="flex-1">
                    <Text className="text-foreground">{item.name}</Text>
                  </View>
                  <Text className="text-error font-semibold mr-3">
                    {formatCurrency(item.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFixedExpense(item.id)}
                    className="w-7 h-7 rounded-full bg-error/20 items-center justify-center"
                    accessibilityLabel={`Remover ${item.name}`}
                    accessibilityRole="button"
                  >
                    <Text className="text-error text-sm font-bold">X</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text className="text-muted text-center py-2">
                Nenhum gasto fixo cadastrado. Adicione aluguel, contas, etc.
              </Text>
            )}

            {fixedExpenses.length > 0 && (
              <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
                <Text className="text-base font-bold text-foreground">Total Fixo</Text>
                <Text className="text-base font-bold text-error">
                  {formatCurrency(totalFixedExpenses)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Valor Fixo Inteligente */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">
              💰 Valor Fixo Inteligente
            </Text>
            {!fixedBudget && (
              <TouchableOpacity
                onPress={() => setShowBudgetModal(true)}
                className="bg-primary px-4 py-2 rounded-full"
                accessibilityLabel="Definir orçamento mensal"
                accessibilityRole="button"
              >
                <Text className="text-background font-semibold">Definir</Text>
              </TouchableOpacity>
            )}
          </View>

          {fixedBudget ? (
            <FixedBudgetCard
              budget={fixedBudget}
              onEdit={() => setShowBudgetModal(true)}
            />
          ) : (
            <View className="bg-surface p-6 rounded-2xl border border-border">
              <Text className="text-muted text-center">
                Defina um orçamento mensal para gastos livres.
                O assistente vai calcular quanto você pode gastar por dia.
              </Text>
            </View>
          )}
        </View>

        {/* Guardar o Troco */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">
            🪙 Guardar o Troco
          </Text>
          <ChangeSavingsCard savings={changeSavings} />
        </View>

        {/* Meta de Economia */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">
              🎯 Meta de Economia
            </Text>
            {!savingsGoal && (
              <TouchableOpacity
                onPress={() => setShowGoalModal(true)}
                className="bg-primary px-4 py-2 rounded-full"
                accessibilityLabel="Criar meta de economia"
                accessibilityRole="button"
              >
                <Text className="text-background font-semibold">Criar</Text>
              </TouchableOpacity>
            )}
          </View>

          {savingsGoal ? (
            <SavingsGoalCard
              goal={savingsGoal}
              onEdit={() => setShowGoalModal(true)}
            />
          ) : (
            <View className="bg-surface p-6 rounded-2xl border border-border">
              <Text className="text-muted text-center">
                Crie uma meta de economia e acompanhe seu progresso.
                O assistente sugere quanto guardar por mês.
              </Text>
            </View>
          )}
        </View>

        {/* Dica */}
        <View className="bg-primary/10 p-4 rounded-xl">
          <Text className="text-primary text-sm text-center">
            O Assistente Proativo analisa seus gastos automaticamente
            e oferece sugestões personalizadas para economizar.
          </Text>
        </View>
      </ScrollView>

      {/* Modal Definir Orçamento */}
      <Modal visible={showBudgetModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={Platform.OS === 'android'}
            >
              <View className="bg-background rounded-t-3xl p-6 pb-12">
                <Text className="text-xl font-bold text-foreground mb-4">
                  Definir Orçamento Mensal
                </Text>
                <Text className="text-muted mb-4">
                  Quanto você quer gastar no máximo por mês em gastos livres?
                </Text>
                <View className="flex-row items-center mb-6">
                  <Text className="text-2xl font-bold text-foreground mr-2">R$</Text>
                  <TextInput
                    ref={budgetInputRef}
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    placeholder="0,00"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="decimal-pad"
                    className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground text-2xl"
                    accessibilityLabel="Valor do orçamento mensal"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      handleSetBudget();
                      budgetInputRef.current?.blur();
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSetBudget}
                  className="bg-primary p-4 rounded-xl mb-3"
                  accessibilityLabel="Confirmar orçamento"
                  accessibilityRole="button"
                >
                  <Text className="text-background font-bold text-center text-lg">
                    Confirmar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowBudgetModal(false)}
                  className="p-4"
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text className="text-muted text-center">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Criar Meta */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={Platform.OS === 'android'}
            >
              <View className="bg-background rounded-t-3xl p-6 pb-12">
                <Text className="text-xl font-bold text-foreground mb-4">
                  Criar Meta de Economia
                </Text>
                <Text className="text-muted mb-4">
                  Quanto você quer economizar e até quando?
                </Text>
                <View className="mb-4">
                  <Text className="text-foreground font-semibold mb-2">Valor da Meta</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xl font-bold text-foreground mr-2">R$</Text>
                    <TextInput
                      ref={goalAmountRef}
                      value={goalAmount}
                      onChangeText={setGoalAmount}
                      placeholder="0,00"
                      placeholderTextColor="#9BA1A6"
                      keyboardType="decimal-pad"
                      className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground text-xl"
                      accessibilityLabel="Valor da meta"
                      returnKeyType="next"
                      onSubmitEditing={() => goalDeadlineRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>
                </View>
                <View className="mb-6">
                  <Text className="text-foreground font-semibold mb-2">Prazo (AAAA-MM-DD)</Text>
                  <TextInput
                    ref={goalDeadlineRef}
                    value={goalDeadline}
                    onChangeText={setGoalDeadline}
                    placeholder="2025-12-31"
                    placeholderTextColor="#9BA1A6"
                    className="bg-surface border border-border rounded-xl p-4 text-foreground text-lg"
                    accessibilityLabel="Prazo da meta"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      handleSetGoal();
                      goalDeadlineRef.current?.blur();
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSetGoal}
                  className="bg-primary p-4 rounded-xl mb-3"
                  accessibilityLabel="Criar meta"
                  accessibilityRole="button"
                >
                  <Text className="text-background font-bold text-center text-lg">
                    Criar Meta
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowGoalModal(false)}
                  className="p-4"
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text className="text-muted text-center">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Definir Renda Mensal */}
      <Modal visible={showIncomeModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={Platform.OS === 'android'}
            >
              <View className="bg-background rounded-t-3xl p-6 pb-12">
                <Text className="text-xl font-bold text-foreground mb-4">
                  Renda Mensal
                </Text>
                <Text className="text-muted mb-4">
                  Informe quanto você recebe por mês. O cálculo automático vai mostrar quanto pode gastar.
                </Text>
                <View className="flex-row items-center mb-6">
                  <Text className="text-2xl font-bold text-foreground mr-2">R$</Text>
                  <TextInput
                    ref={incomeInputRef}
                    value={incomeInput}
                    onChangeText={setIncomeInput}
                    placeholder="0,00"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="decimal-pad"
                    className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground text-2xl"
                    accessibilityLabel="Valor da renda mensal"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      handleSetIncome();
                      incomeInputRef.current?.blur();
                    }}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSetIncome}
                  className="bg-primary p-4 rounded-xl mb-3"
                  accessibilityLabel="Confirmar renda"
                  accessibilityRole="button"
                >
                  <Text className="text-background font-bold text-center text-lg">
                    Confirmar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowIncomeModal(false)}
                  className="p-4"
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text className="text-muted text-center">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal Adicionar Gasto Fixo */}
      <Modal visible={showAddFixedExpenseModal} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <View className="flex-1 bg-black/50 justify-end">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={Platform.OS === 'android'}
            >
              <View className="bg-background rounded-t-3xl p-6 pb-12">
                <Text className="text-xl font-bold text-foreground mb-4">
                  Adicionar Gasto Fixo
                </Text>
                <Text className="text-muted mb-4">
                  Adicione gastos fixos como aluguel, contas de luz, internet, etc.
                </Text>
                <View className="mb-4">
                  <Text className="text-foreground font-semibold mb-2">Nome do Gasto</Text>
                  <TextInput
                    ref={expenseNameRef}
                    value={newExpenseName}
                    onChangeText={setNewExpenseName}
                    placeholder="Ex: Aluguel, Internet, Luz..."
                    placeholderTextColor="#9BA1A6"
                    className="bg-surface border border-border rounded-xl p-4 text-foreground text-lg"
                    accessibilityLabel="Nome do gasto fixo"
                    returnKeyType="next"
                    onSubmitEditing={() => expenseAmountRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>
                <View className="mb-6">
                  <Text className="text-foreground font-semibold mb-2">Valor Mensal</Text>
                  <View className="flex-row items-center">
                    <Text className="text-xl font-bold text-foreground mr-2">R$</Text>
                    <TextInput
                      ref={expenseAmountRef}
                      value={newExpenseAmount}
                      onChangeText={setNewExpenseAmount}
                      placeholder="0,00"
                      placeholderTextColor="#9BA1A6"
                      keyboardType="decimal-pad"
                      className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground text-xl"
                      accessibilityLabel="Valor do gasto fixo"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        handleAddFixedExpense();
                        expenseAmountRef.current?.blur();
                      }}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleAddFixedExpense}
                  className="bg-primary p-4 rounded-xl mb-3"
                  accessibilityLabel="Adicionar gasto fixo"
                  accessibilityRole="button"
                >
                  <Text className="text-background font-bold text-center text-lg">
                    Adicionar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddFixedExpenseModal(false);
                    setNewExpenseName('');
                    setNewExpenseAmount('');
                  }}
                  className="p-4"
                  accessibilityLabel="Cancelar"
                  accessibilityRole="button"
                >
                  <Text className="text-muted text-center">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
