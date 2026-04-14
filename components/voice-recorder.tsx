import { useState } from 'react';
import { View, Text, Pressable, Platform, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import { showToast } from '@/components/toast';
import { trpc } from '@/lib/trpc';

interface VoiceRecorderProps {
  onTaskExtracted: (task: { title: string; description: string }) => void;
  onClose: () => void;
}

export function VoiceRecorder({ onTaskExtracted, onClose }: VoiceRecorderProps) {
  const colors = useColors();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const processVoiceMutation = trpc.ai.processVoiceTask.useMutation();
  const processTextMutation = trpc.ai.processTextTask.useMutation();

  const startRecording = async () => {
    try {
      console.log('[VoiceRecorder] Starting recording...');
      
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showToast.error('Permissão Negada', 'Precisamos de permissão para acessar o microfone');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      showToast.info('Gravando...', 'Fale sua tarefa claramente');
      console.log('[VoiceRecorder] Recording started');
    } catch (error) {
      console.error('[VoiceRecorder] Error starting recording:', error);
      showToast.error('Erro', 'Não foi possível iniciar a gravação');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log('[VoiceRecorder] Stopping recording...');
      setIsProcessing(true);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      console.log('[VoiceRecorder] Recording URI:', uri);
      
      if (!uri) {
        throw new Error('No recording URI');
      }

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Read file as base64
      console.log('[VoiceRecorder] Reading file...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      console.log('[VoiceRecorder] File read, size:', base64.length);

      // Upload to server using base64
      const { getApiBaseUrl } = await import('@/constants/oauth');
      const apiUrl = getApiBaseUrl();
      
      console.log('[VoiceRecorder] Uploading to:', `${apiUrl}/api/upload`);
      
      const uploadResponse = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: base64,
          filename: 'audio.m4a',
          mimeType: 'audio/m4a',
        }),
      });

      console.log('[VoiceRecorder] Upload response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[VoiceRecorder] Upload error:', errorText);
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('[VoiceRecorder] Upload successful, URL:', uploadData.url);

      // Get transcription
      console.log('[VoiceRecorder] Getting transcription...');
      const result = await processVoiceMutation.mutateAsync({
        audioUrl: uploadData.url,
        language: 'pt',
      });

      console.log('[VoiceRecorder] Transcription result:', result);

      if (result.success && result.transcription) {
        // Show transcription for confirmation
        setTranscription(result.transcription);
        setShowConfirmation(true);
        setIsProcessing(false);
        setIsRecording(false);
        setRecording(null);
        console.log('[VoiceRecorder] Transcription:', result.transcription);
      } else {
        throw new Error('Não foi possível transcrever o áudio');
      }
    } catch (error) {
      console.error('[VoiceRecorder] Error stopping recording:', error);
      showToast.error('Erro', `Não foi possível processar o áudio: ${error}`);
      setIsProcessing(false);
      setIsRecording(false);
      setRecording(null);
    }
  };

  const confirmAndProcess = async () => {
    if (!transcription.trim()) {
      showToast.error('Erro', 'A transcrição está vazia');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('[VoiceRecorder] Processing transcription:', transcription);

      // Use tRPC to process text
      const result = await processTextMutation.mutateAsync({
        text: transcription,
      });

      console.log('[VoiceRecorder] Process result:', result);

      if (result.success && result.task) {
        onTaskExtracted(result.task);
        showToast.success('Tarefa criada!', `"${result.task.title}"`);
        onClose();
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('[VoiceRecorder] Error processing transcription:', error);
      showToast.error('Erro', 'Não foi possível criar a tarefa');
    } finally {
      setIsProcessing(false);
    }
  };

  const retryRecording = () => {
    setShowConfirmation(false);
    setTranscription('');
    startRecording();
  };

  if (showConfirmation) {
    return (
      <View className="flex-1 bg-background p-6">
        <ScrollView className="flex-1">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Confirme a Transcrição
          </Text>
          <Text className="text-sm text-muted mb-6">
            Verifique se o texto está correto. Você pode editá-lo antes de continuar.
          </Text>

          <Text className="text-sm font-semibold text-foreground mb-2">
            Você disse:
          </Text>
          
          <TextInput
            value={transcription}
            onChangeText={setTranscription}
            multiline
            numberOfLines={4}
            className="bg-surface border border-border rounded-xl p-4 text-foreground text-base mb-6"
            placeholder="Edite a transcrição se necessário..."
            placeholderTextColor={colors.muted}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <View className="gap-3">
            <Pressable
              onPress={confirmAndProcess}
              disabled={isProcessing || !transcription.trim()}
              className="bg-primary rounded-xl py-4 items-center"
              style={({ pressed }) => [
                pressed && { opacity: 0.8 },
                (!transcription.trim() || isProcessing) && { opacity: 0.5 },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-background font-semibold text-base">
                  ✓ Confirmar e Criar Tarefa
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={retryRecording}
              disabled={isProcessing}
              className="bg-surface border border-border rounded-xl py-4 items-center"
              style={({ pressed }) => [
                pressed && { opacity: 0.7 },
                isProcessing && { opacity: 0.5 },
              ]}
            >
              <Text className="text-foreground font-semibold text-base">
                🎤 Gravar Novamente
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              disabled={isProcessing}
              className="py-4 items-center"
              style={({ pressed }) => [
                pressed && { opacity: 0.7 },
                isProcessing && { opacity: 0.5 },
              ]}
            >
              <Text className="text-muted font-medium text-base">
                Cancelar
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background p-6 justify-center items-center">
      <View className="items-center gap-6 w-full max-w-sm">
        <View className="items-center gap-2">
          <Text className="text-3xl">🎤</Text>
          <Text className="text-2xl font-bold text-foreground text-center">
            Gravar Tarefa
          </Text>
          <Text className="text-sm text-muted text-center">
            Toque no microfone para começar
          </Text>
        </View>

        {isRecording && (
          <View className="items-center gap-2">
            <View className="w-16 h-16 rounded-full bg-error items-center justify-center">
              <View className="w-6 h-6 rounded-full bg-background animate-pulse" />
            </View>
            <Text className="text-sm font-medium text-error">
              Gravando...
            </Text>
          </View>
        )}

        <View className="w-full gap-3">
          {!isRecording ? (
            <Pressable
              onPress={startRecording}
              disabled={isProcessing}
              className="bg-primary rounded-full py-5 items-center shadow-lg"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
                isProcessing && { opacity: 0.5 },
              ]}
            >
              <Text className="text-background font-bold text-lg">
                Começar Gravação
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={stopRecording}
              disabled={isProcessing}
              className="bg-error rounded-full py-5 items-center shadow-lg"
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
                isProcessing && { opacity: 0.5 },
              ]}
            >
              {isProcessing ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-background font-bold text-lg">
                  Finalizar e Processar
                </Text>
              )}
            </Pressable>
          )}

          <Pressable
            onPress={onClose}
            disabled={isRecording || isProcessing}
            className="py-4 items-center"
            style={({ pressed }) => [
              pressed && { opacity: 0.7 },
              (isRecording || isProcessing) && { opacity: 0.5 },
            ]}
          >
            <Text className="text-muted font-medium text-base">
              Cancelar
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
