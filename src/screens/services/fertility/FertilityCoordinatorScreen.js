import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dedicatedCareCoordinator } from '../../../data/fertilityData';
import { CoordinatorCard } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    sender: 'coordinator',
    text: 'Hello Ananya! I am Swathi, your dedicated fertility care navigator. I am here to help you with scan appointments, injection timings, lab updates, and emotional wellness check-ins.',
    time: '10:00 AM',
  },
  {
    id: 'm2',
    sender: 'coordinator',
    text: 'Please remember to administer your trigger shot tonight at 09:00 PM sharp. Let me know if you have any questions!',
    time: '10:02 AM',
  },
];

const QUICK_QUESTIONS = [
  'Confirm scan timing for tomorrow',
  'What diet is best before egg retrieval?',
  'Help with insurance pre-auth form',
  'Schedule emotional wellness call',
];

const FertilityCoordinatorScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const coordinator = dedicatedCareCoordinator;
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      time: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // Coordinator automatic reply simulation
    setTimeout(() => {
      const coordinatorReply = {
        id: `c-${Date.now()}`,
        sender: 'coordinator',
        text: `Thank you Ananya! I have noted your message regarding "${text.trim()}". I am coordinating with Dr. Priya's clinical team and will update your file within 15 minutes.`,
        time: 'Just now',
      };
      setMessages((prev) => [...prev, coordinatorReply]);
    }, 800);
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
          <Text style={styles.headerTitle}>Fertility Care Coordinator</Text>
          <Text style={styles.headerSubtitle}>
            {coordinator.name} • Active Now
          </Text>
        </View>
        <TouchableOpacity
          style={styles.callHeaderBtn}
          onPress={() => Linking.openURL(`tel:${coordinator.phone}`)}
        >
          <Ionicons name="call" size={18} color="#059669" />
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
        {/* Profile Card */}
        <CoordinatorCard
          coordinator={coordinator}
          onCall={() => Linking.openURL(`tel:${coordinator.phone}`)}
          onChat={() => {}}
          onScheduleCall={() =>
            showAlert('Call Scheduled', 'Coordinator Swathi will call you today at 04:30 PM.')
          }
        />

        {/* Live Conversation Window */}
        <View style={styles.chatCard}>
          <View style={styles.chatHeader}>
            <View style={styles.chatDot} />
            <Text style={styles.chatHeaderTitle}>Direct Counselor Chat</Text>
          </View>

          <View style={styles.messageList}>
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <View
                  key={m.id}
                  style={[
                    styles.msgBubble,
                    isUser ? styles.msgBubbleUser : styles.msgBubbleCoordinator,
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      isUser ? styles.msgTextUser : styles.msgTextCoordinator,
                    ]}
                  >
                    {m.text}
                  </Text>
                  <Text
                    style={[
                      styles.msgTime,
                      isUser ? styles.msgTimeUser : styles.msgTimeCoordinator,
                    ]}
                  >
                    {m.time}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Suggested Quick Prompt Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickChipsRow}
          >
            {QUICK_QUESTIONS.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickChip}
                onPress={() => handleSendMessage(q)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask coordinator Swathi anything..."
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => handleSendMessage()}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
    marginTop: 1,
  },
  callHeaderBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  chatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    marginBottom: 12,
  },
  chatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  chatHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  messageList: {
    gap: 10,
    marginBottom: 12,
  },
  msgBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 14,
  },
  msgBubbleCoordinator: {
    alignSelf: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  msgBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#E11D48',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextCoordinator: {
    color: '#1E293B',
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeCoordinator: {
    color: '#94A3B8',
  },
  msgTimeUser: {
    color: '#FFE4E6',
  },
  quickChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  quickChipText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 8,
  },
  sendBtn: {
    backgroundColor: '#E11D48',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FertilityCoordinatorScreen;
