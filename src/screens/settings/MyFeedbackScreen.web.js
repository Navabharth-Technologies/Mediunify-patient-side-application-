import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebFooter from '../../components/web/WebFooter';
import PaginationBar from '../../components/web/PaginationBar';
import PatientPageBanner from '../../components/web/PatientPageBanner';
import {
  getActivePatient,
  getFeedbackList,
  saveFeedbackList,
} from '../../data/patientDashboardData';
import { isGuestUser, promptLoginRequired } from '../../utils/authHelper';

const MyFeedbackScreenWeb = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const [patient, setPatient] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Pagination (4 reviews per page)
  const ITEMS_PER_PAGE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [viewingFeedback, setViewingFeedback] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // New feedback state
  const [serviceName, setServiceName] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const guest = await isGuestUser();
      if (guest) {
        setIsGuestMode(true);
        setPatient(null);
        setFeedbackList([]);
        setLoading(false);
        return;
      }
      setIsGuestMode(false);
      const p = await getActivePatient();
      setPatient(p);
      const items = await getFeedbackList();
      setFeedbackList(items);
    } catch (e) {
      console.warn('Error loading feedback:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewFeedback = async () => {
    const guest = await isGuestUser();
    if (guest) {
      promptLoginRequired(navigation, { service: 'profile', message: 'Please login to submit feedback and reviews.' });
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleAddNewFeedback = async () => {
    if (!serviceName.trim() || !reviewText.trim()) {
      showToast('Please provide a service/doctor name and your review.');
      return;
    }

    const newItem = {
      id: `FB-${Date.now().toString().slice(-4)}`,
      serviceName: serviceName.trim(),
      facility: facilityName.trim() || 'MediUnify Verified Healthcare Facility',
      date: 'Today',
      rating: rating,
      status: 'Published',
      review: reviewText.trim(),
      response: 'Thank you for sharing your experience. We are committed to continuous quality care.',
    };

    const updated = [newItem, ...feedbackList];
    setFeedbackList(updated);
    await saveFeedbackList(updated);
    setCurrentPage(1);
    setIsSubmitModalOpen(false);
    setServiceName('');
    setFacilityName('');
    setReviewText('');
    setRating(5);
    showToast('Your feedback has been submitted successfully!');
  };

  // Slice reviews for current page (4 reviews per page)
  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return feedbackList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [feedbackList, currentPage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Notification Toast */}
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Breadcrumb Bar */}
        <View style={styles.breadcrumbBar}>
          <View style={[styles.innerContainer, styles.breadcrumbContent]}>
            <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7} style={styles.breadcrumbItem}>
              <Ionicons name="home-outline" size={14} color="#64748B" />
              <Text style={styles.breadcrumbText}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
            <Text style={styles.breadcrumbActive}>My Feedback & Reviews</Text>
          </View>
        </View>

        {/* Page Hero Banner */}
        <View style={styles.innerContainer}>
          <PatientPageBanner
            onBack={() => navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate('Home')}
            title="My Feedback & Reviews"
            subtitle="Review past feedback submitted for doctors, clinics, diagnostics, and pharmacies. Your insights help maintain high medical standards across Karnataka."
            badgeText="PATIENT EXPERIENCE & QUALITY ASSURANCE"
            badgeIcon="star"
            iconName="chatbubbles"
            theme="freshGreen"
            pills={[
              {
                label: `Submitted Reviews: ${feedbackList.length}`,
                bgColor: '#EBF8E7',
                borderColor: '#C2EDB7',
                textColor: '#15803D',
                icon: 'star',
              },
              {
                label: 'Verified Ratings',
                bgColor: '#ECFDF5',
                borderColor: '#A7F3D0',
                textColor: '#008B94',
                icon: 'shield-checkmark',
              },
            ]}
            rightContent={
              <TouchableOpacity
                style={styles.newFeedbackBtn}
                onPress={handleOpenNewFeedback}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.newFeedbackBtnText}>Write New Review</Text>
              </TouchableOpacity>
            }
          />
        </View>

        <View style={[styles.innerContainer, { paddingTop: 8, paddingBottom: 60 }]}>

          {/* Feedback Items List */}
          {isGuestMode ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={48} color="#00B894" />
              <Text style={styles.emptyTitle}>Login to view your feedback & reviews</Text>
              <Text style={styles.emptyDesc}>
                Please sign in to view your past feedback, doctor reviews, and provider responses.
              </Text>
              <TouchableOpacity
                style={[styles.submitFirstBtn, { marginTop: 14 }]}
                onPress={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                  }
                  navigation?.navigate('Login', { openAuthModal: true });
                }}
              >
                <Text style={styles.submitFirstBtnText}>Login</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00B894" />
              <Text style={styles.loadingText}>Loading your feedback history...</Text>
            </View>
          ) : feedbackList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbubbles-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No feedback submitted yet</Text>
              <Text style={styles.emptyDesc}>
                You haven't left any feedback or ratings for previous appointments or orders.
              </Text>
              <TouchableOpacity
                style={styles.submitFirstBtn}
                onPress={handleOpenNewFeedback}
              >
                <Text style={styles.submitFirstBtnText}>Share Your First Experience</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.feedbackGrid}>
              {paginatedFeedback.map((item) => (
                <View key={item.id} style={styles.feedbackCard}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{item.serviceName}</Text>
                      <Text style={styles.facilityName}>{item.facility}</Text>
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                      <Text style={styles.ratingBadgeText}>{item.rating}.0 / 5.0</Text>
                    </View>
                  </View>

                  <Text style={styles.reviewText}>"{item.review}"</Text>

                  {item.response && (
                    <View style={styles.responseBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Ionicons name="arrow-undo" size={12} color="#00B894" style={{ marginRight: 4 }} />
                        <Text style={styles.responseAuthor}>Healthcare Provider Response:</Text>
                      </View>
                      <Text style={styles.responseBody}>{item.response}</Text>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>Submitted on {item.date}</Text>
                    <View style={styles.statusPill}>
                      <Ionicons name="checkmark-circle" size={12} color="#00B894" style={{ marginRight: 4 }} />
                      <Text style={styles.statusPillText}>{item.status}</Text>
                    </View>
                  </View>
                </View>
              ))}

              {feedbackList.length > 0 && (
                <PaginationBar
                  currentPage={currentPage}
                  totalItems={feedbackList.length}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={setCurrentPage}
                  itemLabel="reviews"
                />
              )}
            </View>
          )}
        </View>

        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* =========================================================
          SUBMIT NEW FEEDBACK MODAL (Modular & Ready)
      ========================================================= */}
      <Modal visible={isSubmitModalOpen} transparent animationType="fade" onRequestClose={() => setIsSubmitModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Share Your Healthcare Experience</Text>
                <Text style={styles.modalSubtitle}>Rate your consultation, clinic visit, or pharmacy delivery</Text>
              </View>
              <TouchableOpacity onPress={() => setIsSubmitModalOpen(false)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Doctor, Clinic, or Service Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Dr. Anita Sharma, Aster CMI OPD, Apollo Indiranagar..."
                placeholderTextColor="#94A3B8"
                value={serviceName}
                onChangeText={setServiceName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Facility / Location (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Hebbal, Bengaluru..."
                placeholderTextColor="#94A3B8"
                value={facilityName}
                onChangeText={setFacilityName}
              />

              {/* Star Rating Selector */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Your Overall Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 4 }}>
                    <Ionicons
                      name={s <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color={s <= rating ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginLeft: 8 }}>
                  {rating === 5 ? 'Excellent (5/5)' : rating === 4 ? 'Very Good (4/5)' : rating === 3 ? 'Average (3/5)' : 'Needs Improvement'}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Detailed Review & Feedback</Text>
              <TextInput
                style={[styles.modalInput, { height: 90 }]}
                placeholder="Write about the doctor's explanation, waiting time, staff behavior, hygiene..."
                placeholderTextColor="#94A3B8"
                value={reviewText}
                onChangeText={setReviewText}
                multiline
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsSubmitModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleAddNewFeedback}>
                <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Submit Feedback</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyFeedbackScreenWeb;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F1F8',
    backgroundImage: 'linear-gradient(180deg, #E6F0F7 0%, #EBF4FA 35%, #F0F6FA 100%)',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  breadcrumbBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingBottom: 4,
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#00B894',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#647488',
    marginTop: 6,
    maxWidth: 680,
    lineHeight: 20,
  },
  newFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0 4px 14px rgba(0, 184, 148, 0.3)',
  },
  newFeedbackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 400,
    marginTop: 4,
  },
  submitFirstBtn: {
    marginTop: 16,
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackGrid: {
    gap: 16,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  facilityName: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    fontStyle: 'italic',
  },
  responseBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#00B894',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  responseAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  responseBody: {
    fontSize: 12,
    color: '#166534',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  dateText: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  // Modal Common
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 540,
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
