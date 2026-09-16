import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ConsentItem = ({
  id,
  title,
  summary,
  legalNotice,
  isChecked = false,
  onToggle,
  required = true,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.container, isChecked && styles.containerChecked]}>
      <View style={styles.mainRow}>
        <TouchableOpacity
          style={styles.checkboxTouch}
          onPress={() => onToggle && onToggle(id, !isChecked)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isChecked ? 'checkbox' : 'square-outline'}
            size={22}
            color={isChecked ? '#E11D48' : '#94A3B8'}
          />
        </TouchableOpacity>

        <View style={styles.textWrap}>
          <TouchableOpacity
            onPress={() => onToggle && onToggle(id, !isChecked)}
            activeOpacity={0.8}
          >
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {required && <Text style={styles.reqBadge}>REQUIRED</Text>}
            </View>
            <Text style={styles.summary}>{summary}</Text>
          </TouchableOpacity>

          {legalNotice && (
            <TouchableOpacity
              style={styles.expandToggle}
              onPress={() => setExpanded(!expanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandText}>
                {expanded ? 'Hide statutory terms' : 'View ART Act legal terms'}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={13}
                color="#E11D48"
              />
            </TouchableOpacity>
          )}

          {expanded && legalNotice && (
            <View style={styles.legalBox}>
              <Text style={styles.legalText}>{legalNotice}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  containerChecked: {
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxTouch: {
    paddingTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  reqBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summary: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  legalBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E11D48',
  },
  legalText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 15,
  },
});

export default ConsentItem;
