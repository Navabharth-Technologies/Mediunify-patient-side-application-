import React from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Search healthcare services...',
}) => {
  return (
    <View style={styles.container}>

      <Text style={styles.icon}>
        🔍
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  icon: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 13,
    color: '#263238',
  },
});

export default SearchBar;