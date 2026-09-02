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

import {
  useCart,
} from '../context/CartContext';

import colors from '../theme/colors';


const CartButton = ({
  navigation,
}) => {

  const {
    cartCount,
  } = useCart();


  return (

    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('Cart')
      }
    >

      <Ionicons
        name="cart-outline"
        size={27}
        color={colors.primary}
      />

      {cartCount > 0 && (

        <View
          style={styles.badge}
        >

          <Text
            style={styles.badgeText}
          >
            {cartCount > 99
              ? '99+'
              : cartCount}
          </Text>

        </View>

      )}

    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({

  container: {

    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor:
      colors.white,

    alignItems:
      'center',

    justifyContent:
      'center',

    elevation: 5,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.12,

    shadowRadius: 5,

  },

  badge: {

    position: 'absolute',

    right: -2,

    top: -2,

    minWidth: 20,

    height: 20,

    borderRadius: 10,

    backgroundColor:
      '#E53935',

    alignItems:
      'center',

    justifyContent:
      'center',

    paddingHorizontal: 4,

  },

  badgeText: {

    color: '#FFFFFF',

    fontSize: 10,

    fontWeight: '800',

  },

});


export default CartButton;