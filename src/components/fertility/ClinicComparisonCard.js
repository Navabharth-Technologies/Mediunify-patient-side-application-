import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ClinicComparisonCard = ({ clinics = [], onRemoveClinic, onSelectClinic }) => {
  if (!clinics || clinics.length === 0) return null;

  const comparisonRows = [
    { label: 'Success Rate', key: 'successRate', highlight: true },
    {
      label: 'IVF Package',
      render: (c) => `₹${c.ivfPackagePrice.toLocaleString('en-IN')}`,
    },
    {
      label: 'IUI Starts At',
      render: (c) => `₹${c.startingPackagePrice.toLocaleString('en-IN')}`,
    },
    { label: 'Specialists', render: (c) => `${c.doctorsCount} In-house` },
    { label: 'Rating', render: (c) => `⭐ ${c.rating} (${c.reviewsCount})` },
    {
      label: 'Certifications',
      render: (c) => c.certifications.join(', '),
    },
    {
      label: 'Cashless Insurance',
      render: (c) => (c.insuranceCashless || []).join(', '),
    },
    { label: 'Location', render: (c) => c.city },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={styles.tableWrap}>
        {/* Header Row with Clinic Cards */}
        <View style={styles.headerRow}>
          <View style={styles.labelColHeader}>
            <Text style={styles.headerTitle}>Comparison</Text>
            <Text style={styles.headerSubtitle}>{clinics.length} Clinics</Text>
          </View>

          {clinics.map((clinic) => (
            <View key={clinic.id} style={styles.clinicColHeader}>
              {onRemoveClinic && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => onRemoveClinic(clinic.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
              <Image source={{ uri: clinic.image }} style={styles.clinicThumb} />
              <Text style={styles.colClinicName} numberOfLines={2}>
                {clinic.name}
              </Text>
              {onSelectClinic && (
                <TouchableOpacity
                  style={styles.chooseBtn}
                  onPress={() => onSelectClinic(clinic)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chooseBtnText}>Select</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Comparison Data Rows */}
        {comparisonRows.map((row, rIdx) => (
          <View
            key={rIdx}
            style={[styles.dataRow, rIdx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
          >
            <View style={styles.labelCol}>
              <Text style={styles.rowLabelText}>{row.label}</Text>
            </View>

            {clinics.map((clinic) => {
              const val = row.render
                ? row.render(clinic)
                : clinic[row.key] || '-';

              return (
                <View key={clinic.id} style={styles.dataCol}>
                  <Text
                    style={[
                      styles.dataValText,
                      row.highlight && styles.highlightValText,
                    ]}
                  >
                    {val}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  tableWrap: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  labelColHeader: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  clinicColHeader: {
    width: 150,
    alignItems: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: 4,
    zIndex: 2,
  },
  clinicThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  colClinicName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    minHeight: 32,
  },
  chooseBtn: {
    marginTop: 6,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  chooseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#F8FAFC',
  },
  labelCol: {
    width: 120,
    justifyContent: 'center',
    paddingRight: 8,
  },
  rowLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  dataCol: {
    width: 150,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dataValText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    lineHeight: 17,
  },
  highlightValText: {
    fontWeight: '800',
    color: '#E11D48',
    fontSize: 13,
  },
});

export default ClinicComparisonCard;
