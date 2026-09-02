import React from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import {
  Ionicons,
} from '@expo/vector-icons';

import colors from '../theme/colors';


const QuantitySelector = ({
  quantity,
  onIncrease,
  onDecrease,
}) => {

  return (

    <View
      style={styles.container}
    >

      <TouchableOpacity
        style={styles.button}
        onPress={onDecrease}
      >

        <Ionicons
          name="remove"
          size={20}
          color={colors.primary}
        />

      </TouchableOpacity>


      <Text
        style={styles.quantity}
      >
        {quantity}
      </Text>


      <TouchableOpacity
        style={styles.button}
        onPress={onIncrease}
      >

        <Ionicons
          name="add"
          size={20}
          color={colors.primary}
        />

      </TouchableOpacity>

    </View>
  );
};


const styles = StyleSheet.create({

  container: {

    height: 42,

    borderRadius: 12,

    backgroundColor:
      '#EAF4F5',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    paddingHorizontal: 5,

    width: 125,

  },

  button: {

    width: 34,

    height: 34,

    borderRadius: 9,

    backgroundColor:
      colors.white,

    alignItems:
      'center',

    justifyContent:
      'center',

  },

  quantity: {

    fontSize: 16,

    fontWeight: '900',

    color:
      '#1D2939',

  },

});


export default QuantitySelector;