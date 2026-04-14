import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useAppAuth } from '@/lib/contexts/app-auth-context';
import { showToast } from '@/components/toast';

type PlanType = 'monthly' | 'yearly';

interface PaymentForm {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

export default function PremiumScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, subscribePremium, isPremium } = useAppAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');

  const plans = {
    monthly: {
      name: 'Mensal',
      price: 'R$ 9,90',
      priceValue: 9.90,
      period: '/mês',
      savings: null,
    },
    yearly: {
      name: 'Anual',
      price: 'R$ 79,90',
      priceValue: 79.90,
      period: '/ano',
      savings: 'Economize R$ 38,90',
    },
  };

  const premiumFeatures = [
    { icon: '✨', title: 'Tarefas ilimitadas', description: 'Crie quantas tarefas quiser' },
    { icon: '🤖', title: 'Assistente IA', description: 'Acesso completo ao assistente inteligente' },
    { icon: '📊', title: 'Relatórios avançados', description: 'Estatísticas detalhadas de produtividade' },
    { icon: '🔔', title: 'Lembretes personalizados', description: 'Notificações inteligentes' },
    { icon: '☁️', title: 'Backup na nuvem', description: 'Seus dados sempre seguros' },
    { icon: '🎨', title: 'Temas exclusivos', description: 'Personalize o visual do app' },
  ];

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleSelectPlan = (plan: PlanType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlan(plan);
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const validatePaymentForm = () => {
    const cardNumberClean = paymentForm.cardNumber.replace(/\s/g, '');
    if (cardNumberClean.length !== 16) {
      showToast.error('Erro', 'Número do cartão inválido');
      return false;
    }
    if (paymentForm.cardName.length < 3) {
      showToast.error('Erro', 'Nome no cartão inválido');
      return false;
    }
    if (paymentForm.expiryDate.length !== 5) {
      showToast.error('Erro', 'Data de validade inválida');
      return false;
    }
    if (paymentForm.cvv.length < 3) {
      showToast.error('Erro', 'CVV inválido');
      return false;
    }
    return true;
  };

  const handleStartPayment = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowPaymentModal(true);
    setPaymentStep('form');
  };

  const handleProcessPayment = async () => {
    if (!validatePaymentForm()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setPaymentStep('processing');

    // Simular processamento de pagamento (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const result = await subscribePremium(selectedPlan);
      
      if (result.success) {
        setPaymentStep('success');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Fechar modal após 2 segundos e voltar
        setTimeout(() => {
          setShowPaymentModal(false);
          showToast.success('Parabéns!', 'Seu plano Premium foi ativado com sucesso!');
          router.back();
        }, 2000);
      } else {
        setPaymentStep('form');
        showToast.error('Erro', result.error || 'Erro ao processar pagamento');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      setPaymentStep('form');
      showToast.error('Erro', 'Erro ao processar pagamento');
    }
  };

  const handleCloseModal = () => {
    if (paymentStep !== 'processing') {
      setShowPaymentModal(false);
      setPaymentForm({ cardNumber: '', cardName: '', expiryDate: '', cvv: '' });
      setPaymentStep('form');
    }
  };

  // Se já é premium, mostrar tela de status
  if (isPremium) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6 flex-row items-center">
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 4,
                marginRight: 12,
              })}
            >
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </Pressable>
            
            <Text className="text-3xl font-bold text-foreground">
              Premium
            </Text>
          </View>

          {/* Status Premium */}
          <View className="px-6">
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👑</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
                Você é Premium!
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
                Aproveite todos os recursos exclusivos do app
              </Text>
              
              {user?.premiumExpiresAt && (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginTop: 16,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 13 }}>
                    Válido até: {new Date(user.premiumExpiresAt).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              )}
            </View>

            {/* Features */}
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>
                Seus benefícios
              </Text>
              
              {premiumFeatures.map((feature, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{feature.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                      {feature.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                      {feature.description}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, color: colors.success }}>✓</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6 flex-row items-center">
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              padding: 4,
              marginRight: 12,
            })}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
          </Pressable>
          
          <Text className="text-3xl font-bold text-foreground">
            Premium
          </Text>
        </View>

        {/* Hero */}
        <View className="px-6 mb-8">
          <View
            style={{
              backgroundColor: colors.primary,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>👑</Text>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 8 }}>
              Seja Premium
            </Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
              Desbloqueie todos os recursos e aumente sua produtividade
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="px-6 mb-8">
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>
            O que você ganha
          </Text>
          
          {premiumFeatures.map((feature, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>{feature.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                  {feature.title}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View className="px-6 mb-8">
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>
            Escolha seu plano
          </Text>
          
          {/* Monthly Plan */}
          <Pressable
            onPress={() => handleSelectPlan('monthly')}
            style={({ pressed }) => ({
              backgroundColor: selectedPlan === 'monthly' ? colors.primary : colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: selectedPlan === 'monthly' ? colors.primary : colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: selectedPlan === 'monthly' ? '#ffffff' : colors.foreground,
                  }}
                >
                  {plans.monthly.name}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.8)' : colors.muted,
                    marginTop: 4,
                  }}
                >
                  Cobrança mensal
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: selectedPlan === 'monthly' ? '#ffffff' : colors.foreground,
                  }}
                >
                  {plans.monthly.price}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: selectedPlan === 'monthly' ? 'rgba(255,255,255,0.8)' : colors.muted,
                  }}
                >
                  {plans.monthly.period}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Yearly Plan */}
          <Pressable
            onPress={() => handleSelectPlan('yearly')}
            style={({ pressed }) => ({
              backgroundColor: selectedPlan === 'yearly' ? colors.primary : colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 2,
              borderColor: selectedPlan === 'yearly' ? colors.primary : colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: 'bold',
                      color: selectedPlan === 'yearly' ? '#ffffff' : colors.foreground,
                    }}
                  >
                    {plans.yearly.name}
                  </Text>
                  <View
                    style={{
                      backgroundColor: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.2)' : colors.success,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#ffffff' }}>
                      MELHOR VALOR
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : colors.muted,
                    marginTop: 4,
                  }}
                >
                  {plans.yearly.savings}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: selectedPlan === 'yearly' ? '#ffffff' : colors.foreground,
                  }}
                >
                  {plans.yearly.price}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: selectedPlan === 'yearly' ? 'rgba(255,255,255,0.8)' : colors.muted,
                  }}
                >
                  {plans.yearly.period}
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleStartPayment}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            opacity: pressed || loading ? 0.8 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
              Assinar por {plans[selectedPlan].price}
            </Text>
          )}
        </Pressable>
        <Text
          style={{
            textAlign: 'center',
            color: colors.muted,
            fontSize: 12,
            marginTop: 8,
          }}
        >
          Cancele quando quiser. Sem compromisso.
        </Text>
      </View>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flex: 1, padding: 24 }}>
              {/* Modal Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                  Pagamento
                </Text>
                {paymentStep === 'form' && (
                  <Pressable
                    onPress={handleCloseModal}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.6 : 1,
                      padding: 8,
                    })}
                  >
                    <Text style={{ fontSize: 16, color: colors.primary }}>Cancelar</Text>
                  </Pressable>
                )}
              </View>

              {paymentStep === 'form' && (
                <>
                  {/* Plan Summary */}
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 24,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16, color: colors.foreground }}>
                        Plano {plans[selectedPlan].name}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
                        {plans[selectedPlan].price}
                      </Text>
                    </View>
                  </View>

                  {/* Card Form */}
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                        Número do Cartão
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          fontSize: 16,
                          color: colors.foreground,
                        }}
                        placeholder="0000 0000 0000 0000"
                        placeholderTextColor={colors.muted}
                        value={paymentForm.cardNumber}
                        onChangeText={(text) => setPaymentForm({ ...paymentForm, cardNumber: formatCardNumber(text) })}
                        keyboardType="numeric"
                        maxLength={19}
                        returnKeyType="next"
                      />
                    </View>

                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                        Nome no Cartão
                      </Text>
                      <TextInput
                        style={{
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          fontSize: 16,
                          color: colors.foreground,
                        }}
                        placeholder="NOME COMO NO CARTÃO"
                        placeholderTextColor={colors.muted}
                        value={paymentForm.cardName}
                        onChangeText={(text) => setPaymentForm({ ...paymentForm, cardName: text.toUpperCase() })}
                        autoCapitalize="characters"
                        returnKeyType="next"
                      />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                          Validade
                        </Text>
                        <TextInput
                          style={{
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                          placeholder="MM/AA"
                          placeholderTextColor={colors.muted}
                          value={paymentForm.expiryDate}
                          onChangeText={(text) => setPaymentForm({ ...paymentForm, expiryDate: formatExpiryDate(text) })}
                          keyboardType="numeric"
                          maxLength={5}
                          returnKeyType="next"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
                          CVV
                        </Text>
                        <TextInput
                          style={{
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 12,
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            fontSize: 16,
                            color: colors.foreground,
                          }}
                          placeholder="123"
                          placeholderTextColor={colors.muted}
                          value={paymentForm.cvv}
                          onChangeText={(text) => setPaymentForm({ ...paymentForm, cvv: text.replace(/\D/g, '') })}
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          returnKeyType="done"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Security Note */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 24,
                      padding: 12,
                      backgroundColor: colors.surface,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 8 }}>🔒</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, flex: 1 }}>
                      Seus dados de pagamento são protegidos com criptografia de ponta a ponta
                    </Text>
                  </View>

                  {/* Pay Button */}
                  <Pressable
                    onPress={handleProcessPayment}
                    style={({ pressed }) => ({
                      backgroundColor: colors.primary,
                      borderRadius: 16,
                      paddingVertical: 16,
                      alignItems: 'center',
                      marginTop: 24,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                      Pagar {plans[selectedPlan].price}
                    </Text>
                  </Pressable>
                </>
              )}

              {paymentStep === 'processing' && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginTop: 24 }}>
                    Processando pagamento...
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
                    Aguarde um momento
                  </Text>
                </View>
              )}

              {paymentStep === 'success' && (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: colors.success,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 24,
                    }}
                  >
                    <Text style={{ fontSize: 48, color: '#ffffff' }}>✓</Text>
                  </View>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 }}>
                    Pagamento aprovado!
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                    Seu plano Premium foi ativado com sucesso
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
