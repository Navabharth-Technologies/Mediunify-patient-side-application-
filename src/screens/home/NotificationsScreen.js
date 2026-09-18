import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const NOTIFICATIONS_DATA = [
  {
    id: 'notif-1',
    category: 'Bookings',
    title: 'Doctor Appointment Confirmed',
    message: 'Dr. Ananya Rao (Senior Cardiologist) has confirmed your physical consultation for today at 04:30 PM. Location: MediUnify Heart Clinic, Mysuru.',
    time: '12m ago',
    unread: true,
    icon: 'calendar',
    iconColor: '#00B894',
    iconBg: '#E6F9F4',
    route: 'Bookings',
    ctaText: 'View Appointment',
  },
  {
    id: 'notif-2',
    category: 'Pharmacy',
    title: 'Jan Aushadhi Medicine Order Dispatched',
    message: 'Order #MU-8842 with 3 items has been dispatched from Apollo Care Center. Live tracking shows delivery within 30 minutes.',
    time: '45m ago',
    unread: true,
    icon: 'cart',
    iconColor: '#3B82F6',
    iconBg: '#EFF6FF',
    route: 'Pharmacy',
    ctaText: 'Track Order',
  },
  {
    id: 'notif-3',
    category: 'Lab Reports',
    title: 'NABL Certified Diagnostic Report Ready',
    message: 'Your Full Body Health Checkup (68 Vital Parameters) digital pathology report is ready for download with certified doctor remarks.',
    time: '2 hours ago',
    unread: true,
    icon: 'document-text',
    iconColor: '#0EA5E9',
    iconBg: '#F0F9FF',
    route: 'LabTests',
    ctaText: 'View Report',
  },
  {
    id: 'notif-4',
    category: 'Wallet',
    title: '₹150 MediCoins Credited',
    message: 'You earned 150 MediCoins reward points on your recent teleconsultation booking. They have been credited to your MediUnify Care Wallet.',
    time: 'Yesterday',
    unread: false,
    icon: 'wallet',
    iconColor: '#8B5CF6',
    iconBg: '#F5F3FF',
    route: 'Wallet',
    ctaText: 'View Wallet',
  },
  {
    id: 'notif-5',
    category: 'Bookings',
    title: 'Upcoming Video Follow-Up Reminder',
    message: 'Follow-up video consultation with Dr. Arvind Menon (General Physician) is scheduled for tomorrow at 11:00 AM.',
    time: '2 days ago',
    unread: false,
    icon: 'videocam',
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    route: 'Bookings',
    ctaText: 'Consultation Details',
  },
];

const TABS = ['All', 'Unread', 'Bookings', 'Pharmacy', 'Lab Reports', 'Wallet'];

const NotificationsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DATA);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Unread') return n.unread;
    return n.category === activeTab;
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id, route) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    if (route && navigation?.navigate) {
      navigation.navigate(route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrap}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation?.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.title}>Notifications</Text>
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount} New</Text>
                  </View>
                )}
              </View>
              <Text style={styles.subtitle}>
                Stay updated with your appointments, medicines, lab tests and health wallet
              </Text>
            </View>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllAsRead}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-done" size={16} color="#00B894" />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const count =
                tab === 'All'
                  ? notifications.length
                  : tab === 'Unread'
                  ? unreadCount
                  : notifications.filter((n) => n.category === tab).length;

              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {count > 0 && (
                    <View
                      style={[
                        styles.tabCountPill,
                        isActive && styles.tabCountPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabCountText,
                          isActive && styles.tabCountTextActive,
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={38} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No notifications here</Text>
              <Text style={styles.emptySubtitle}>
                You are all caught up! New updates on your healthcare activity will appear here.
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.card, notif.unread && styles.cardUnread]}
                onPress={() => markAsRead(notif.id, notif.route)}
                activeOpacity={0.88}
              >
                <View style={[styles.cardIconBox, { backgroundColor: notif.iconBg }]}>
                  <Ionicons name={notif.icon} size={22} color={notif.iconColor} />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.badgeRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{notif.category}</Text>
                      </View>
                      {notif.unread && <View style={styles.cardUnreadDot} />}
                    </View>
                    <Text style={styles.cardTime}>{notif.time}</Text>
                  </View>

                  <Text style={styles.cardTitle}>{notif.title}</Text>
                  <Text style={styles.cardMessage}>{notif.message}</Text>

                  {notif.ctaText && (
                    <View style={styles.cardFooter}>
                      <View style={styles.ctaBtn}>
                        <Text style={styles.ctaText}>{notif.ctaText}</Text>
                        <Ionicons name="arrow-forward" size={13} color="#00B894" />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  unreadBadge: {
    backgroundColor: '#00B894',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  markAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },

  // Tabs
  tabsRow: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabsScrollContent: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabCountPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  tabCountPillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabCountText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#FFFFFF',
  },

  // Scroll List
  scrollList: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.18s ease' } : {}),
  },
  cardUnread: {
    backgroundColor: '#F8FDFA',
    borderColor: '#A7F3D0',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  cardUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B894',
  },
  cardTime: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 19,
  },
});

export default NotificationsScreen;