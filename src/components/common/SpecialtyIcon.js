import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

/**
 * SpecialtyIcon
 * Renders clinically accurate, dedicated medical symbols for each specialty.
 * On Web: uses sharp, instantaneous vector SVG symbols for 100% crisp presentation.
 * On Native: renders MaterialCommunityIcons / Ionicons.
 */
export const SpecialtyIcon = ({ id, size = 32, color = '#00B894' }) => {
  if (Platform.OS === 'web') {
    switch (id) {
      // 1. General Physician: Stethoscope with binaural tubes and bell
      case 'general-primary':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 3h2v4a5.5 5.5 0 0 0 11 0V3h2" />
            <path d="M12 12.5V17a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4v-1.5" />
            <circle cx="21" cy="15.5" r="2.5" fill={color} />
            <circle cx="5.5" cy="3" r="1.5" fill={color} />
            <circle cx="18.5" cy="3" r="1.5" fill={color} />
          </svg>
        );

      // 2. Women's Health: Pregnant mother silhouette / Maternity
      case 'womens-health-group':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7.5" r="5" />
            <line x1="12" y1="12.5" x2="12" y2="21" />
            <line x1="8" y1="16.5" x2="16" y2="16.5" />
            <path d="M10 6a2 2 0 0 1 4 0" />
            <path d="M9.5 10a2.5 2.5 0 0 0 5 0" />
          </svg>
        );

      // 3. IVF & Fertility: Baby pram / carriage
      case 'ivf-fertility-group':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h13a3 3 0 0 1 3 3v1a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-4z" />
            <path d="M17 10V6a4 4 0 0 0-4-4h-2" />
            <circle cx="8" cy="19.5" r="2" fill={color} stroke="none" />
            <circle cx="15" cy="19.5" r="2" fill={color} stroke="none" />
            <path d="M2 5h3l2 5" />
          </svg>
        );

      // 4. Dermatology: Facial profile with healthy radiant skin glow
      case 'dermatology-skin':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.5C8 7 5 11 5 15a7 7 0 0 0 14 0c0-4-3-8-7-12.5z" />
            <path d="M12 18.5a3.5 3.5 0 0 1-3.5-3.5" />
            <path d="M18.5 5.5l.8-1.5.8 1.5 1.5.8-1.5.8-.8 1.5-.8-1.5-1.5-.8 1.5-.8z" fill={color} stroke="none" />
          </svg>
        );

      // 5. Pediatrics: Adorable infant / baby face
      case 'pediatrics-child-health':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 4c-.8 0-1.5.6-1.5 1.3 0 1.2 1.5 1.7 1.5 1.7s1.5-.5 1.5-1.7c0-.7-.7-1.3-1.5-1.3z" fill={color} stroke="none" />
            <circle cx="9.2" cy="11.5" r="1.3" fill={color} stroke="none" />
            <circle cx="14.8" cy="11.5" r="1.3" fill={color} stroke="none" />
            <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
            <circle cx="4" cy="12" r="1.2" fill={color} stroke="none" />
            <circle cx="20" cy="12" r="1.2" fill={color} stroke="none" />
          </svg>
        );

      // 6. Cardiology: Anatomical heart with live ECG pulse beat
      case 'cardiology-heart':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" opacity="0.18" fill={color} stroke="none" />
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            <path d="M3.5 11.5h3.5l2-4 3 8 2.5-5 1.5 2.5h4.5" strokeWidth="2.3" />
          </svg>
        );

      // 7. Orthopedics: Anatomical bone
      case 'orthopedics-bone-joint':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.5 3.5a2.5 2.5 0 0 0-3.5 0l-1 1-6.5 6.5a2.5 2.5 0 1 0-3 3.8l.7.7a2.5 2.5 0 0 0 3.5 0l6.5-6.5 1-1a2.5 2.5 0 1 0 2.3-4.5z" />
            <circle cx="18.5" cy="5" r="1.3" fill={color} stroke="none" />
            <circle cx="16" cy="2.5" r="1.3" fill={color} stroke="none" />
            <circle cx="5.5" cy="18.5" r="1.3" fill={color} stroke="none" />
            <circle cx="3" cy="16" r="1.3" fill={color} stroke="none" />
          </svg>
        );

      // 8. Dental Care: Clinical molar tooth with crown and roots
      case 'dental-oral-care':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3C4 3 3 6 3 9c0 3.5 1.5 7 2.5 10 .8 2.4 2.5 2 3.5 0l1-2.5c.5-1 1.5-1 2 0l1 2.5c1 2 2.7 2.4 3.5 0 1-3 2.5-6.5 2.5-10 0-3-1-6-4-6-2 0-3 1.5-3.5 2-.5-.5-1.5-2-3.5-2z" />
            <path d="M9 7c1 1 2 1 3 1s2 0 3-1" />
          </svg>
        );

      // 9. Mental Health: Brain lobes / Neuro-psychiatry
      case 'psychiatry-mental-health':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 4a3.5 3.5 0 0 0-3.5 3.5c0 .5.1 1 .3 1.4A3.5 3.5 0 0 0 4 12a3.5 3.5 0 0 0 1.5 2.9A3.5 3.5 0 0 0 9.5 20h.5V4h-.5z" />
            <path d="M14.5 4a3.5 3.5 0 0 1 3.5 3.5c0 .5-.1 1-.3 1.4A3.5 3.5 0 0 1 20 12a3.5 3.5 0 0 1-1.5 2.9A3.5 3.5 0 0 1 14.5 20H14V4h.5z" />
            <path d="M9.5 8.5a2 2 0 0 0-2 2" />
            <path d="M14.5 8.5a2 2 0 0 1 2 2" />
            <path d="M9.5 15.5a2 2 0 0 0-2-2" />
            <path d="M14.5 15.5a2 2 0 0 1 2-2" />
          </svg>
        );

      // 10. ENT Specialist: Ear with acoustic hearing waves
      case 'ent-group':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8.5a6 6 0 0 1 12 0c0 4-2.5 6.5-3.5 8.5-.6 1.2-1.5 2-2.5 2a2 2 0 0 1-2-2v-1.5c0-1.5 1-2.5 2-3.5.8-.8 1-1.5 1-2.5a3 3 0 0 0-6 0c0 .5.2 1 .5 1.5" />
            <path d="M19 5a9 9 0 0 1 0 12" strokeWidth="1.8" />
            <path d="M21.5 3a12 12 0 0 1 0 16" strokeWidth="1.8" />
          </svg>
        );

      // 11. Eye Care: Clinical eye with iris and pupil
      case 'ophthalmology-group':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3.5" />
            <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
          </svg>
        );

      // 12. Gastroenterology: Stomach organ
      case 'gastroenterology-group':
        return (
          <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2.5v3.5c0 2-2 3-3 4-2.5 2.5-3 6.5-.5 9 2.5 2.5 7 2.5 9-.5 1.5-2.2 1-5-.5-7.5l-1-1.5V6" />
            <path d="M10 13c1 1.5 3 2 4.5 1.5" strokeWidth="1.5" />
            <circle cx="13" cy="2" r="1" fill={color} stroke="none" />
          </svg>
        );

      default:
        return <MaterialCommunityIcons name="stethoscope" size={size} color={color} />;
    }
  }

  // Fallback on native app: MaterialCommunityIcons
  const mciMap = {
    'general-primary': 'stethoscope',
    'womens-health-group': 'human-pregnant',
    'ivf-fertility-group': 'baby-carriage',
    'dermatology-skin': 'face-woman-shimmer',
    'pediatrics-child-health': 'baby-face-outline',
    'cardiology-heart': 'heart-pulse',
    'orthopedics-bone-joint': 'bone',
    'dental-oral-care': 'tooth',
    'psychiatry-mental-health': 'brain',
    'ent-group': 'ear-hearing',
    'ophthalmology-group': 'eye',
    'gastroenterology-group': 'stomach',
  };

  const iconName = mciMap[id] || 'stethoscope';
  return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
};

export default SpecialtyIcon;
