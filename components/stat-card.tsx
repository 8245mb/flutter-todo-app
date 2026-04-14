import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, Pressable, SafeAreaView } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
  details?: StatDetail[];
  detailTitle?: string;
}

export interface StatDetail {
  id: string;
  title: string;
  subtitle?: string;
  status?: 'completed' | 'active' | 'overdue';
  date?: string;
}

/**
 * Stat Card Component
 * Displays a statistic with label and value
 * Clickable to show details modal
 */
export function StatCard({ label, value, icon, color, details, detailTitle }: StatCardProps) {
  const colors = useColors();
  const [showDetails, setShowDetails] = useState(false);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Always open modal, even if no details (to show empty state)
    if (details !== undefined) {
      setShowDetails(true);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'overdue':
        return colors.error;
      case 'active':
      default:
        return colors.warning;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'overdue':
        return 'Atrasada';
      case 'active':
      default:
        return 'Ativa';
    }
  };

  const hasDetails = details !== undefined;

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 20,
          flex: 1,
          minWidth: 100,
          borderWidth: 1,
          borderColor: hasDetails ? (pressed ? colors.primary : colors.border) : colors.border,
          opacity: pressed && hasDetails ? 0.8 : 1,
          transform: [{ scale: pressed && hasDetails ? 0.98 : 1 }],
        })}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {icon && (
            <Text style={{ fontSize: 28, marginBottom: 8 }}>{icon}</Text>
          )}
          {hasDetails && (
            <View style={{ 
              backgroundColor: colors.primary + '20', 
              borderRadius: 8, 
              paddingHorizontal: 6, 
              paddingVertical: 2 
            }}>
              <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '600' }}>
                Toque
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: color || colors.primary,
            marginBottom: 4,
          }}
        >
          {value}
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: colors.muted,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
      </Pressable>

      {/* Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowDetails(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                {detailTitle || label}
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                {details?.length || 0} {details?.length === 1 ? 'item' : 'itens'}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowDetails(false);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primary : colors.surface,
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <Text style={{ fontSize: 18, color: colors.foreground }}>✕</Text>
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            {details && details.length > 0 ? (
              details.map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '600', 
                        color: colors.foreground,
                        marginBottom: 4,
                      }}>
                        {item.title}
                      </Text>
                      {item.subtitle && (
                        <Text style={{ fontSize: 14, color: colors.muted }}>
                          {item.subtitle}
                        </Text>
                      )}
                      {item.date && (
                        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                          {item.date}
                        </Text>
                      )}
                    </View>
                    {item.status && (
                      <View style={{
                        backgroundColor: getStatusColor(item.status) + '20',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}>
                        <Text style={{ 
                          fontSize: 12, 
                          fontWeight: '600',
                          color: getStatusColor(item.status),
                        }}>
                          {getStatusLabel(item.status)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
                <Text style={{ fontSize: 16, color: colors.muted, textAlign: 'center' }}>
                  Nenhum item para mostrar
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Close Button at Bottom */}
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowDetails(false);
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.primary + 'CC' : colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              })}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>
                Fechar
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
