import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { aiFertilityKnowledge } from '../../../data/fertilityData';
import WebFooter from '../../../components/web/WebFooter';

const PROMPT_CHIPS = [
  'What is an ideal AMH level?',
  'Difference between IUI and IVF?',
  'When should I take the trigger shot?',
  'Explain semen CASA analysis',
  'IVF nutrition & diet tips',
];

const INITIAL_CONVERSATION = [
  {
    id: 'ai-welcome',
    sender: 'ai',
    text: 'Hello! I am your MediUnify AI Fertility Assistant. I can explain diagnostic terms (AMH, DFI, AFC), compare treatments (IUI vs IVF), and offer compassionate pre-conception guidance.',
    time: 'Just now',
  },
];

const FertilityAIScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [chatMessages, setChatMessages] = useState(INITIAL_CONVERSATION);
  const [inputText, setInputText] = useState('');

  const findAiResponse = (userQuery) => {
    const qLower = userQuery.toLowerCase();
    for (const item of aiFertilityKnowledge) {
      if (item.keywords.some((kw) => qLower.includes(kw))) {
        return item.response;
      }
    }
    return 'Thank you for your question. Reproductive endocrinology is deeply personal to each couple’s unique hormonal profile. While healthy lifestyle and timed ovulation are fundamental, I recommend consulting our senior specialists for an individualized clinical roadmap.';
  };

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      time: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    // AI typing response
    setTimeout(() => {
      const responseText = findAiResponse(query.trim());
      const aiReply = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        time: 'Just now',
      };
      setChatMessages((prev) => [...prev, aiReply]);
    }, 600);
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
          <View style={styles.aiBadgeRow}>
            <Ionicons name="sparkles" size={14} color="#E11D48" />
            <Text style={styles.headerTitle}>MediUnify Fertility AI</Text>
          </View>
          <Text style={styles.headerSubtitle}>Clinical Insights & Compassionate Guidance</Text>
        </View>
        <TouchableOpacity
          style={styles.doctorCtaBtn}
          onPress={() => navigation.navigate('FertilitySpecialists')}
        >
          <Ionicons name="medkit-outline" size={16} color="#059669" />
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
        {/* Disclaimer Card */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.disclaimerText}>
            Medical Disclaimer: AI explanations are informational and do not replace personalized clinical diagnosis by a registered reproductive endocrinologist.
          </Text>
        </View>

        {/* Messages */}
        <View style={styles.messagesWrap}>
          {chatMessages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubbleWrap,
                  isAi ? styles.bubbleAiWrap : styles.bubbleUserWrap,
                ]}
              >
                {isAi && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    isAi ? styles.bubbleAi : styles.bubbleUser,
                  ]}
                >
                  <Text style={[styles.msgText, isAi ? styles.msgTextAi : styles.msgTextUser]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.msgTime, isAi ? styles.msgTimeAi : styles.msgTimeUser]}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Suggested Quick Prompts */}
        <Text style={styles.promptsHeading}>Common Questions:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.promptChipsRow}
        >
          {PROMPT_CHIPS.map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSendMessage(chip)}
              activeOpacity={0.8}
            >
              <Text style={styles.promptChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Interactive Doctor & Counselor Escalation Banner */}
        <View style={styles.escalationCard}>
          <Text style={styles.escTitle}>Need individualized medical advice?</Text>
          <Text style={styles.escSub}>
            Book a confidential 45-minute video or clinic consult with a senior specialist.
          </Text>
          <TouchableOpacity
            style={styles.escBtn}
            onPress={() => navigation.navigate('FertilitySpecialists')}
            activeOpacity={0.85}
          >
            <Ionicons name="calendar-outline" size={15} color="#FFFFFF" />
            <Text style={styles.escBtnText}>Find a Fertility Specialist</Text>
          </TouchableOpacity>
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Floating Chat Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask anything about AMH, IUI, IVF, egg freezing..."
          placeholderTextColor="#94A3B8"
          onSubmitEditing={() => handleSendMessage()}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => handleSendMessage()}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  doctorCtaBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  desktopContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 14,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 15,
  },
  messagesWrap: {
    gap: 12,
    marginBottom: 16,
  },
  bubbleWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  bubbleAiWrap: {
    alignSelf: 'flex-start',
  },
  bubbleUserWrap: {
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#E11D48',
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 19,
  },
  msgTextAi: {
    color: '#1E293B',
  },
  msgTextUser: {
    color: '#FFFFFF',
  },
  msgTime: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  msgTimeAi: {
    color: '#94A3B8',
  },
  msgTimeUser: {
    color: '#FFE4E6',
  },
  promptsHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  promptChipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  promptChip: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
  },
  promptChipText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '600',
  },
  escalationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  escTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  escSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
  },
  escBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  escBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E11D48',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FertilityAIScreen;
