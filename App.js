import React from 'react';

import AppNavigator from './src/navigation/AppNavigator';
import { CartProvider } from './src/context/CartContext';
import { ThemeProvider } from './src/context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </ThemeProvider>
  );
}