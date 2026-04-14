import { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import { showToast } from '@/components/toast';
import { trpc } from '@/lib/trpc';

interface AITaskAssistantProps {
  taskTitle: string;
  taskDescription?: string;
  onSubtasksGenerated: (subtasks: Array<{ title: string; completed: boolean }>) => void;
  onClose: () => void;
}

export function AITaskAssistant({ 
  taskTitle, 
  taskDescription, 
  onSubtasksGenerated, 
  onClose 
}: AITaskAssistantProps) {
  const colors = useColors();
  const [isProcessing, setIsProcessing] = useState(false);
  const [subtasks, setSubtasks] = useState<Array<{ title: string; completed: boolean }>>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const breakDownMutation = trpc.ai.breakDownTask.useMutation();

  const generateSubtasks = async () => {
    if (!taskTitle.trim()) {
      showToast.error('Erro', 'O título da tarefa é obrigatório');
      return;
    }

    setIsProcessing(true);

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      showToast.info('Processando...', 'A IA está analisando sua tarefa');

      const result = await breakDownMutation.mutateAsync({
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription?.trim(),
      });

      if (result.success && result.subtasks && result.subtasks.length > 0) {
        setSubtasks(result.subtasks);
        setHasGenerated(true);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        showToast.success('Subtarefas geradas!', `${result.subtasks.length} subtarefas criadas`);
      } else {
        throw new Error('Nenhuma subtarefa foi gerada');
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      showToast.error('Erro', 'Não foi possível gerar subtarefas');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (subtasks.length > 0) {
      onSubtasksGenerated(subtasks);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      onClose();
    }
  };

  const handleCancel = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        borderTopWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        maxHeight: '80%',
      }}
    >
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 32, marginBottom: 8 }}>🤖</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground, marginBottom: 8 }}>
          Assistente de Tarefas IA
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
          {hasGenerated 
            ? 'Revise as subtarefas geradas pela IA' 
            : 'A IA vai quebrar sua tarefa em etapas menores'}
        </Text>
      </View>

      {/* Task Preview */}
      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 16,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
          Tarefa Original:
        </Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
          {taskTitle}
        </Text>
        {taskDescription && (
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 8 }}>
            {taskDescription}
          </Text>
        )}
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>
            Analisando com IA...
          </Text>
        </View>
      )}

      {/* Subtasks List */}
      {hasGenerated && subtasks.length > 0 && (
        <ScrollView
          style={{ maxHeight: 300, marginBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 12 }}>
            Subtarefas Geradas ({subtasks.length}):
          </Text>
          {subtasks.map((subtask, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.background,
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 16, color: colors.muted, marginRight: 8 }}>
                {index + 1}.
              </Text>
              <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>
                {subtask.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Action Buttons */}
      <View style={{ gap: 12 }}>
        {!hasGenerated && !isProcessing && (
          <Pressable
            onPress={generateSubtasks}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
              🤖 Gerar Subtarefas com IA
            </Text>
          </Pressable>
        )}

        {hasGenerated && !isProcessing && (
          <>
            <Pressable
              onPress={handleConfirm}
              style={({ pressed }) => ({
                backgroundColor: colors.success,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                ✓ Usar Estas Subtarefas
              </Text>
            </Pressable>

            <Pressable
              onPress={generateSubtasks}
              style={({ pressed }) => ({
                backgroundColor: 'transparent',
                borderColor: colors.primary,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
                🔄 Gerar Novamente
              </Text>
            </Pressable>
          </>
        )}

        {!isProcessing && (
          <Pressable
            onPress={handleCancel}
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
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
              Cancelar
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
