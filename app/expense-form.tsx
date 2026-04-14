import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useExpenses } from '@/lib/contexts/expense-context';
import { useAssistant } from '@/lib/contexts/assistant-context';
import type {
  ExpenseCategory,
  Currency,
  CreateExpenseInput,
} from '@/lib/types/expense';
import { CATEGORY_LABELS, CURRENCY_SYMBOLS, CATEGORY_COLORS } from '@/lib/types/expense';
import * as ExpenseStorage from '@/lib/services/expense-storage';
import { OCRCapture } from '@/components/ocr-capture';
import { OCRReview } from '@/components/ocr-review';
import type { OCRExtractedData } from '@/lib/types/ai-modules';

// Tipo para dados revisados do OCR
interface OCRReviewedData {
  description: string;
  amount: number;
  currency: Currency;
  category: ExpenseCategory;
  date?: Date;
}

export default function ExpenseFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const { expenseId } = useLocalSearchParams<{ expenseId?: string }>();
  const { addExpense, updateExpense } = useExpenses();
  const { addChangeRounding, aiSettings } = useAssistant();
  const [savedChange, setSavedChange] = useState<number | null>(null);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [category, setCategory] = useState<ExpenseCategory>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; amount?: string }>({});
  const [showOCR, setShowOCR] = useState(false);
  const [ocrData, setOcrData] = useState<OCRExtractedData | null>(null);
  const [showOCRReview, setShowOCRReview] = useState(false);

  const isEditing = !!expenseId;

  // Load expense data if editing
  useEffect(() => {
    if (expenseId) {
      loadExpense(expenseId);
    }
  }, [expenseId]);

  const loadExpense = async (id: string) => {
    try {
      const expense = await ExpenseStorage.getExpenseById(id);
      if (expense) {
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setCurrency(expense.currency);
        setCategory(expense.category);
      }
    } catch (error) {
      console.error('Error loading expense:', error);
    }
  };

  const validate = (): boolean => {
    const newErrors: { description?: string; amount?: string } = {};

    if (!description.trim()) {
      newErrors.description = 'Por favor, descreva o gasto';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Por favor, insira um valor válido maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);

    try {
      const input: CreateExpenseInput = {
        description: description.trim(),
        amount: parseFloat(amount),
        currency,
        category,
      };

      let createdExpenseId: string | undefined;
      
      if (isEditing && expenseId) {
        await updateExpense(expenseId, input);
      } else {
        const newExpense = await addExpense(input);
        createdExpenseId = newExpense?.id;
      }

      // Guardar o Troco - arredondar e guardar a diferença
      if (!isEditing && aiSettings.changeRoundingEnabled && createdExpenseId) {
        const saved = await addChangeRounding(input.amount, createdExpenseId);
        if (saved > 0) {
          setSavedChange(saved);
          // Pequeno delay para mostrar feedback antes de voltar
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (error) {
      console.error('Error saving expense:', error);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  // OCR Handlers
  const handleOCRCapture = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowOCR(true);
  }, []);

  const handleOCRComplete = useCallback((data: OCRExtractedData) => {
    setOcrData(data);
    setShowOCR(false);
    setShowOCRReview(true);
  }, []);

  const handleOCRConfirm = useCallback((reviewedData: OCRReviewedData) => {
    // Preencher campos com dados revisados do OCR
    if (reviewedData.description) setDescription(reviewedData.description);
    if (reviewedData.amount) setAmount(reviewedData.amount.toString());
    if (reviewedData.currency) setCurrency(reviewedData.currency);
    if (reviewedData.category) setCategory(reviewedData.category);
    
    setShowOCRReview(false);
    setOcrData(null);
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleOCRCancel = useCallback(() => {
    setShowOCR(false);
    setShowOCRReview(false);
    setOcrData(null);
  }, []);

  const currencies: Currency[] = ['BRL', 'USD', 'EUR'];
  const categories: ExpenseCategory[] = ['personal', 'collective', 'institutional'];

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-4 pb-8">
            {/* Header */}
            <View className="mb-6">
              <Text
                className="text-3xl font-bold text-foreground"
                accessibilityRole="header"
                accessibilityLabel={isEditing ? 'Editar Gasto' : 'Novo Gasto'}
              >
                {isEditing ? 'Editar Gasto' : 'Novo Gasto'}
              </Text>
              <Text className="text-sm text-muted mt-1">
                Preencha os campos abaixo para registrar seu gasto
              </Text>
            </View>

            {/* OCR Capture Button */}
            {!isEditing && (
              <Pressable
                onPress={handleOCRCapture}
                accessibilityLabel="Capturar comprovante com câmera"
                accessibilityHint="Tire uma foto do comprovante para preencher automaticamente"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  borderStyle: 'dashed',
                  minHeight: 64,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 24, marginRight: 12 }}>📷</Text>
                <View>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                    Capturar Comprovante
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                    Tire uma foto e preencha automaticamente
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Description Field */}
            <View className="mb-5">
              <Text className="text-base font-semibold text-foreground mb-2">
                Descrição do Gasto
              </Text>
              <TextInput
                value={description}
                onChangeText={text => {
                  setDescription(text);
                  if (errors.description) setErrors({ ...errors, description: undefined });
                }}
                placeholder="Ex: Compra de materiais, Transporte, etc."
                placeholderTextColor={colors.muted}
                accessibilityLabel="Campo de descrição do gasto"
                accessibilityHint="Digite uma descrição clara do gasto"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: errors.description ? 2 : 0,
                  borderColor: colors.error,
                  minHeight: 56, // Larger touch target
                }}
                maxLength={100}
              />
              {errors.description && (
                <Text className="text-error text-sm mt-1">{errors.description}</Text>
              )}
            </View>

            {/* Amount and Currency */}
            <View className="mb-5">
              <Text className="text-base font-semibold text-foreground mb-2">Valor</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Currency Selector */}
                <View style={{ width: 100 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexDirection: 'row' }}
                  >
                    {currencies.map(curr => (
                      <Pressable
                        key={curr}
                        onPress={() => {
                          setCurrency(curr);
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                        accessibilityLabel={`Moeda: ${curr}`}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                          backgroundColor: currency === curr ? colors.primary : colors.surface,
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          borderRadius: 12,
                          marginRight: 8,
                          minHeight: 56,
                          justifyContent: 'center',
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: currency === curr ? '#ffffff' : colors.foreground,
                            fontSize: 16,
                            fontWeight: '600',
                            textAlign: 'center',
                          }}
                        >
                          {CURRENCY_SYMBOLS[curr]}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Amount Input */}
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={amount}
                    onChangeText={text => {
                      // Only allow numbers and decimal point
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      setAmount(cleaned);
                      if (errors.amount) setErrors({ ...errors, amount: undefined });
                    }}
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Campo de valor do gasto"
                    accessibilityHint="Digite o valor gasto"
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      color: colors.foreground,
                      borderWidth: errors.amount ? 2 : 0,
                      borderColor: colors.error,
                      minHeight: 56,
                    }}
                  />
                </View>
              </View>
              {errors.amount && <Text className="text-error text-sm mt-1">{errors.amount}</Text>}
            </View>

            {/* Category Selection */}
            <View className="mb-6">
              <Text className="text-base font-semibold text-foreground mb-2">Categoria</Text>
              <Text className="text-sm text-muted mb-3">
                Escolha se o gasto é pessoal, coletivo ou institucional
              </Text>
              <View style={{ gap: 12 }}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                    accessibilityLabel={`Categoria: ${CATEGORY_LABELS[cat]}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: category === cat }}
                    style={({ pressed }) => ({
                      backgroundColor: category === cat ? CATEGORY_COLORS[cat] : colors.surface,
                      borderRadius: 12,
                      padding: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                      minHeight: 64,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: category === cat ? '#ffffff' : colors.border,
                        backgroundColor: category === cat ? '#ffffff' : 'transparent',
                        marginRight: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {category === cat && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: CATEGORY_COLORS[cat],
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: category === cat ? '#ffffff' : colors.foreground,
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12, marginTop: 'auto', paddingTop: 24 }}>
              <Pressable
                onPress={handleSave}
                disabled={isLoading}
                accessibilityLabel={isEditing ? 'Salvar alterações' : 'Adicionar gasto'}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: 14,
                  padding: 18,
                  alignItems: 'center',
                  minHeight: 56,
                  justifyContent: 'center',
                  opacity: pressed || isLoading ? 0.7 : 1,
                })}
              >
                <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '600' }}>
                  {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Gasto'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                disabled={isLoading}
                accessibilityLabel="Cancelar"
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 18,
                  alignItems: 'center',
                  minHeight: 56,
                  justifyContent: 'center',
                  opacity: pressed || isLoading ? 0.7 : 1,
                })}
              >
                <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600' }}>
                  Cancelar
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OCR Capture Modal */}
      {showOCR && (
        <OCRCapture
          onDataExtracted={handleOCRComplete}
          onCancel={handleOCRCancel}
        />
      )}

      {/* OCR Review Modal */}
      {showOCRReview && ocrData && (
        <OCRReview
          data={ocrData}
          onConfirm={handleOCRConfirm}
          onCancel={handleOCRCancel}
        />
      )}
    </ScreenContainer>
  );
}
