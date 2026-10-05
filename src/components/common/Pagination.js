import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Universal Responsive Pagination Component for MediUnify (Mobile, Tablet & Web)
 * - Single compact horizontal row: [‹] [1] [2] [3] ... [N] [›]
 * - Never wraps 'Previous' or 'Next' onto a separate line
 * - Responsive ellipsis for high page counts
 * - MediUnify Teal/Green active styling (#00B894)
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize,
  onPageChange,
  showLabel = false,
  itemLabel = 'items',
  containerStyle,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const safeTotalPages = totalPages || (totalItems && pageSize ? Math.ceil(totalItems / pageSize) : 1);
  if (safeTotalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  // Generate responsive visible page array
  const maxButtons = isMobile ? 4 : 7;
  const pages = [];

  if (safeTotalPages <= maxButtons) {
    for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
  } else {
    if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, '...', safeTotalPages);
    } else if (safeCurrentPage >= safeTotalPages - 2) {
      pages.push(1, '...', safeTotalPages - 2, safeTotalPages - 1, safeTotalPages);
    } else {
      pages.push(1, '...', safeCurrentPage, '...', safeTotalPages);
    }
  }

  const startItem = totalItems && pageSize ? (safeCurrentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(safeCurrentPage * pageSize, totalItems) : null;

  return (
    <View style={[styles.paginationRoot, containerStyle]}>
      {showLabel && totalItems ? (
        <Text style={styles.paginationInfoText}>
          Showing <Text style={styles.paginationInfoBold}>{startItem}–{endItem}</Text> of{' '}
          <Text style={styles.paginationInfoBold}>{totalItems}</Text> {itemLabel}
        </Text>
      ) : null}

      <View style={styles.paginationSingleRow}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.pageNavBtn, safeCurrentPage === 1 && styles.pageNavBtnDisabled]}
          onPress={() => {
            if (safeCurrentPage > 1 && onPageChange) {
              onPageChange(safeCurrentPage - 1);
            }
          }}
          disabled={safeCurrentPage === 1}
          activeOpacity={0.7}
          accessibilityLabel="Previous Page"
        >
          <Ionicons name="chevron-back" size={16} color={safeCurrentPage === 1 ? '#94A3B8' : '#0F172A'} />
          {!isMobile && (
            <Text style={[styles.pageNavBtnText, safeCurrentPage === 1 && styles.pageNavBtnTextDisabled]}>
              Previous
            </Text>
          )}
        </TouchableOpacity>

        {/* Page Numbers Row */}
        <View style={styles.pageNumbersRow}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <View key={`ellipsis-${idx}`} style={styles.ellipsisWrap}>
                  <Text style={styles.ellipsisText}>…</Text>
                </View>
              );
            }
            const isActive = p === safeCurrentPage;
            return (
              <TouchableOpacity
                key={`page-${p}`}
                style={[styles.pageNumberBtn, isActive && styles.pageNumberBtnActive]}
                onPress={() => {
                  if (onPageChange && !isActive) {
                    onPageChange(p);
                  }
                }}
                activeOpacity={0.75}
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
          style={[styles.pageNavBtn, safeCurrentPage === safeTotalPages && styles.pageNavBtnDisabled]}
          onPress={() => {
            if (safeCurrentPage < safeTotalPages && onPageChange) {
              onPageChange(safeCurrentPage + 1);
            }
          }}
          disabled={safeCurrentPage === safeTotalPages}
          activeOpacity={0.7}
          accessibilityLabel="Next Page"
        >
          {!isMobile && (
            <Text style={[styles.pageNavBtnText, safeCurrentPage === safeTotalPages && styles.pageNavBtnTextDisabled]}>
              Next
            </Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={safeCurrentPage === safeTotalPages ? '#94A3B8' : '#0F172A'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Pagination;

const styles = StyleSheet.create({
  paginationRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    marginBottom: 16,
    width: '100%',
  },
  paginationInfoText: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 10,
    textAlign: 'center',
  },
  paginationInfoBold: {
    fontWeight: '800',
    color: '#0F172A',
  },
  paginationSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  pageNavBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.45,
    ...(Platform.OS === 'web' ? { cursor: 'not-allowed' } : {}),
  },
  pageNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  pageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pageNumberBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  ellipsisWrap: {
    width: 24,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipsisText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
