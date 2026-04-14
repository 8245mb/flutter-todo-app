import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useAppAuth } from '@/lib/contexts/app-auth-context';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login, isLoading } = useAppAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const result = await login(email, password);
      
      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace('/(tabs)');
      } else {
        setError(result.error || 'Erro ao fazer login');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (inputIndex: number) => {
    if (Platform.OS === 'android') {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: inputIndex * 80, animated: true });
      }, 150);
    }
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center',
            paddingBottom: Platform.OS === 'android' ? 150 : 0,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6">
            <View className="items-center mb-10">
              <Image
                source={require('@/assets/images/icon.png')}
                style={{ width: 100, height: 100, borderRadius: 20, marginBottom: 16 }}
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-foreground">Minhas Tarefas</Text>
              <Text className="text-base text-muted mt-2">Entre na sua conta</Text>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
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
                  placeholder="seu@email.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  onFocus={() => handleInputFocus(0)}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Senha</Text>
                <TextInput
                  ref={passwordRef}
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
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => handleInputFocus(1)}
                />
              </View>

              {error ? (
                <Text className="text-error text-center">{error}</Text>
              ) : null}

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 18 }}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-8">
              <Text className="text-muted">Não tem uma conta? </Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text className="text-primary font-semibold">Cadastre-se</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
