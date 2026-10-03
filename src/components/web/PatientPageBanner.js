import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * PatientPageBanner - Consistent, modern healthcare header banner
 * Designed for MediUnify patient portal web pages.
 *
 * Color Theme:
 * - Navy Blue: #1E3A8A (Headings)
 * - Teal: #008B94 (Accents / Icons)
 * - Aqua: #00C2CB (Highlights)
 * - Fresh Green: #7BC96F (Success / Status)
 * - Coral: #FF7F50 (Warnings / Alerts)
 * - Slate: #64748B / #475569 (Secondary Text)
 */

import { BANNER_THEMES } from '../../theme/colors';

const THEME_STYLES = BANNER_THEMES;

const PatientPageBanner = ({
  title,
  subtitle,
  badgeText,
  badgeIcon = 'medical',
  iconName = 'calendar-outline',
  theme = 'teal',
  pills = [],
  rightContent = null,
  style = {},
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.teal;

  return (
    <View
      style={[
        styles.bannerCard,
        {
          backgroundColor: currentTheme.bg,
          backgroundImage: currentTheme.gradient,
          borderColor: currentTheme.borderColor,
        },
        style,
      ]}
    >
      <View style={[styles.mainRow, isDesktop ? styles.mainRowDesktop : styles.mainRowMobile]}>
        {/* Left Section: Icon + Text Content */}
        <View style={styles.leftGroup}>
          {iconName ? (
            <View style={[styles.iconCircle, { backgroundColor: currentTheme.iconCircleBg }]}>
              <Ionicons name={iconName} size={24} color={currentTheme.iconColor} />
            </View>
          ) : null}

          <View style={styles.textColumn}>
            {badgeText ? (
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: currentTheme.badgeBg, borderColor: currentTheme.badgeBorder },
                ]}
              >
                {badgeIcon ? (
                  <Ionicons name={badgeIcon} size={12} color={currentTheme.badgeText} style={{ marginRight: 5 }} />
                ) : null}
                <Text style={[styles.categoryBadgeText, { color: currentTheme.badgeText }]}>
                  {badgeText}
                </Text>
              </View>
            ) : null}

            <Text style={styles.titleText}>{title}</Text>

            {subtitle ? (
              typeof subtitle === 'string' ? (
                <Text style={styles.subtitleText}>{subtitle}</Text>
              ) : (
                <View style={{ marginTop: 4 }}>{subtitle}</View>
              )
            ) : null}

            {/* Optional Status / Quick Filter Pills */}
            {Array.isArray(pills) && pills.length > 0 ? (
              <View style={styles.pillsRow}>
                {pills.map((pill, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.pillBadge,
                      {
                        backgroundColor: pill.bgColor || '#DCFCE7',
                        borderColor: pill.borderColor || '#86EFAC',
                      },
                    ]}
                  >
                    {pill.icon ? (
                      <Ionicons
                        name={pill.icon}
                        size={12}
                        color={pill.textColor || '#166534'}
                        style={{ marginRight: 4 }}
                      />
                    ) : null}
                    <Text style={[styles.pillBadgeText, { color: pill.textColor || '#166534' }]}>
                      {pill.label}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* Right Section: Action Buttons, Quick Stats, or Custom Node */}
        {rightContent ? (
          <View style={[styles.rightGroup, !isDesktop && styles.rightGroupMobile]}>
            {rightContent}
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default PatientPageBanner;

const styles = StyleSheet.create({
  bannerCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginTop: 6,
    marginBottom: 16,
    boxShadow: '0 2px 10px rgba(12, 59, 107, 0.05)',
  },
  mainRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  mainRowDesktop: {
    flexDirection: 'row',
  },
  mainRowMobile: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  textColumn: {
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleText: {
    fontSize: 25,
    fontWeight: '900',
    color: '#1E3A8A', // Deep Navy Blue
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  subtitleText: {
    fontSize: 13,
    color: '#475569', // Slate
    marginTop: 4,
    lineHeight: 19,
    maxWidth: 720,
    fontWeight: '400',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rightGroup: {
    flexShrink: 0,
    alignItems: 'center',
  },
  rightGroupMobile: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    marginTop: 4,
  },
});
