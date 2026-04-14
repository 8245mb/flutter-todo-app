/**
 * Componente OCR Capture
 * Permite capturar foto, selecionar imagem ou importar PDF/documentos para extração de dados
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { trpc } from '@/lib/trpc';
import type { OCRExtractedData } from '@/lib/types/ai-modules';

interface OCRCaptureProps {
  onDataExtracted: (data: OCRExtractedData) => void;
  onCancel: () => void;
}

export function OCRCapture({ onDataExtracted, onCancel }: OCRCaptureProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('Analisando comprovante com IA...');
  const [error, setError] = useState<string | null>(null);

  const extractMutation = trpc.ai.extractExpenseData.useMutation({
    onSuccess: (data) => {
      setIsProcessing(false);
      onDataExtracted(data as OCRExtractedData);
    },
    onError: (err) => {
      setIsProcessing(false);
      setError(err.message || 'Erro ao extrair dados');
    },
  });

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      let result;

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para capturar o comprovante.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permissão necessária', 'Precisamos de acesso às fotos para selecionar o comprovante.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        setProcessingMessage('Analisando imagem com IA...');
        setError(null);

        // Enviar base64 para processamento OCR (URI local não funciona no servidor)
        const asset = result.assets[0];
        if (asset.base64) {
          extractMutation.mutate({
            imageUri: `data:image/jpeg;base64,${asset.base64}`,
          });
        } else {
          // Fallback para URI se base64 não estiver disponível
          extractMutation.mutate({
            imageUri: asset.uri,
          });
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Erro ao selecionar imagem');
    }
  };

  const pickDocument = async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'image/*',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setIsProcessing(true);
        setError(null);

        const asset = result.assets[0];
        const fileExtension = asset.name?.split('.').pop()?.toLowerCase() || '';
        
        // Determinar tipo de arquivo e mensagem apropriada
        if (fileExtension === 'pdf') {
          setProcessingMessage('Processando PDF com IA...');
        } else if (['doc', 'docx'].includes(fileExtension)) {
          setProcessingMessage('Processando documento com IA...');
        } else {
          setProcessingMessage('Analisando arquivo com IA...');
        }

        try {
          // Ler arquivo como base64
          const base64Content = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64',
          });

          // Determinar MIME type
          let mimeType = asset.mimeType || 'application/octet-stream';
          if (fileExtension === 'pdf') {
            mimeType = 'application/pdf';
          } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
            mimeType = 'image/jpeg';
          } else if (fileExtension === 'png') {
            mimeType = 'image/png';
          }

          // Enviar para processamento
          extractMutation.mutate({
            imageUri: `data:${mimeType};base64,${base64Content}`,
            documentType: 'comprovante',
          });
        } catch (readError) {
          console.error('Error reading file:', readError);
          setIsProcessing(false);
          setError('Erro ao ler o arquivo. Tente novamente.');
        }
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setIsProcessing(false);
      setError('Erro ao selecionar documento');
    }
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-foreground">
              Importar Comprovante
            </Text>
            <TouchableOpacity
              onPress={onCancel}
              className="p-2"
              accessibilityLabel="Fechar"
              accessibilityRole="button"
            >
              <Text className="text-primary text-lg">Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Descrição */}
          <Text className="text-muted text-base mb-6 leading-relaxed">
            Tire uma foto, selecione uma imagem ou importe um documento (PDF, Word).
            A IA vai extrair automaticamente os dados para você revisar.
          </Text>

          {/* Erro */}
          {error && (
            <View className="bg-error/10 p-4 rounded-xl mb-4">
              <Text className="text-error text-center">{error}</Text>
            </View>
          )}

          {/* Loading */}
          {isProcessing ? (
            <View className="items-center py-8">
              <ActivityIndicator size="large" color="#0a7ea4" />
              <Text className="text-muted mt-4 text-center">
                {processingMessage}
              </Text>
              <Text className="text-muted text-sm mt-2 text-center">
                Isso pode levar alguns segundos
              </Text>
            </View>
          ) : (
            <>
              {/* Botão Câmera */}
              <TouchableOpacity
                onPress={() => pickImage('camera')}
                className="bg-primary p-5 rounded-2xl mb-3 flex-row items-center justify-center"
                accessibilityLabel="Tirar foto do comprovante"
                accessibilityRole="button"
              >
                <Text className="text-2xl mr-3">📷</Text>
                <Text className="text-background font-bold text-lg">
                  Tirar Foto
                </Text>
              </TouchableOpacity>

              {/* Botão Galeria */}
              <TouchableOpacity
                onPress={() => pickImage('library')}
                className="bg-surface border-2 border-border p-5 rounded-2xl mb-3 flex-row items-center justify-center"
                accessibilityLabel="Selecionar imagem da galeria"
                accessibilityRole="button"
              >
                <Text className="text-2xl mr-3">🖼️</Text>
                <Text className="text-foreground font-bold text-lg">
                  Escolher da Galeria
                </Text>
              </TouchableOpacity>

              {/* Botão Importar Documento */}
              <TouchableOpacity
                onPress={pickDocument}
                className="bg-surface border-2 border-primary p-5 rounded-2xl mb-6 flex-row items-center justify-center"
                accessibilityLabel="Importar documento PDF ou Word"
                accessibilityRole="button"
              >
                <Text className="text-2xl mr-3">📄</Text>
                <Text className="text-primary font-bold text-lg">
                  Importar PDF / Documento
                </Text>
              </TouchableOpacity>

              {/* Formatos suportados */}
              <View className="bg-surface/50 p-3 rounded-xl mb-4">
                <Text className="text-muted text-xs text-center">
                  Formatos suportados: PDF, JPG, PNG, DOC, DOCX
                </Text>
              </View>

              {/* Dica */}
              <View className="bg-surface p-4 rounded-xl">
                <Text className="text-muted text-sm text-center leading-relaxed">
                  💡 Dica: Para melhores resultados, certifique-se que o
                  comprovante está bem iluminado e legível.
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
