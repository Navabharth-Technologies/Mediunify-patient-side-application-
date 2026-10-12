import { useState, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Checks if the user is on a mobile device whose browser has requested "Desktop site".
 * In mobile browsers (e.g. Chrome on Android, Safari on iOS), selecting "Desktop site"
 * changes navigator.userAgent to a desktop UA (e.g. Linux x86_64, Windows, or Mac) while
 * the device physically remains a touch-screen device with physical screen width < 768.
 */
export function isDesktopSiteRequested() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent || '';

  // Check if physical hardware has touch capability
  const hasTouch = (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    // @ts-ignore
    (navigator.msMaxTouchPoints > 0)
  );

  // Check physical screen dimensions
  const screenDim = typeof window.screen !== 'undefined'
    ? Math.min(window.screen.width, window.screen.height)
    : 1024;
  const isPhysicalMobileScreen = screenDim < 768;

  // Normal mobile UAs contain Mobile, Android, iPhone, iPod, etc.
  const hasMobileUA = /Android.*Mobile|Mobile.*Safari|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  // If it's a mobile device with touch, but the browser has stripped the mobile token
  // from the User-Agent, the user has toggled "Request Desktop Site" / "Desktop site"!
  if (hasTouch && isPhysicalMobileScreen && !hasMobileUA) {
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
 * Dynamically synchronizes the HTML <meta name="viewport"> tag.
 * When desktop site is requested on a mobile browser, sets viewport width=1024
 * with user scalability enabled so the desktop web application layout renders
 * cleanly and allows user zooming. When normal mobile browsing is active,
 * keeps standard mobile viewport.
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
    const desktopContent = 'width=1024, initial-scale=0.38, minimum-scale=0.25, maximum-scale=5.0, user-scalable=yes';
    if (metaViewport.getAttribute('content') !== desktopContent) {
      metaViewport.setAttribute('content', desktopContent);
    }
  } else {
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
    width: desktopSiteMode ? Math.max(width, 1024) : width,
    height,
    isDesktop,
    isTablet,
    isMobile,
    isDesktopSiteMode: desktopSiteMode,
  };
}
