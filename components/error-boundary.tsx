import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the app
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const colors = useColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: colors.error,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Ops! Algo deu errado
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
            marginBottom: 16,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          Encontramos um erro inesperado. Por favor, tente novamente.
        </Text>

        {error && __DEV__ && (
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.error,
                fontFamily: 'monospace',
              }}
            >
              {error.message}
            </Text>
          </View>
        )}

        <Pressable
          onPress={onReset}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text
            style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Tentar Novamente
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Error Boundary Hook Wrapper
 * Allows using Error Boundary with hooks
 */
export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
