import React from 'react';

import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import colors from '../theme/colors';


const PharmacyCategoryCard = ({
  category,
  onPress,
}) => {

  return (

    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
    >

      <View
        style={styles.iconContainer}
      >

        <Ionicons
          name={category.icon}
          size={28}
          color={colors.primary}
        />

      </View>

      <Text
        style={styles.name}
        numberOfLines={2}
      >
        {category.name}
      </Text>

      <Text
        style={styles.description}
        numberOfLines={2}
      >
        {category.description}
      </Text>

    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({

  card: {

    width: '47%',

    backgroundColor:
      colors.white,

    borderRadius: 18,

    padding: 15,

    marginBottom: 14,

    borderWidth: 1,

    borderColor:
      colors.border,

  },

  iconContainer: {

    width: 52,

    height: 52,

    borderRadius: 16,

    backgroundColor:
      '#EAF4F5',

    alignItems:
      'center',

    justifyContent:
      'center',

    marginBottom: 10,

  },

  name: {

    fontSize: 15,

    fontWeight: '800',

    color:
      '#1D2939',

    marginBottom: 5,

  },

  description: {

    fontSize: 11,

    lineHeight: 16,

    color:
      colors.secondary,

  },

});


export default PharmacyCategoryCard;