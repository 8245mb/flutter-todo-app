import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Platform, KeyboardAvoidingView, ScrollView, Modal, TouchableOpacity } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { VoiceRecorder } from '@/components/voice-recorder';
import { AITaskAssistant } from '@/components/ai-task-assistant';
import { useColors } from '@/hooks/use-colors';
import { useTasks } from '@/lib/contexts/task-context';
import type { Task } from '@/lib/types/task';

export default function TaskFormScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const { tasks, addTask, updateTask } = useTasks();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingTask, setExistingTask] = useState<Task | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const isEditMode = !!params.taskId;

  // Load existing task if in edit mode
  useEffect(() => {
    if (params.taskId) {
      const task = tasks.find(t => t.id === params.taskId);
      if (task) {
        setExistingTask(task);
        setTitle(task.title);
        setDescription(task.description || '');
        if (task.dueDate) {
          setDueDate(new Date(task.dueDate));
        }
      }
    }
  }, [params.taskId, tasks]);

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setValidationError('O título é obrigatório');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      if (isEditMode && existingTask) {
        // Update existing task
        await updateTask(existingTask.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate?.getTime(),
        });
      } else {
        // Create new task
        await addTask({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate?.getTime(),
        });
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      router.back();
    } catch (error) {
      console.error('Error saving task:', error);
      setValidationError('Erro ao salvar tarefa');
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

  const handleVoiceInput = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowVoiceRecorder(true);
  };

  const handleAIAssistant = () => {
    if (!title.trim()) {
      setValidationError('Digite um título primeiro para usar o assistente IA');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowAIAssistant(true);
  };

  const handleTaskExtracted = (task: { title: string; description: string }) => {
    setTitle(task.title);
    setDescription(task.description);
    setShowVoiceRecorder(false);
  };

  const handleSubtasksGenerated = (subtasks: Array<{ title: string; completed: boolean }>) => {
    // Add subtasks to description
    const subtasksList = subtasks.map((st, idx) => `${idx + 1}. ${st.title}`).join('\n');
    const newDescription = description 
      ? `${description}\n\nSubtarefas:\n${subtasksList}`
      : `Subtarefas:\n${subtasksList}`;
    
    setDescription(newDescription);
    setShowAIAssistant(false);
  };

  const openDatePicker = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTempDate(dueDate || new Date());
    setShowDatePicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // No Android, o picker fecha automaticamente
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setTempDate(selectedDate);
        // Abrir o time picker após selecionar a data
        setTimeout(() => {
          setShowTimePicker(true);
        }, 100);
      }
    } else {
      // iOS - mantém aberto até confirmar
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (event.type === 'set' && selectedTime) {
        // Combinar a data selecionada com o horário
        const finalDate = new Date(tempDate);
        finalDate.setHours(selectedTime.getHours());
        finalDate.setMinutes(selectedTime.getMinutes());
        setDueDate(finalDate);
      }
    } else {
      if (selectedTime) {
        setTempDate(selectedTime);
      }
    }
  };

  const confirmIOSDateTime = () => {
    setDueDate(tempDate);
    setShowDatePicker(false);
  };

  const clearDueDate = () => {
    setDueDate(undefined);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
              {isEditMode ? 'Editar Tarefa' : 'Nova Tarefa'}
            </Text>
            
            <View style={{ width: 32 }} />
          </View>

          {/* AI Features Banner */}
          {!isEditMode && (
            <View className="px-6 mb-4">
              <View
                style={{
                  backgroundColor: colors.primary + '15',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                }}
              >
                <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600', marginBottom: 4 }}>
                  🤖 Funcionalidades IA Disponíveis
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Use voz ou peça para a IA quebrar tarefas complexas
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {validationError && (
            <View className="mx-6 mb-4 p-3 bg-error/10 rounded-lg">
              <Text className="text-error text-sm">{validationError}</Text>
            </View>
          )}

          {/* Form */}
          <View className="px-6 gap-6 flex-1">
            {/* Title Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Título <Text className="text-error">*</Text>
              </Text>
              <TextInput
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Ex: Organizar festa de aniversário"
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

            {/* Due Date Picker */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Data de Vencimento (opcional)
              </Text>
              <TouchableOpacity
                onPress={openDatePicker}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontSize: 16, color: dueDate ? colors.foreground : colors.muted }}>
                  {dueDate 
                    ? dueDate.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Selecionar data e hora'}
                </Text>
                {dueDate && (
                  <TouchableOpacity
                    onPress={clearDueDate}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                  >
                    <Text style={{ color: colors.error, fontSize: 14 }}>Limpar</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>

            {/* Description Input */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">
                Descrição (opcional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Adicione detalhes sobre a tarefa..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: colors.foreground,
                  minHeight: 100,
                }}
              />
            </View>

            {/* AI Action Buttons */}
            {!isEditMode && (
              <View className="gap-3">
                <Text className="text-sm font-medium text-foreground mb-2">
                  Ferramentas IA:
                </Text>
                
                <Pressable
                  onPress={handleVoiceInput}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ fontSize: 20 }}>🎤</Text>
                  <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '600' }}>
                    Criar Tarefa por Voz
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAIAssistant}
                  disabled={!title.trim()}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderColor: title.trim() ? colors.primary : colors.muted,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    opacity: pressed ? 0.7 : !title.trim() ? 0.5 : 1,
                  })}
                >
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                  <Text style={{ color: title.trim() ? colors.primary : colors.muted, fontSize: 15, fontWeight: '600' }}>
                    Quebrar em Subtarefas (IA)
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="px-6 pb-6 gap-3 mt-6">
            <Pressable
              onPress={handleSave}
              disabled={isLoading || !title.trim()}
              style={({ pressed }) => ({
                backgroundColor: !title.trim() ? colors.muted : colors.primary,
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
                {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Tarefa'}
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

      {/* Date Picker for Android */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker for Android */}
      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          is24Hour={true}
          onChange={handleTimeChange}
        />
      )}

      {/* Date/Time Picker Modal for iOS */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'flex-end',
            }}
          >
            <View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={{ color: colors.error, fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                  Selecionar Data e Hora
                </Text>
                <TouchableOpacity onPress={confirmIOSDateTime}>
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onChange={handleTimeChange}
                minimumDate={new Date()}
                locale="pt-BR"
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Voice Recorder Modal */}
      <Modal
        visible={showVoiceRecorder}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoiceRecorder(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <VoiceRecorder
            onTaskExtracted={handleTaskExtracted}
            onClose={() => setShowVoiceRecorder(false)}
          />
        </View>
      </Modal>

      {/* AI Assistant Modal */}
      <Modal
        visible={showAIAssistant}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAIAssistant(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <AITaskAssistant
            taskTitle={title}
            taskDescription={description}
            onSubtasksGenerated={handleSubtasksGenerated}
            onClose={() => setShowAIAssistant(false)}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
}
