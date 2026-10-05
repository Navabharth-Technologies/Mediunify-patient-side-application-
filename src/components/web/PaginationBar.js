import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const PaginationBar = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 4,
  onPageChange,
  itemLabel = 'items',
  showInfo = true,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate responsive visible pages with ellipsis
  const maxButtons = isMobile ? 4 : 7;
  const pages = [];

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, '...', totalPages);
    } else if (safeCurrentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safeCurrentPage, '...', totalPages);
    }
  }

  return (
    <View style={styles.paginationContainer}>
      {showInfo && totalItems > 0 && (
        <Text style={styles.paginationInfo}>
          Showing <Text style={styles.paginationBold}>{startItem}–{endItem}</Text> of{' '}
          <Text style={styles.paginationBold}>{totalItems}</Text> {itemLabel}
        </Text>
      )}

      <View style={styles.pageButtonsRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navBtn, safeCurrentPage === 1 && styles.navBtnDisabled]}
          onPress={() => onPageChange(Math.max(safeCurrentPage - 1, 1))}
          disabled={safeCurrentPage === 1}
          activeOpacity={0.7}
          accessibilityLabel="Previous Page"
        >
          <Ionicons name="chevron-back" size={15} color={safeCurrentPage === 1 ? '#94A3B8' : '#0F172A'} />
          {!isMobile && (
            <Text style={[styles.navBtnText, safeCurrentPage === 1 && styles.navBtnTextDisabled]}>Previous</Text>
          )}
        </TouchableOpacity>

        {/* Page Number Pills */}
        <View style={styles.pageNumbersWrap}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <View key={`ellipsis-${idx}`} style={styles.ellipsisBox}>
                  <Text style={styles.ellipsisText}>…</Text>
                </View>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <TouchableOpacity
                key={`page-${p}`}
                style={[styles.pageNumberBtn, isActive && styles.pageNumberBtnActive]}
                onPress={() => onPageChange(p)}
                activeOpacity={0.8}
                accessibilityLabel={`Page ${p}`}
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
          style={[styles.navBtn, safeCurrentPage === totalPages && styles.navBtnDisabled]}
          onPress={() => onPageChange(Math.min(safeCurrentPage + 1, totalPages))}
          disabled={safeCurrentPage === totalPages}
          activeOpacity={0.7}
          accessibilityLabel="Next Page"
        >
          {!isMobile && (
            <Text style={[styles.navBtnText, safeCurrentPage === totalPages && styles.navBtnTextDisabled]}>Next</Text>
          )}
          <Ionicons name="chevron-forward" size={15} color={safeCurrentPage === totalPages ? '#94A3B8' : '#0F172A'} />
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
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  paginationInfo: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
  },
  paginationBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  pageButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  navBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.45,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
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
    gap: 5,
  },
  pageNumberBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.15s ease' } : {}),
  },
  pageNumberBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
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
  ellipsisBox: {
    width: 20,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
});

