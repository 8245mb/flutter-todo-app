/**
 * Componente OCR Review
 * Permite ao usuário revisar e corrigir dados extraídos pelo OCR
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { OCRExtractedData, DocumentType } from '@/lib/types/ai-modules';
import type { Currency, ExpenseCategory } from '@/lib/types/expense';

interface OCRReviewProps {
  data: OCRExtractedData;
  onConfirm: (reviewedData: {
    description: string;
    amount: number;
    currency: Currency;
    category: ExpenseCategory;
    date?: Date;
  }) => void;
  onCancel: () => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  boleto: 'Boleto',
  nota_fiscal: 'Nota Fiscal',
  recibo: 'Recibo',
  comprovante: 'Comprovante',
  outro: 'Outro',
};

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'personal', label: 'Pessoal', emoji: '👤' },
  { value: 'collective', label: 'Coletivo', emoji: '👥' },
  { value: 'institutional', label: 'Institucional', emoji: '🏢' },
];

const CURRENCY_OPTIONS: { value: Currency; label: string; symbol: string }[] = [
  { value: 'BRL', label: 'Real', symbol: 'R$' },
  { value: 'USD', label: 'Dólar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

export function OCRReview({ data, onConfirm, onCancel }: OCRReviewProps) {
  const [description, setDescription] = useState(
    data.extractedFields.descricao || data.extractedFields.estabelecimento || ''
  );
  const [amount, setAmount] = useState(
    data.extractedFields.valor?.toString() || ''
  );
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [category, setCategory] = useState<ExpenseCategory>(
    (data.extractedFields.categoria === 'pessoal' ? 'personal' :
     data.extractedFields.categoria === 'coletivo' ? 'collective' :
     data.extractedFields.categoria === 'institucional' ? 'institutional' : 'personal')
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const confidencePercent = Math.round(data.confidence * 100);
  const isLowConfidence = data.confidence < 0.7;

  const handleConfirm = () => {
    // Validação
    if (!description.trim()) {
      setValidationError('A descrição é obrigatória');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Digite um valor válido');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onConfirm({
      description: description.trim(),
      amount: parsedAmount,
      currency,
      category,
      date: data.extractedFields.data ? new Date(data.extractedFields.data) : undefined,
    });
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="max-h-[90%]"
        >
          <View className="bg-background rounded-t-3xl">
            <ScrollView className="p-6">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-foreground">
                  Revisar Dados
                </Text>
                <TouchableOpacity
                  onPress={handleCancel}
                  className="p-2"
                  accessibilityLabel="Cancelar revisão"
                  accessibilityRole="button"
                >
                  <Text className="text-primary text-lg">Cancelar</Text>
                </TouchableOpacity>
              </View>

              {/* Indicador de Confiança */}
              <View className={`p-4 rounded-xl mb-6 ${isLowConfidence ? 'bg-warning/10' : 'bg-success/10'}`}>
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">
                    {isLowConfidence ? '⚠️' : '✅'}
                  </Text>
                  <View className="flex-1">
                    <Text className={`font-semibold ${isLowConfidence ? 'text-warning' : 'text-success'}`}>
                      {isLowConfidence ? 'Revisão Recomendada' : 'Dados Extraídos'}
                    </Text>
                    <Text className="text-muted text-sm">
                      Confiança: {confidencePercent}% • {DOCUMENT_TYPE_LABELS[data.documentType]}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Erro de Validação */}
              {validationError && (
                <View className="bg-error/10 p-4 rounded-xl mb-4">
                  <Text className="text-error text-center">{validationError}</Text>
                </View>
              )}

              {/* Campo Descrição */}
              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2 text-base">
                  Descrição *
                </Text>
                <TextInput
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    setValidationError(null);
                  }}
                  placeholder="Ex: Supermercado, Conta de luz..."
                  placeholderTextColor="#9BA1A6"
                  className="bg-surface border border-border rounded-xl p-4 text-foreground text-lg"
                  accessibilityLabel="Descrição do gasto"
                  returnKeyType="next"
                />
              </View>

              {/* Campo Valor */}
              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2 text-base">
                  Valor *
                </Text>
                <View className="flex-row">
                  <TextInput
                    value={amount}
                    onChangeText={(text) => {
                      setAmount(text);
                      setValidationError(null);
                    }}
                    placeholder="0,00"
                    placeholderTextColor="#9BA1A6"
                    keyboardType="decimal-pad"
                    className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground text-lg mr-2"
                    accessibilityLabel="Valor do gasto"
                  />
                </View>
              </View>

              {/* Seletor de Moeda */}
              <View className="mb-4">
                <Text className="text-foreground font-semibold mb-2 text-base">
                  Moeda
                </Text>
                <View className="flex-row gap-2">
                  {CURRENCY_OPTIONS.map((curr) => (
                    <TouchableOpacity
                      key={curr.value}
                      onPress={() => {
                        setCurrency(curr.value);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 items-center ${
                        currency === curr.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface border-border'
                      }`}
                      accessibilityLabel={`Selecionar ${curr.label}`}
                      accessibilityRole="button"
                    >
                      <Text className={`text-xl font-bold ${
                        currency === curr.value ? 'text-primary' : 'text-foreground'
                      }`}>
                        {curr.symbol}
                      </Text>
                      <Text className={`text-sm mt-1 ${
                        currency === curr.value ? 'text-primary' : 'text-muted'
                      }`}>
                        {curr.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Seletor de Categoria */}
              <View className="mb-6">
                <Text className="text-foreground font-semibold mb-2 text-base">
                  Categoria
                </Text>
                <View className="flex-row gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      onPress={() => {
                        setCategory(cat.value);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      className={`flex-1 p-4 rounded-xl border-2 items-center ${
                        category === cat.value
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface border-border'
                      }`}
                      accessibilityLabel={`Selecionar categoria ${cat.label}`}
                      accessibilityRole="button"
                    >
                      <Text className="text-2xl">{cat.emoji}</Text>
                      <Text className={`text-sm mt-1 ${
                        category === cat.value ? 'text-primary' : 'text-muted'
                      }`}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Dados Adicionais Extraídos */}
              {(data.extractedFields.estabelecimento || data.extractedFields.codigoBarras) && (
                <View className="bg-surface p-4 rounded-xl mb-6">
                  <Text className="text-foreground font-semibold mb-2">
                    Dados Adicionais Detectados
                  </Text>
                  {data.extractedFields.estabelecimento && (
                    <Text className="text-muted text-sm">
                      📍 {data.extractedFields.estabelecimento}
                    </Text>
                  )}
                  {data.extractedFields.codigoBarras && (
                    <Text className="text-muted text-sm mt-1">
                      📊 Código: {data.extractedFields.codigoBarras.slice(0, 20)}...
                    </Text>
                  )}
                </View>
              )}

              {/* Botão Confirmar */}
              <TouchableOpacity
                onPress={handleConfirm}
                className="bg-primary p-5 rounded-2xl mb-4"
                accessibilityLabel="Confirmar e adicionar gasto"
                accessibilityRole="button"
              >
                <Text className="text-background font-bold text-lg text-center">
                  ✓ Confirmar e Adicionar
                </Text>
              </TouchableOpacity>

              {/* Espaço extra para teclado */}
              <View className="h-6" />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
