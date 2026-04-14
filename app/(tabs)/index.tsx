import { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, Platform, Alert, TouchableOpacity, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '@/components/screen-container';
import { TaskItem } from '@/components/task-item';
import { EmptyState } from '@/components/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useTasks } from '@/lib/contexts/task-context';
import type { Task } from '@/lib/types/task';
import { useRouter } from 'expo-router';
import { useAppAuth } from '@/lib/contexts/app-auth-context';
import { useDoubleBackExit } from '@/hooks/use-double-back-exit';

type FilterType = 'all' | 'today' | 'overdue' | 'upcoming' | 'no-date';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  useDoubleBackExit();
  const { tasks, isLoading, error, loadTasks, toggleTask, deleteTask, clearError } = useTasks();
  const { user } = useAppAuth();
  const [filter, setFilter] = useState<FilterType>('all');

  // Load tasks on mount and when screen comes into focus
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  // Clear error when component unmounts
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleToggleTask = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await toggleTask(id);
  };

  const handleEditTask = (task: Task) => {
    router.push({
      pathname: '/task-form' as any,
      params: { taskId: task.id },
    });
  };

  const handleDeleteTask = (id: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Tem certeza que deseja deletar esta tarefa?')) {
        performDelete(id);
      }
    } else {
      Alert.alert(
        'Deletar Tarefa',
        'Tem certeza que deseja deletar esta tarefa?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Deletar',
            style: 'destructive',
            onPress: () => performDelete(id),
          },
        ]
      );
    }
  };

  const performDelete = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await deleteTask(id);
  };

  const handleAddTask = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/task-form' as any);
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    let filtered = tasks;

    switch (filter) {
      case 'today':
        filtered = tasks.filter(t => {
          if (!t.dueDate) return false;
          return t.dueDate >= todayStart && t.dueDate < todayEnd;
        });
        break;
      case 'overdue':
        filtered = tasks.filter(t => {
          if (!t.dueDate || t.completed) return false;
          return t.dueDate < now.getTime();
        });
        break;
      case 'upcoming':
        filtered = tasks.filter(t => {
          if (!t.dueDate) return false;
          return t.dueDate >= todayEnd;
        });
        break;
      case 'no-date':
        filtered = tasks.filter(t => !t.dueDate);
        break;
      default:
        filtered = tasks;
    }

    // Sort by due date (tasks with due date first, then by date)
    return filtered.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate - b.dueDate;
    });
  }, [tasks, filter]);

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    return t.dueDate < new Date().getTime();
  }).length;

  return (
    <ScreenContainer className="relative">
      {/* Header */}
      <View className="px-6 pt-4 pb-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-3xl font-bold text-foreground">Minhas Tarefas</Text>
          </View>
          {/* Foto de Perfil */}
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile' as any)}
            className="ml-3"
            style={{ opacity: 1 }}
            activeOpacity={0.7}
          >
            {user?.profilePhotoUrl ? (
              <Image
                source={{ uri: user.profilePhotoUrl }}
                className="w-11 h-11 rounded-full"
                style={{ backgroundColor: colors.surface }}
              />
            ) : (
              <View 
                className="w-11 h-11 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white text-lg font-bold">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {totalCount > 0 && (
          <Text className="text-sm text-muted mt-1">
            {completedCount} de {totalCount} concluídas
            {overdueCount > 0 && (
              <Text className="text-error"> • {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}</Text>
            )}
          </Text>
        )}
        {error && (
          <View className="mt-2 p-3 bg-error/10 rounded-lg">
            <Text className="text-error text-sm">{error}</Text>
          </View>
        )}
      </View>

      {/* Filters */}
      {totalCount > 0 && (
        <View className="px-6 pb-3">
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setFilter('all')}
              style={({ pressed }) => ([
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: filter === 'all' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                }
              ])}
            >
              <Text style={{ color: filter === 'all' ? '#ffffff' : colors.foreground, fontSize: 13 }}>
                Todas
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('today')}
              style={({ pressed }) => ([
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: filter === 'today' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                }
              ])}
            >
              <Text style={{ color: filter === 'today' ? '#ffffff' : colors.foreground, fontSize: 13 }}>
                Hoje
              </Text>
            </Pressable>
            {overdueCount > 0 && (
              <Pressable
                onPress={() => setFilter('overdue')}
                style={({ pressed }) => ([
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: filter === 'overdue' ? colors.error : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  }
                ])}
              >
                <Text style={{ color: filter === 'overdue' ? '#ffffff' : colors.foreground, fontSize: 13 }}>
                  Atrasadas ({overdueCount})
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setFilter('upcoming')}
              style={({ pressed }) => ([
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: filter === 'upcoming' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                }
              ])}
            >
              <Text style={{ color: filter === 'upcoming' ? '#ffffff' : colors.foreground, fontSize: 13 }}>
                Próximas
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilter('no-date')}
              style={({ pressed }) => ([
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: filter === 'no-date' ? colors.primary : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                }
              ])}
            >
              <Text style={{ color: filter === 'no-date' ? '#ffffff' : colors.foreground, fontSize: 13 }}>
                Sem data
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Task List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Carregando...</Text>
        </View>
      ) : filteredTasks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-muted text-center">
            {filter === 'all' ? 'Nenhuma tarefa ainda' : `Nenhuma tarefa ${filter === 'today' ? 'para hoje' : filter === 'overdue' ? 'atrasada' : filter === 'upcoming' ? 'próxima' : 'sem data'}`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={handleToggleTask}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          )}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 100,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
        }}
      >
        <Pressable
          onPress={handleAddTask}
          style={({ pressed }) => ({
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '300' }}>+</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
