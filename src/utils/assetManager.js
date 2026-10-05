import { Image, Platform } from 'react-native';
import { Asset } from 'expo-asset';

// ============================================================
// CENTRAL ASSET REGISTRY
// ============================================================

export const BRAND_ASSETS = {
  LOGO: require('../../assets/logo.png'),
  LOGO_MARK: require('../../assets/logo-mark.png'),
  AI_BOT_AVATAR: require('../../assets/ai-bot-avatar.png'),
  BOT_ICON: require('../../assets/bot-icon.png'),
  BOT_ICON_TRANSPARENT: require('../../assets/bot-icon-transparent.png'),
};

export const SERVICE_ASSETS = {
  HOME_CARE: require('../../assets/services/service_home_care.jpg'),
  HOSPITAL_CARE: require('../../assets/services/service_hospital_care.jpg'),
  LAB_TESTS: require('../../assets/services/service_lab_tests.jpg'),
  MENTAL_HEALTH: require('../../assets/services/service_mental_health.jpg'),
  PHARMACY: require('../../assets/services/service_pharmacy.jpg'),
  RADIOLOGY: require('../../assets/services/service_radiology.jpg'),
  VIDEO_CONSULT: require('../../assets/services/service_video_consult.jpg'),
};

export const HERO_ASSETS = {
  HERO_FAMILY: require('../../assets/images/hero_family.jpg'),
  HERO_FAMILY_BANNER: require('../../assets/images/hero-family-banner.png'),
};

// ============================================================
// MEMORY CACHE REGISTRY FOR REMOTE IMAGES
// ============================================================
const memoryCache = new Set();

export const isImageCached = (uri) => {
  if (!uri || typeof uri !== 'string') return true;
  return memoryCache.has(uri);
};

export const markImageCached = (uri) => {
  if (uri && typeof uri === 'string') {
    memoryCache.add(uri);
  }
};

// ============================================================
// ASYNC PRELOADER (NON-BLOCKING)
// ============================================================
let hasPreloaded = false;

export const preloadCriticalAssets = async () => {
  if (hasPreloaded) return;
  hasPreloaded = true;

  try {
    // 1. Preload local critical brand & service assets into native asset cache
    const localAssets = [
      BRAND_ASSETS.LOGO,
      BRAND_ASSETS.LOGO_MARK,
      BRAND_ASSETS.AI_BOT_AVATAR,
      BRAND_ASSETS.BOT_ICON,
      SERVICE_ASSETS.VIDEO_CONSULT,
      SERVICE_ASSETS.LAB_TESTS,
      SERVICE_ASSETS.PHARMACY,
      SERVICE_ASSETS.RADIOLOGY,
      SERVICE_ASSETS.HOME_CARE,
      SERVICE_ASSETS.HOSPITAL_CARE,
    ];

    if (Asset && typeof Asset.loadAsync === 'function') {
      Asset.loadAsync(localAssets).catch(() => {});
    }

    // 2. Preload high-priority doctor and equipment image URLs in background
    const priorityRemoteUrls = [
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1594824813693-0e86b0932822?auto=format&fit=crop&q=80&w=300',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    ];

    priorityRemoteUrls.forEach((url) => {
      if (Image.prefetch && typeof Image.prefetch === 'function') {
        Image.prefetch(url)
          .then(() => markImageCached(url))
          .catch(() => {});
      }
    });
  } catch (err) {
    // Silent fail so preloading never disrupts app lifecycle
  }
};

export default {
  BRAND_ASSETS,
  SERVICE_ASSETS,
  HERO_ASSETS,
  isImageCached,
  markImageCached,
  preloadCriticalAssets,
};
