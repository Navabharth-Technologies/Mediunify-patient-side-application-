import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CoordinatorCard = ({
  coordinator,
  onCall,
  onChat,
  onScheduleCall,
}) => {
  if (!coordinator) return null;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Image source={{ uri: coordinator.avatar }} style={styles.avatar} />
        <View style={styles.infoCol}>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={11} color="#059669" />
              <Text style={styles.verifiedText}>DEDICATED CARE BUDDY</Text>
            </View>
          </View>
          <Text style={styles.name}>{coordinator.name}</Text>
          <Text style={styles.role}>{coordinator.role}</Text>
          <Text style={styles.clinic}>{coordinator.clinic}</Text>
        </View>
      </View>

      <Text style={styles.bio}>{coordinator.bio}</Text>

      <View style={styles.availabilityRow}>
        <Ionicons name="time-outline" size={13} color="#64748B" />
        <Text style={styles.availText}>{coordinator.availability}</Text>
      </View>

      <View style={styles.actionsRow}>
        {onChat && (
          <TouchableOpacity
            style={styles.chatBtn}
            onPress={onChat}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles" size={15} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>Chat Now</Text>
          </TouchableOpacity>
        )}

        {onCall && (
          <TouchableOpacity
            style={styles.callBtn}
            onPress={onCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call-outline" size={15} color="#0F172A" />
            <Text style={styles.callBtnText}>Direct Call</Text>
          </TouchableOpacity>
        )}

        {onScheduleCall && (
          <TouchableOpacity
            style={styles.schedBtn}
            onPress={onScheduleCall}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={15} color="#7C3AED" />
            <Text style={styles.schedBtnText}>Schedule Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#FFE4E6',
  },
  infoCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  role: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
    marginTop: 1,
  },
  clinic: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  availText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chatBtn: {
    flex: 1.2,
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  schedBtn: {
    flex: 1.1,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  schedBtnText: {
    color: '#7C3AED',
    fontWeight: '700',
    fontSize: 11,
  },
});

export default CoordinatorCard;
