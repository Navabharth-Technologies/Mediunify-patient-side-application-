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
        <View style={{ flex: 1, backgroundColor: '#FEF2F2', padding: 24, justifyContent: 'center', alignItems: 'center', minHeight: Platform.OS === 'web' ? '100dvh' : '100%' }}>
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

// Web-safe dynamic viewport & keyboard layout initializer
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'mediunify-responsive-mobile-web';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.innerHTML = `
      :root {
        --app-height: 100dvh;
      }
      html, body {
        width: 100%;
        min-height: 100%;
        min-height: -webkit-fill-available;
        min-height: 100dvh;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        overscroll-behavior-y: none;
        touch-action: manipulation;
      }
      #root {
        width: 100%;
        min-height: 100%;
        min-height: -webkit-fill-available;
        min-height: 100dvh;
        display: flex;
        flex-direction: column;
        overflow-x: hidden;
      }
      /* Ensure text inputs are fully selectable, tap-responsive and never blocked by parent user-select */
      input, textarea, select, [contenteditable="true"] {
        min-width: 0 !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        -webkit-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
        touch-action: manipulation !important;
        pointer-events: auto !important;
      }
      @media (max-width: 767px) {
        input, textarea, select {
          font-size: 16px !important; /* Prevents iOS Safari input focus auto-zoom and cursor freeze */
        }
      }
      * {
        -webkit-tap-highlight-color: transparent;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(styleEl);
  }

  const updateAppHeight = () => {
    if (typeof window === 'undefined') return;
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${vh}px`);
  };

  if (typeof window !== 'undefined') {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateAppHeight);
      window.visualViewport.addEventListener('scroll', updateAppHeight);
    } else {
      window.addEventListener('resize', updateAppHeight);
    }
    updateAppHeight();
  }
}

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