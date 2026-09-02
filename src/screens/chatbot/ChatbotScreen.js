import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

const initialMessages = [
  {
    id: '1',
    sender: 'bot',
    text: 'Hello! I am MediUnify Health Assistant. How can I help you today?',
  },
];

const healthAnswers = {
  fever:
    'Fever can occur with infections and other conditions. Rest, drink enough fluids, and monitor your temperature. Seek medical care if the fever is severe, persistent, or accompanied by concerning symptoms.',

  headache:
    'Headaches can have many causes such as dehydration, stress, lack of sleep, or illness. Rest, hydrate, and monitor your symptoms. Seek medical attention for a sudden severe headache or headache with neurological symptoms.',

  cough:
    'A cough can occur with infections, allergies, asthma, or other conditions. Stay hydrated and monitor how long it lasts. Contact a healthcare professional if it is severe, persistent, or associated with breathing difficulty.',

  cold:
    'Common cold symptoms usually improve with rest, fluids, and supportive care. Seek medical advice if symptoms become severe or do not improve.',

  diabetes:
    'Diabetes is a condition that affects blood glucose levels. Regular monitoring, healthy eating, physical activity, and medical follow-up are important. A doctor should guide diagnosis and treatment.',

  bloodpressure:
    'Blood pressure should be interpreted using proper measurements and your medical history. Regular monitoring and medical follow-up are important, especially if readings are consistently high or low.',

  stomach:
    'Stomach pain can have many causes. Consider the location, severity, duration, and associated symptoms. Seek urgent medical care for severe pain, persistent vomiting, blood in stool or vomit, or other serious symptoms.',

  emergency:
    'For a medical emergency such as severe breathing difficulty, chest pain, loss of consciousness, severe bleeding, or a serious injury, contact your local emergency service or go to the nearest emergency department immediately.',
};

const getHealthResponse = (question) => {
  const text = question.toLowerCase();

  if (
    text.includes('fever') ||
    text.includes('temperature')
  ) {
    return healthAnswers.fever;
  }

  if (
    text.includes('headache') ||
    text.includes('head pain')
  ) {
    return healthAnswers.headache;
  }

  if (
    text.includes('cough') ||
    text.includes('coughing')
  ) {
    return healthAnswers.cough;
  }

  if (
    text.includes('cold') ||
    text.includes('runny nose')
  ) {
    return healthAnswers.cold;
  }

  if (
    text.includes('diabetes') ||
    text.includes('blood sugar')
  ) {
    return healthAnswers.diabetes;
  }

  if (
    text.includes('blood pressure') ||
    text.includes('bp')
  ) {
    return healthAnswers.bloodpressure;
  }

  if (
    text.includes('stomach') ||
    text.includes('abdominal')
  ) {
    return healthAnswers.stomach;
  }

  if (
    text.includes('emergency') ||
    text.includes('urgent') ||
    text.includes('chest pain') ||
    text.includes('breathing')
  ) {
    return healthAnswers.emergency;
  }

  return 'I can provide general health information, but I cannot diagnose conditions or replace a healthcare professional. Try asking about symptoms such as fever, headache, cough, diabetes, blood pressure, or stomach pain.';
};

const ChatbotScreen = ({ navigation }) => {
  const [messages, setMessages] =
    useState(initialMessages);

  const [input, setInput] = useState('');

  const sendMessage = () => {
    const question = input.trim();

    if (!question) {
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: question,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setInput('');

    setTimeout(() => {
      const botMessage = {
        id:
          `${Date.now()}-bot`,
        sender: 'bot',
        text: getHealthResponse(question),
      };

      setMessages((previous) => [
        ...previous,
        botMessage,
      ]);
    }, 500);
  };

  const renderMessage = ({ item }) => {
    const isUser =
      item.sender === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser &&
            styles.userMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.botIcon}>
            <Ionicons
              name="medical-outline"
              size={18}
              color="#FFFFFF"
            />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser &&
              styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser &&
                styles.userMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#263238"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>

          <View style={styles.headerIcon}>
            <Ionicons
              name="medical-outline"
              size={20}
              color="#FFFFFF"
            />
          </View>

          <View>
            <Text style={styles.headerTitle}>
              MediUnify Assistant
            </Text>

            <Text style={styles.headerStatus}>
              Health information assistant
            </Text>
          </View>

        </View>

        <View style={styles.headerSpace} />

      </View>

      {/* CHAT */}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <FlatList
          data={messages}
          keyExtractor={(item) =>
            item.id
          }
          renderItem={
            renderMessage
          }
          contentContainerStyle={
            styles.messagesList
          }
          showsVerticalScrollIndicator={
            false
          }
        />

        {/* INPUT */}

        <View style={styles.inputArea}>

          <TextInput
            style={styles.input}
            placeholder="Ask a health question..."
            placeholderTextColor="#90A4AE"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={
              sendMessage
            }
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>

        </View>

      </KeyboardAvoidingView>

      {/* DISCLAIMER */}

      <View style={styles.disclaimer}>

        <Ionicons
          name="information-circle-outline"
          size={15}
          color="#78909C"
        />

        <Text style={styles.disclaimerText}>
          General health information only. This assistant
          does not diagnose or replace a doctor.
        </Text>

      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEFF1',
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#263238',
  },

  headerStatus: {
    fontSize: 10,
    color: '#78909C',
    marginTop: 3,
  },

  headerSpace: {
    width: 42,
  },

  chatContainer: {
    flex: 1,
  },

  messagesList: {
    padding: 16,
    paddingBottom: 15,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 13,
  },

  userMessageRow: {
    justifyContent: 'flex-end',
  },

  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  messageBubble: {
    maxWidth: '78%',
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },

  userBubble: {
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 5,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#263238',
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF1',
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: '#F4F7F9',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 10,
    fontSize: 14,
    color: '#263238',
    marginRight: 8,
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  disclaimer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  disclaimerText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 9,
    lineHeight: 13,
    color: '#78909C',
  },

});

export default ChatbotScreen;