import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sampleFertilityNotifications } from '../../../data/fertilityData';
import { NotificationCard, EmptyState } from '../../../components/fertility';
import WebFooter from '../../../components/web/WebFooter';

const FILTER_TABS = ['All', 'medication', 'appointment', 'report', 'coordinator'];

const FertilityNotificationsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [notifications, setNotifications] = useState(sampleFertilityNotifications);
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    return n.type === activeFilter;
  });

  const handleMarkRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FertilityIvf')}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fertility Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.filter((n) => n.unread).length} Unread Reminders & Updates
          </Text>
        </View>
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabsRow}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                activeFilter === tab && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === tab && styles.filterChipTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notifications List */}
        <View style={styles.listWrap}>
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                onMarkRead={handleMarkRead}
                onPress={(item) => {
                  handleMarkRead(item.id);
                  if (item.type === 'medication') navigation.navigate('IUIJourney');
                  else if (item.type === 'report') navigation.navigate('FertilityRecords');
                  else if (item.type === 'coordinator') navigation.navigate('FertilityCoordinator');
                  else navigation.navigate('IVFJourney');
                }}
              />
            ))
          ) : (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications here"
              subtitle="You are all caught up on medication doses and scan alerts."
            />
          )}
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  filterTabsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listWrap: {
    gap: 2,
  },
});

export default FertilityNotificationsScreen;
