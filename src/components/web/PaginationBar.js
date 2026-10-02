import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PaginationBar = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 4,
  onPageChange,
  itemLabel = 'items',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <View style={styles.paginationContainer}>
      <Text style={styles.paginationInfo}>
        Showing <Text style={styles.paginationBold}>{startItem}–{endItem}</Text> of{' '}
        <Text style={styles.paginationBold}>{totalItems}</Text> {itemLabel}
      </Text>

      <View style={styles.pageButtonsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage === 1 && styles.navBtnDisabled]}
          onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={14} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
          <Text style={[styles.navBtnText, currentPage === 1 && styles.navBtnTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        {/* Page Number Pills */}
        <View style={styles.pageNumbersWrap}>
          {pages.map((p) => {
            const isActive = p === currentPage;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.pageNumberBtn, isActive && styles.pageNumberBtnActive]}
                onPress={() => onPageChange(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pageNumberText, isActive && styles.pageNumberTextActive]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.navBtn, currentPage === totalPages && styles.navBtnDisabled]}
          onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          activeOpacity={0.7}
        >
          <Text style={[styles.navBtnText, currentPage === totalPages && styles.navBtnTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={14} color={currentPage === totalPages ? '#94A3B8' : '#0F172A'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaginationBar;

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    flexWrap: 'wrap',
    gap: 12,
    boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
  },
  paginationInfo: {
    fontSize: 13,
    color: '#64748B',
  },
  paginationBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  pageButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  navBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  navBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNumberBtn: {
    minWidth: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
  },
  pageNumberBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
