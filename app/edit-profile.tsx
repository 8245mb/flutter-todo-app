import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { loadProfile, updateProfile } from '@/lib/services/profile-storage';
import { showToast } from '@/components/toast';
import type { UserProfile } from '@/lib/types/user-profile';
import { useAppAuth } from '@/lib/contexts/app-auth-context';

export default function EditProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user, updateProfile: updateAuthProfile } = useAppAuth();
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadCurrentProfile = async () => {
    const profile = await loadProfile();
    // Prioriza dados do AppAuthContext se disponíveis
    setName(user?.name || profile.name);
    setBio(profile.bio || '');
    setAvatarUrl(user?.profilePhotoUrl || profile.avatarUrl || '');
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão Negada',
            'Precisamos de permissão para acessar a câmera.'
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permissão Negada',
            'Precisamos de permissão para acessar suas fotos.'
          );
          return;
        }
      }

      // Launch picker
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setAvatarUrl(result.assets[0].uri);
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast.error('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      // On web, only show library option
      pickImage('library');
      return;
    }

    Alert.alert(
      'Escolher Foto',
      'De onde você deseja escolher a foto?',
      [
        {
          text: 'Câmera',
          onPress: () => pickImage('camera'),
        },
        {
          text: 'Galeria',
          onPress: () => pickImage('library'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setValidationError('O nome é obrigatório');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      // Atualiza profile-storage local
      await updateProfile({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });

      // IMPORTANTE: Também atualiza AppAuthContext para sincronizar com aba Tarefas
      if (user) {
        await updateAuthProfile({
          name: name.trim(),
          profilePhotoUrl: avatarUrl.trim() || undefined,
        });
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      showToast.success('Perfil atualizado!', 'Suas alterações foram salvas');
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      setValidationError('Erro ao atualizar perfil');
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

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6 flex-row items-center justify-between">
            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 4,
              })}
            >
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            </Pressable>
            
            <Text className="text-xl font-bold text-foreground">
              Editar Perfil
            </Text>
            
            <View style={{ width: 32 }} />
          </View>

          {/* Error Message */}
          {validationError && (
            <View className="mx-6 mb-4 p-3 bg-error/10 rounded-lg">
              <Text className="text-error text-sm">{validationError}</Text>
            </View>
          )}

          {/* Form */}
          <View className="px-6 gap-6 flex-1">
            {/* Avatar Preview with Upload Button */}
            <View className="items-center mb-4">
              <Pressable
                onPress={showImageOptions}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <View
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 3,
                    borderColor: colors.border,
                    overflow: 'hidden',
                  }}
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={{ width: 100, height: 100 }}
                    />
                  ) : (
                    <Text style={{ fontSize: 40, color: '#ffffff', fontWeight: 'bold' }}>
                      {name.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                
                {/* Camera Icon Overlay */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📷</Text>
                </View>
              </Pressable>
              
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
                Toque para alterar foto
              </Text>
            </View>

            {/* Name Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Nome <Text className="text-error">*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Seu nome"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
                autoFocus
                style={{
                  backgroundColor: colors.surface,
                  borderColor: validationError ? colors.error : colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
            </View>

            {/* Bio Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Bio (opcional)
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Conte um pouco sobre você..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                maxLength={150}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.foreground,
                  minHeight: 80,
                }}
              />
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {bio.length}/150 caracteres
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-6 pb-6 gap-3">
            <Pressable
              onPress={handleSave}
              disabled={isLoading || !name.trim()}
              style={({ pressed }) => ({
                backgroundColor: !name.trim() ? colors.muted : colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              disabled={isLoading}
              style={({ pressed }) => ({
                backgroundColor: 'transparent',
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Cancelar
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
