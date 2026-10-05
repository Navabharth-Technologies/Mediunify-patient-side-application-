import React from 'react';
import { LogBox, View, Text, ScrollView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['[DataSync]']);

import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/ThemeContext';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('GLOBAL_ERROR_CAUGHT:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 24, justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <View style={{ maxWidth: 800, width: '100%', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#DC2626', marginBottom: 12 }}>
              Application Render Error
            </Text>
            <Text style={{ fontSize: 14, color: '#991B1B', marginBottom: 12, fontFamily: 'monospace' }}>
              {this.state.error?.toString()}
            </Text>
            <ScrollView style={{ maxHeight: 300, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
                {this.state.error?.stack}
              </Text>
              <Text style={{ fontSize: 12, color: '#0369A1', fontFamily: 'monospace', marginTop: 10 }}>
                {this.state.errorInfo?.componentStack}
              </Text>
            </ScrollView>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

import { preloadCriticalAssets } from './src/utils/assetManager';

export default function App() {
  React.useEffect(() => {
    preloadCriticalAssets();
  }, []);

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}