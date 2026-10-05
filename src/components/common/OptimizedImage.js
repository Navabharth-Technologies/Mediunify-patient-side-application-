import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isImageCached, markImageCached } from '../../utils/assetManager';

/**
 * High-performance OptimizedImage component
 * - Eliminates layout shift with reserved container sizing
 * - Instant display for cached/local assets
 * - Graceful fallback on network error without broken UI
 * - Subtle lightweight skeleton placeholder
 */
const OptimizedImage = ({
  source,
  style,
  containerStyle,
  resizeMode = 'cover',
  fallbackIcon = 'image-outline',
  fallbackColor = '#94A3B8',
  placeholderColor = '#F1F5F9',
  priority = false,
  alt = '',
  ...props
}) => {
  const uri = typeof source === 'object' && source?.uri ? source.uri : null;
  const isLocal = typeof source === 'number' || !uri;

  // If already cached or local, mark as loaded instantly with 0ms delay
  const alreadyCached = isLocal || (uri && isImageCached(uri));
  const [isLoaded, setIsLoaded] = useState(alreadyCached);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (uri && isImageCached(uri)) {
      setIsLoaded(true);
      setHasError(false);
    } else if (!isLocal) {
      setIsLoaded(false);
      setHasError(false);
    }
  }, [uri, isLocal]);

  const handleLoadSuccess = () => {
    if (uri) markImageCached(uri);
    setIsLoaded(true);
    setHasError(false);
  };

  const handleLoadError = () => {
    setIsLoaded(true);
    setHasError(true);
  };

  // Extract dimensions for reserved container
  const flattenedStyle = StyleSheet.flatten(style) || {};
  const containerWidth = flattenedStyle.width || '100%';
  const containerHeight = flattenedStyle.height || '100%';
  const containerBorderRadius = flattenedStyle.borderRadius || 0;

  return (
    <View
      style={[
        styles.container,
        {
          width: containerWidth,
          height: containerHeight,
          borderRadius: containerBorderRadius,
          backgroundColor: placeholderColor,
        },
        containerStyle,
        flattenedStyle,
        { overflow: 'hidden' },
      ]}
    >
      {!hasError ? (
        <Image
          source={source}
          style={[
            StyleSheet.absoluteFillObject,
            { width: '100%', height: '100%' },
            style,
          ]}
          resizeMode={resizeMode}
          onLoad={handleLoadSuccess}
          onError={handleLoadError}
          accessibilityLabel={alt}
          {...(Platform.OS === 'web'
            ? {
                loading: priority ? 'eager' : 'lazy',
                decoding: 'async',
              }
            : {})}
          {...props}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Ionicons name={fallbackIcon} size={22} color={fallbackColor} />
        </View>
      )}

      {/* Lightweight subtle skeleton overlay only when not loaded yet */}
      {!isLoaded && !hasError && !alreadyCached && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: placeholderColor },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(OptimizedImage);
