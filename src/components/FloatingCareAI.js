import React, { useRef } from 'react';

import {
  Animated,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  Dimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import colors from '../theme/colors';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');


const BUTTON_SIZE = 64;
const EDGE_MARGIN = 15;


const FloatingCareAI = ({ onPress }) => {

  // ==================================================
  // INITIAL POSITION
  // ==================================================

  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - BUTTON_SIZE - 20,
      y: SCREEN_HEIGHT - 190,
    })
  ).current;


  const currentPosition = useRef({
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: SCREEN_HEIGHT - 190,
  });


  const isDragging = useRef(false);


  // ==================================================
  // PAN RESPONDER
  // ==================================================

  const panResponder = useRef(

    PanResponder.create({

      onStartShouldSetPanResponder: () => true,

      onMoveShouldSetPanResponder: (
        _event,
        gestureState
      ) => {

        return (
          Math.abs(gestureState.dx) > 3 ||
          Math.abs(gestureState.dy) > 3
        );

      },


      onPanResponderGrant: () => {

        isDragging.current = false;

        pan.setOffset({
          x: currentPosition.current.x,
          y: currentPosition.current.y,
        });

        pan.setValue({
          x: 0,
          y: 0,
        });

      },


      onPanResponderMove: (
        _event,
        gestureState
      ) => {

        if (
          Math.abs(gestureState.dx) > 5 ||
          Math.abs(gestureState.dy) > 5
        ) {

          isDragging.current = true;

        }

        let newX =
          currentPosition.current.x +
          gestureState.dx;

        let newY =
          currentPosition.current.y +
          gestureState.dy;


        // --------------------------------------------
        // KEEP BUTTON INSIDE SCREEN
        // --------------------------------------------

        newX = Math.max(
          EDGE_MARGIN,
          Math.min(
            SCREEN_WIDTH -
              BUTTON_SIZE -
              EDGE_MARGIN,
            newX
          )
        );


        newY = Math.max(
          50,
          Math.min(
            SCREEN_HEIGHT -
              BUTTON_SIZE -
              80,
            newY
          )
        );


        pan.setValue({
          x:
            newX -
            currentPosition.current.x,

          y:
            newY -
            currentPosition.current.y,
        });

      },


      onPanResponderRelease: (
        _event,
        gestureState
      ) => {

        pan.flattenOffset();


        let finalX =
          currentPosition.current.x +
          gestureState.dx;

        let finalY =
          currentPosition.current.y +
          gestureState.dy;


        // --------------------------------------------
        // KEEP FINAL POSITION INSIDE SCREEN
        // --------------------------------------------

        finalX = Math.max(
          EDGE_MARGIN,
          Math.min(
            SCREEN_WIDTH -
              BUTTON_SIZE -
              EDGE_MARGIN,
            finalX
          )
        );


        finalY = Math.max(
          50,
          Math.min(
            SCREEN_HEIGHT -
              BUTTON_SIZE -
              80,
            finalY
          )
        );


        currentPosition.current = {
          x: finalX,
          y: finalY,
        };


        pan.setValue({
          x: finalX,
          y: finalY,
        });


        // --------------------------------------------
        // OPEN CHAT ONLY IF IT WAS A TAP
        // --------------------------------------------

        if (!isDragging.current) {

          if (onPress) {
            onPress();
          }

        }


        isDragging.current = false;

      },

    })

  ).current;


  // ==================================================
  // UI
  // ==================================================

  return (

    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateX: pan.x,
            },
            {
              translateY: pan.y,
            },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {

          if (!isDragging.current && onPress) {
            onPress();
          }

        }}
        style={styles.button}
      >

        {/* AI ICON */}

        <View style={styles.iconCircle}>

          <Ionicons
            name="sparkles"
            size={27}
            color={colors.white}
          />

        </View>


        {/* CHAT SYMBOL */}

        <View style={styles.chatBadge}>

          <Ionicons
            name="chatbubble"
            size={13}
            color={colors.secondary}
          />

        </View>

      </TouchableOpacity>


      {/* AI LABEL */}

      <View style={styles.label}>

        <Text style={styles.labelText}>
          AI Care
        </Text>

      </View>

    </Animated.View>

  );

};


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  container: {

    position: 'absolute',

    left: 0,

    top: 0,

    width: BUTTON_SIZE,

    height: BUTTON_SIZE,

    zIndex: 9999,

    elevation: 9999,

  },


  button: {

    width: BUTTON_SIZE,

    height: BUTTON_SIZE,

    borderRadius: BUTTON_SIZE / 2,

    backgroundColor:
      colors.secondary,

    borderWidth: 2,

    borderColor:
      colors.accent,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 15,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 5,
    },

    shadowOpacity: 0.3,

    shadowRadius: 8,

  },


  iconCircle: {

    width: 42,

    height: 42,

    borderRadius: 21,

    alignItems: 'center',

    justifyContent: 'center',

  },


  chatBadge: {

    position: 'absolute',

    right: 4,

    bottom: 4,

    width: 22,

    height: 22,

    borderRadius: 11,

    backgroundColor:
      colors.accent,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor:
      colors.secondary,

  },


  label: {

    position: 'absolute',

    top: 67,

    alignSelf: 'center',

    backgroundColor:
      colors.secondary,

    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: 8,

  },


  labelText: {

    color: colors.white,

    fontSize: 9,

    fontWeight: '800',

  },

});


export default FloatingCareAI;