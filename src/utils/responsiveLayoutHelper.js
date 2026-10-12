import { useState, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Checks if the user is on a mobile device whose browser has requested "Desktop site".
 * In mobile browsers (e.g. Chrome on Android, Safari on iOS), selecting "Desktop site"
 * changes navigator.userAgent to a desktop UA (e.g. Linux x86_64, Windows, or Mac) while
 * the device physically remains a touch-screen device with physical screen dimensions.
 */
export function isDesktopSiteRequested() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // 1. Explicit URL or class override
  try {
    if (window.location && (window.location.search.includes('mode=desktop') || window.location.search.includes('desktop=true'))) {
      return true;
    }
    if (typeof document !== 'undefined' && document.documentElement.classList.contains('desktop-site-mode')) {
      return true;
    }
  } catch (e) {}

  const ua = navigator.userAgent || '';

  // 2. Normal mobile UAs contain Mobile, iPhone, iPod, etc.
  // If the UA still explicitly includes a mobile token, normal mobile mode is active.
  const hasMobileToken = /Android.*Mobile|Mobile.*Safari|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  if (hasMobileToken) {
    return false;
  }

  // 3. Check hardware touch capability
  const hasTouch = (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    // @ts-ignore
    (navigator.msMaxTouchPoints > 0)
  );

  // 4. Physical screen dimensions
  const screenDim = typeof window.screen !== 'undefined'
    ? Math.min(window.screen.width, window.screen.height)
    : 1024;
  const isPhysicalMobileScreen = screenDim < 768;

  // 5. iOS device detection (Safari on iPhone/iPad in Desktop Mode reports as Macintosh)
  const isIosDevice = (
    typeof window.orientation !== 'undefined' ||
    (typeof navigator.platform === 'string' && /iPhone|iPod|iPad/i.test(navigator.platform))
  );

  // iOS Safari in "Request Desktop Website" mode
  if (/Macintosh/i.test(ua) && (isPhysicalMobileScreen || isIosDevice)) {
    return true;
  }

  // Android Chrome / Edge / Firefox in "Desktop site" mode
  if (/Android/i.test(ua) && !hasMobileToken) {
    return true;
  }

  if (/Linux x86_64|X11/i.test(ua) && (isPhysicalMobileScreen || (hasTouch && screenDim < 900))) {
    return true;
  }

  // Generic mobile screen without mobile UA token
  if (isPhysicalMobileScreen && !hasMobileToken && (hasTouch || isIosDevice)) {
    return true;
  }

  return false;
}

/**
 * Determines whether desktop layout should be rendered based on either
 * viewport width (>= 768) OR explicit "Desktop site" mode requested on a mobile browser.
 */
export function isDesktopLayout(width) {
  if (isDesktopSiteRequested()) return true;
  return typeof width === 'number' && width >= 768;
}

/**
 * Dynamically synchronizes the HTML <meta name="viewport"> tag and root classes.
 * When desktop site is requested on a mobile browser, sets viewport width=1200
 * with user scalability enabled so the desktop web application layout renders
 * completely and matches a desktop monitor.
 */
export function syncResponsiveViewport() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const isDesktopSite = isDesktopSiteRequested();
  let metaViewport = document.querySelector('meta[name="viewport"]');
  if (!metaViewport) {
    metaViewport = document.createElement('meta');
    metaViewport.setAttribute('name', 'viewport');
    document.head.appendChild(metaViewport);
  }

  if (isDesktopSite) {
    const desktopContent = 'width=1200, initial-scale=0.32, minimum-scale=0.2, maximum-scale=5.0, user-scalable=yes';
    if (metaViewport.getAttribute('content') !== desktopContent) {
      metaViewport.setAttribute('content', desktopContent);
    }
    document.documentElement.classList.add('desktop-site-mode');
  } else {
    document.documentElement.classList.remove('desktop-site-mode');
    const mobileContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content';
    if (metaViewport.getAttribute('content') !== mobileContent) {
      metaViewport.setAttribute('content', mobileContent);
    }
  }
}

/**
 * Custom hook for responsive layout dimensions and display modes.
 * Automatically recalculates layout dimensions when viewport changes
 * or when the mobile browser switches between normal and desktop-site modes.
 */
export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const [desktopSiteMode, setDesktopSiteMode] = useState(isDesktopSiteRequested());

  useEffect(() => {
    syncResponsiveViewport();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleResizeOrModeChange = () => {
        const newMode = isDesktopSiteRequested();
        setDesktopSiteMode(newMode);
        syncResponsiveViewport();
      };

      window.addEventListener('resize', handleResizeOrModeChange);
      window.addEventListener('orientationchange', handleResizeOrModeChange);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResizeOrModeChange);
      }

      return () => {
        window.removeEventListener('resize', handleResizeOrModeChange);
        window.removeEventListener('orientationchange', handleResizeOrModeChange);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResizeOrModeChange);
        }
      };
    }
  }, []);

  const isDesktop = (width >= 768) || desktopSiteMode;
  const isTablet = (width >= 600 && width < 1024 && !desktopSiteMode);
  const isMobile = (width < 600 && !desktopSiteMode);

  return {
    width: desktopSiteMode ? Math.max(width, 1200) : width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    isDesktopSiteMode: desktopSiteMode,
  };
}
