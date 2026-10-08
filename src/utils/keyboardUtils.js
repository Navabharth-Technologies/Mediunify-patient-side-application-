import { useState, useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Universal hook to track mobile keyboard visibility across:
 * - Native iOS & Android
 * - Mobile web browsers (iOS Safari, Android Chrome)
 * - Tablets & desktop browsers
 */
export function useKeyboardVisibility() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      const handleFocusIn = (e) => {
        const tag = e.target?.tagName;
        if (['INPUT', 'TEXTAREA'].includes(tag)) {
          setIsKeyboardVisible(true);
        }
      };

      const handleFocusOut = (e) => {
        const tag = e.target?.tagName;
        if (['INPUT', 'TEXTAREA'].includes(tag)) {
          // Small debounce so switching between adjacent form inputs doesn't flicker
          setTimeout(() => {
            const activeTag = document.activeElement?.tagName;
            if (!['INPUT', 'TEXTAREA'].includes(activeTag)) {
              setIsKeyboardVisible(false);
            }
          }, 120);
        }
      };

      const handleViewportChange = () => {
        if (window.visualViewport) {
          // If visual viewport height is noticeably smaller than layout height, keyboard is open
          const isShrunk = window.visualViewport.height < window.innerHeight * 0.82;
          const activeTag = document.activeElement?.tagName;
          const hasInputFocus = ['INPUT', 'TEXTAREA'].includes(activeTag);
          setIsKeyboardVisible(isShrunk || hasInputFocus);
        }
      };

      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      } else {
        window.addEventListener('resize', handleViewportChange);
      }

      return () => {
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        } else {
          window.removeEventListener('resize', handleViewportChange);
        }
      };
    } else {
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
      const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  return isKeyboardVisible;
}

/**
 * Universal helper to safely dismiss keyboard and restore viewport position
 */
export function dismissKeyboard() {
  Keyboard.dismiss();
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (typeof window !== 'undefined' && window.scrollTo) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }
}
