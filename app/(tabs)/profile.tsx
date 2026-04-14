import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, Pressable, Image, Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { StatCard, StatDetail } from '@/components/stat-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useTasks } from '@/lib/contexts/task-context';
import { loadProfile, updateProfile as updateLocalProfile } from '@/lib/services/profile-storage';
import type { UserProfile } from '@/lib/types/user-profile';
import { useAppAuth } from '@/lib/contexts/app-auth-context';

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { tasks } = useTasks();
  const { user, updateProfile: updateAuthProfile, logout } = useAppAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    const userProfile = await loadProfile();
    setProfile(userProfile);
  };

  const handleEditProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/edit-profile' as any);
  };

  const handleSettings = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/settings' as any);
  };

  const handleLogout = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair da sua conta?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Format date for display
  const formatDate = (date: Date | string | number | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Prepare details for each stat card
  const allTasksDetails: StatDetail[] = useMemo(() => 
    tasks.map(task => ({
      id: task.id,
      title: task.title,
      subtitle: task.description || undefined,
      status: task.completed ? 'completed' : (task.dueDate && new Date(task.dueDate) < new Date() ? 'overdue' : 'active'),
      date: task.dueDate ? `Vence: ${formatDate(task.dueDate)}` : `Criada: ${formatDate(task.createdAt)}`,
    })),
    [tasks]
  );

  const completedTasksDetails: StatDetail[] = useMemo(() => 
    tasks.filter(t => t.completed).map(task => ({
      id: task.id,
      title: task.title,
      subtitle: task.description || undefined,
      status: 'completed' as const,
      date: task.updatedAt ? `Concluída: ${formatDate(task.updatedAt)}` : undefined,
    })),
    [tasks]
  );

  const activeTasksDetails: StatDetail[] = useMemo(() => 
    tasks.filter(t => !t.completed).map(task => ({
      id: task.id,
      title: task.title,
      subtitle: task.description || undefined,
      status: task.dueDate && new Date(task.dueDate) < new Date() ? 'overdue' : 'active',
      date: task.dueDate ? `Vence: ${formatDate(task.dueDate)}` : undefined,
    })),
    [tasks]
  );

  const goalsAchievedDetails: StatDetail[] = useMemo(() => 
    tasks.filter(t => t.completed).map(task => ({
      id: task.id,
      title: task.title,
      subtitle: 'Meta alcançada! 🎉',
      status: 'completed' as const,
      date: task.updatedAt ? `Concluída: ${formatDate(task.updatedAt)}` : undefined,
    })),
    [tasks]
  );

  if (!profile) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">Carregando perfil...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-3xl font-bold text-foreground">Perfil</Text>
            <Pressable
              onPress={handleSettings}
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                padding: 8,
              })}
            >
              <IconSymbol name="chevron.right" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Profile Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Avatar - usa foto do AppAuthContext para sincronizar com aba Tarefas */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 3,
                borderColor: colors.background,
                overflow: 'hidden',
              }}
            >
              {(user?.profilePhotoUrl || profile.avatarUrl) ? (
                <Image
                  source={{ uri: user?.profilePhotoUrl || profile.avatarUrl }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                />
              ) : (
                <Text style={{ fontSize: 40, color: '#ffffff', fontWeight: 'bold' }}>
                  {(user?.name || profile.name).charAt(0).toUpperCase()}
                </Text>
              )}
            </View>

            {/* Name */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.foreground,
                marginBottom: 8,
              }}
            >
              {profile.name}
            </Text>

            {/* Bio */}
            {profile.bio && (
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  textAlign: 'center',
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                {profile.bio}
              </Text>
            )}

            {/* Edit Button */}
            <Pressable
              onPress={handleEditProfile}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 32,
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: '600',
                }}
              >
                Editar Perfil
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Statistics Section */}
        <View className="px-6 mb-6">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Estatísticas
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: colors.muted,
              marginBottom: 16,
              marginTop: -8,
            }}
          >
            Toque em cada card para ver detalhes
          </Text>

          {/* Stats Grid */}
          <View style={{ gap: 12 }}>
            {/* Row 1 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard
                label="Total de Tarefas"
                value={totalTasks}
                icon="📋"
                color={colors.primary}
                details={allTasksDetails}
                detailTitle="Todas as Tarefas"
              />
              <StatCard
                label="Concluídas"
                value={completedTasks}
                icon="✅"
                color={colors.success}
                details={completedTasksDetails}
                detailTitle="Tarefas Concluídas"
              />
            </View>

            {/* Row 2 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard
                label="Ativas"
                value={activeTasks}
                icon="⏳"
                color={colors.warning}
                details={activeTasksDetails}
                detailTitle="Tarefas Ativas"
              />
              <StatCard
                label="Taxa de Conclusão"
                value={`${completionRate}%`}
                icon="📊"
                color={colors.primary}
                details={[
                  { id: 'rate', title: `${completionRate}% de conclusão`, subtitle: `${completedTasks} de ${totalTasks} tarefas concluídas` },
                  { id: 'pending', title: `${activeTasks} tarefas pendentes`, subtitle: 'Aguardando conclusão', status: 'active' as const },
                ]}
                detailTitle="Taxa de Conclusão"
              />
            </View>

            {/* Row 3 */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <StatCard
                label="Projetos Ativos"
                value={0}
                icon="📁"
                color={colors.primary}
                details={[]}
                detailTitle="Projetos Ativos"
              />
              <StatCard
                label="Metas Alcançadas"
                value={completedTasks}
                icon="🎯"
                color={colors.success}
                details={goalsAchievedDetails}
                detailTitle="Metas Alcançadas"
              />
            </View>
          </View>
        </View>

        {/* Progress Section */}
        <View className="px-6">
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: colors.foreground,
              marginBottom: 16,
            }}
          >
            Progresso
          </Text>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>
                Produtividade Geral
              </Text>
              <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.primary }}>
                {completionRate}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View
              style={{
                height: 8,
                backgroundColor: colors.border,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${completionRate}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 13,
                color: colors.muted,
                marginTop: 12,
                lineHeight: 18,
              }}
            >
              {completedTasks > 0
                ? `Parabéns! Você já concluiu ${completedTasks} ${completedTasks === 1 ? 'tarefa' : 'tarefas'}. Continue assim! 🎉`
                : 'Comece a adicionar tarefas para acompanhar seu progresso! 💪'}
            </Text>
          </View>
        </View>

        {/* Premium Button */}
        <View className="px-6 mt-6">
          <Pressable
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              router.push('/premium' as any);
            }}
            style={({ pressed }) => ({
              backgroundColor: user?.isPremium ? colors.surface : colors.primary,
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
              borderWidth: user?.isPremium ? 1 : 0,
              borderColor: colors.border,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 20 }}>👑</Text>
              <Text
                style={{
                  color: user?.isPremium ? colors.foreground : '#ffffff',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {user?.isPremium ? 'Você é Premium!' : 'Seja Premium'}
              </Text>
            </View>
            {!user?.isPremium && (
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>
                Desbloqueie todos os recursos
              </Text>
            )}
          </Pressable>
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-4 mb-8">
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              backgroundColor: 'transparent',
              borderColor: colors.error,
              borderWidth: 1,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 24,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text
              style={{
                color: colors.error,
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              🚪 Sair da Conta
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
