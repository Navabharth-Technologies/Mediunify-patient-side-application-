import React from 'react';

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';


const ChatMessage = ({
  message,
  sender,
}) => {

  const isUser = sender === 'user';

  return (
    <View
      style={[
        styles.messageContainer,
        isUser
          ? styles.userContainer
          : styles.botContainer,
      ]}
    >

      {/* Bot Icon */}

      {!isUser && (
        <View style={styles.botIcon}>

          <Ionicons
            name="medical-outline"
            size={20}
            color="#1565C0"
          />

        </View>
      )}


      {/* Message */}

      <View
        style={[
          styles.messageBubble,
          isUser
            ? styles.userBubble
            : styles.botBubble,
        ]}
      >

        <Text
          style={[
            styles.messageText,
            isUser
              ? styles.userText
              : styles.botText,
          ]}
        >
          {message}
        </Text>

      </View>

    </View>
  );
};


const styles = StyleSheet.create({

  messageContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },

  userContainer: {
    justifyContent: 'flex-end',
  },

  botContainer: {
    justifyContent: 'flex-start',
  },

  botIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 17,
  },

  userBubble: {
    backgroundColor: '#1565C0',
    borderBottomRightRadius: 5,
  },

  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },

  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },

  userText: {
    color: '#FFFFFF',
  },

  botText: {
    color: '#263238',
  },

});

export default ChatMessage;