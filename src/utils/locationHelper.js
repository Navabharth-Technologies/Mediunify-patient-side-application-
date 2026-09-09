import { Platform } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const MYSORE_LOCALITIES = [
  { id: '1', name: 'Kuvempunagar', city: 'Mysore', full: 'Kuvempunagar, Mysore', latitude: 12.2858, longitude: 76.6341, pincode: '570023' },
  { id: '2', name: 'Jayalakshmipuram', city: 'Mysore', full: 'Jayalakshmipuram, Mysore', latitude: 12.3168, longitude: 76.6285, pincode: '570012' },
  { id: '3', name: 'Saraswathipuram', city: 'Mysore', full: 'Saraswathipuram, Mysore', latitude: 12.3021, longitude: 76.6318, pincode: '570009' },
  { id: '4', name: 'Vijayanagar 2nd Stage', city: 'Mysore', full: 'Vijayanagar 2nd Stage, Mysore', latitude: 12.3312, longitude: 76.6120, pincode: '570017' },
  { id: '5', name: 'Gokulam 3rd Stage', city: 'Mysore', full: 'Gokulam 3rd Stage, Mysore', latitude: 12.3355, longitude: 76.6310, pincode: '570002' },
  { id: '6', name: 'V.V. Mohalla', city: 'Mysore', full: 'V.V. Mohalla, Mysore', latitude: 12.3210, longitude: 76.6390, pincode: '570002' },
  { id: '7', name: 'Bannimantap', city: 'Mysore', full: 'Bannimantap, Mysore', latitude: 12.3380, longitude: 76.6520, pincode: '570015' },
  { id: '8', name: 'Nazarbad', city: 'Mysore', full: 'Nazarbad, Mysore', latitude: 12.3080, longitude: 76.6650, pincode: '570010' },
  { id: '9', name: 'Hebbal 1st Stage', city: 'Mysore', full: 'Hebbal, Mysore', latitude: 12.3610, longitude: 76.6150, pincode: '570016' },
  { id: '10', name: 'Mysore Central', city: 'Mysore', full: 'Mysore Central, Mysore', latitude: 12.3050, longitude: 76.6550, pincode: '570001' },
  { id: '11', name: 'TK Layout', city: 'Mysore', full: 'TK Layout, Mysore', latitude: 12.2965, longitude: 76.6215, pincode: '570009' },
  { id: '12', name: 'Siddhartha Layout', city: 'Mysore', full: 'Siddhartha Layout, Mysore', latitude: 12.3025, longitude: 76.6812, pincode: '570011' },
  { id: '13', name: 'Dattagalli', city: 'Mysore', full: 'Dattagalli, Mysore', latitude: 12.2740, longitude: 76.6110, pincode: '570022' },
  { id: '14', name: 'Bogadi 2nd Stage', city: 'Mysore', full: 'Bogadi 2nd Stage, Mysore', latitude: 12.3010, longitude: 76.6025, pincode: '570026' },
  { id: '15', name: 'Yadavagiri', city: 'Mysore', full: 'Yadavagiri, Mysore', latitude: 12.3260, longitude: 76.6410, pincode: '570020' },
];

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.0;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
};

export const getClosestMysoreLocality = (lat, lon) => {
  if (!lat || !lon) return MYSORE_LOCALITIES[0];
  let closest = MYSORE_LOCALITIES[0];
  let minD = Infinity;
  for (const loc of MYSORE_LOCALITIES) {
    const d = calculateDistanceKm(lat, lon, loc.latitude, loc.longitude);
    if (d < minD) {
      minD = d;
      closest = loc;
    }
  }
  return closest;
};

/**
 * Robust, cross-platform permission checker for Web & Native
 */
export const requestLocationPermissionWebSafe = async () => {
  if (Platform.OS === 'web') {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      // In web browsers, permissions are prompted when getCurrentPosition is called.
      // If Permissions API is available, check if explicitly denied:
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'geolocation' });
          if (res.state === 'denied') {
            return { status: 'denied', granted: false };
          }
        }
      } catch (e) {
        // Permissions API query not supported in all browsers; treat as promptable
      }
      return { status: 'granted', granted: true };
    }
    return { status: 'denied', granted: false };
  }

  try {
    const res = await Location.requestForegroundPermissionsAsync();
    return res;
  } catch (e) {
    console.warn('[LocationHelper] Permission request error:', e);
    return { status: 'denied', granted: false };
  }
};

/**
 * Robust, cross-platform position fetcher with accuracy fallback & timeout
 */
export const getCurrentPositionWebSafe = async (options = {}) => {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser.');
    }

    // Helper to wrap navigator.geolocation.getCurrentPosition in a promise with timeout
    const getWebPos = (opts) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                altitude: pos.coords.altitude,
                accuracy: pos.coords.accuracy,
                altitudeAccuracy: pos.coords.altitudeAccuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed,
              },
              timestamp: pos.timestamp,
            });
          },
          (err) => reject(err),
          opts
        );
      });

    // 1st attempt: High accuracy with 5 second timeout
    try {
      return await getWebPos({
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 10000,
      });
    } catch (firstErr) {
      // If user explicitly denied, don't retry
      if (firstErr && firstErr.code === 1) { // PERMISSION_DENIED
        throw new Error('Location permission was denied by the browser.');
      }
      // 2nd attempt: Balanced / Low accuracy (Wi-Fi/IP location for laptops & desktops)
      try {
        return await getWebPos({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        });
      } catch (secondErr) {
        // Fallback to closest default Mysore coordinate if position is completely unavailable
        console.warn('[LocationHelper] Web geolocation timed out; using Mysore center fallback');
        return {
          coords: {
            latitude: 12.2858,
            longitude: 76.6341,
            accuracy: 100,
          },
          timestamp: Date.now(),
          isFallback: true,
        };
      }
    }
  }

  // Native Mobile (iOS/Android)
  try {
    return await Location.getCurrentPositionAsync({
      accuracy: options.accuracy || Location.Accuracy.Balanced,
    });
  } catch (err) {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
      });
    } catch (lowestErr) {
      const last = await Location.getLastKnownPositionAsync();
      if (last) return last;
      throw lowestErr;
    }
  }
};

/**
 * Universal Reverse Geocoding that works reliably on Web and Native.
 * Replaces expo-location's reverseGeocodeAsync which returns [] on Web.
 */
export const reverseGeocodeWebSafe = async ({ latitude, longitude }) => {
  if (!latitude || !longitude) return [];

  // If on Native, try native geocoder first
  if (Platform.OS !== 'web') {
    try {
      const nativeResults = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (Array.isArray(nativeResults) && nativeResults.length > 0 && nativeResults[0].city) {
        return nativeResults;
      }
    } catch (nativeErr) {
      console.warn('[LocationHelper] Native reverseGeocodeAsync failed, falling back to web service:', nativeErr);
    }
  }

  // 1. Try OpenStreetMap Nominatim (High detail: road, suburb, city, pincode)
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4500) : null;

    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const res = await fetch(osmUrl, {
      headers: { 'User-Agent': 'UnnathiHealthcareApp/1.0' },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const mainName = addr.amenity || addr.road || addr.suburb || addr.neighbourhood || 'Current Location';
        const district = addr.suburb || addr.neighbourhood || addr.city_district || addr.residential || 'Mysore';
        const city = addr.city || addr.town || addr.village || addr.county || 'Mysore';
        const state = addr.state || 'Karnataka';
        const postalCode = addr.postcode || '570001';

        return [
          {
            name: mainName,
            street: addr.road || '',
            district: district,
            subregion: district,
            city: city,
            region: state,
            postalCode: postalCode,
            country: addr.country || 'India',
            formattedAddress: data.display_name || `${mainName}, ${district}, ${city} - ${postalCode}`,
          },
        ];
      }
    }
  } catch (osmErr) {
    // OSM failed or timed out, try BigDataCloud
  }

  // 2. Try BigDataCloud Reverse Geocoding Client (Fast & CORS friendly)
  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
    const res = await fetch(bdcUrl, {
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (data.locality || data.city)) {
        const locality = data.locality || data.city || 'Kuvempunagar';
        const city = data.city || 'Mysore';
        const state = data.principalSubdivision || 'Karnataka';
        const postalCode = data.postcode || '570023';

        return [
          {
            name: locality,
            street: locality,
            district: locality,
            subregion: locality,
            city: city,
            region: state,
            postalCode: postalCode,
            country: data.countryName || 'India',
            formattedAddress: `${locality}, ${city}, ${state} - ${postalCode}`,
          },
        ];
      }
    }
  } catch (bdcErr) {
    // BigDataCloud failed, proceed to local Mysore matcher
  }

  // 3. Fallback: Match against known Mysore localities based on distance
  const closest = getClosestMysoreLocality(latitude, longitude);
  return [
    {
      name: closest.name,
      street: `${closest.name} Main Road`,
      district: closest.name,
      subregion: closest.name,
      city: closest.city || 'Mysore',
      region: 'Karnataka',
      postalCode: closest.pincode || '570023',
      country: 'India',
      formattedAddress: `${closest.name}, ${closest.city || 'Mysore'} - ${closest.pincode || '570023'}`,
    },
  ];
};

/**
 * Universal forward geocoding (search by place/address) for Web & Native
 */
export const geocodeWebSafe = async (searchText) => {
  if (!searchText || typeof searchText !== 'string' || !searchText.trim()) {
    return [];
  }

  const query = searchText.trim().toLowerCase();

  // Search local list first
  const localMatches = MYSORE_LOCALITIES.filter(
    (loc) => loc.name.toLowerCase().includes(query) || loc.full.toLowerCase().includes(query)
  );

  // If on Native, try native geocoder
  if (Platform.OS !== 'web') {
    try {
      const nativeRes = await Location.geocodeAsync(searchText);
      if (Array.isArray(nativeRes) && nativeRes.length > 0) {
        return nativeRes;
      }
    } catch (e) {}
  }

  // On Web or fallback, try Nominatim search
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText + ', Mysore, Karnataka')}&limit=5`;
    const res = await fetch(url, { headers: { 'User-Agent': 'UnnathiHealthcareApp/1.0' } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          name: item.display_name,
        }));
      }
    }
  } catch (e) {}

  if (localMatches.length > 0) {
    return localMatches.map((m) => ({
      latitude: m.latitude,
      longitude: m.longitude,
      name: m.full,
    }));
  }

  return [];
};

/**
 * All-in-one Helper: Checks permission, fetches GPS coordinates,
 * reverse geocodes to a readable address, and saves to AsyncStorage.
 */
export const detectUserLocationWithAddress = async () => {
  // 1. Permissions
  const perm = await requestLocationPermissionWebSafe();
  if (!perm.granted && perm.status !== 'granted') {
    return {
      success: false,
      error: 'PERMISSION_DENIED',
      message: 'Please enable location permission in your browser or device settings.',
    };
  }

  // 2. Coordinates
  const position = await getCurrentPositionWebSafe({
    accuracy: Location.Accuracy.Balanced,
  });

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  // 3. Address via Web-Safe Reverse Geocoding
  const addresses = await reverseGeocodeWebSafe({ latitude, longitude });
  const place = addresses[0] || {
    name: 'Current Area',
    street: '',
    district: 'Mysore',
    subregion: 'Mysore',
    city: 'Mysore',
    region: 'Karnataka',
    postalCode: '570023',
    country: 'India',
  };

  const areaName = place.district || place.subregion || place.name || 'Kuvempunagar';
  const cityName = place.city || 'Mysore';
  const shortLoc = `${areaName}, ${cityName}`;
  const fullLoc = place.formattedAddress || `${place.name ? `${place.name}, ` : ''}${areaName}, ${cityName} - ${place.postalCode || '570023'}`;

  // Save to AsyncStorage
  try {
    await AsyncStorage.setItem('@unnathi_user_location', shortLoc);
    await AsyncStorage.setItem(
      '@unnathi_user_coords',
      JSON.stringify({ latitude, longitude })
    );
  } catch (e) {}

  return {
    success: true,
    coords: { latitude, longitude },
    place,
    shortLoc,
    fullLoc,
    isFallback: position.isFallback || false,
  };
};

export default {
  requestLocationPermissionWebSafe,
  getCurrentPositionWebSafe,
  reverseGeocodeWebSafe,
  geocodeWebSafe,
  detectUserLocationWithAddress,
  getClosestMysoreLocality,
  calculateDistanceKm,
  MYSORE_LOCALITIES,
};
