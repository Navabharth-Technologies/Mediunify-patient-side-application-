import React, { useRef, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '../../../utils/alert';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

// Web-safe dynamic MediaLibrary import
let MediaLibrary = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  MediaLibrary = null;
}

import { Ionicons } from '@expo/vector-icons';


const ImagingScreen = ({ navigation }) => {

  const cameraRef = useRef(null);

  const [cameraPermission, requestCameraPermission] =
    useCameraPermissions();

  const [mediaPermission, setMediaPermission] =
    useState(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [saving, setSaving] =
    useState(false);


  // --------------------------------------------------
  // REQUEST GALLERY PERMISSION
  // --------------------------------------------------

  const requestGalleryPermission = async () => {

    const permission =
      await MediaLibrary.requestPermissionsAsync();

    setMediaPermission(
      permission
    );

    return permission.granted;
  };


  // --------------------------------------------------
  // TAKE PHOTO
  // --------------------------------------------------

  const takePhoto = async () => {

    if (!cameraRef.current) {

      showAlert(
        'Camera Error',
        'Camera is not ready yet.'
      );

      return;
    }


    if (!cameraReady) {

      showAlert(
        'Camera Not Ready',
        'Please wait for the camera to become ready.'
      );

      return;
    }


    try {

      setSaving(true);


      // Make sure gallery permission exists

      let galleryGranted =
        mediaPermission?.granted;


      if (!galleryGranted) {

        galleryGranted =
          await requestGalleryPermission();

      }


      if (!galleryGranted) {

        showAlert(
          'Gallery Permission Required',
          'Please allow photo library access so MediUnify can save the captured image.'
        );

        setSaving(false);

        return;
      }


      // Take photo

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 1,
          skipProcessing: false,
        });


      if (!photo?.uri) {

        throw new Error(
          'Photo URI not available'
        );
      }


      console.log(
        'Captured image:',
        photo.uri
      );


      // Save image to phone gallery

      const asset =
        await MediaLibrary.createAssetAsync(
          photo.uri
        );


      console.log(
        'Saved gallery asset:',
        asset
      );


      showAlert(
        'Photo Saved',
        'The captured image has been saved to your gallery.'
      );


    } catch (error) {

      console.log(
        'Camera / Gallery Error:',
        error
      );


      showAlert(
        'Unable to Save Photo',
        'Something went wrong while capturing or saving the image.'
      );

    } finally {

      setSaving(false);

    }
  };


  // --------------------------------------------------
  // CAMERA PERMISSION
  // --------------------------------------------------

  if (!cameraPermission) {

    return (
      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.centerContainer}
        >

          <ActivityIndicator
            size="large"
            color="#1976D2"
          />

          <Text
            style={styles.loadingText}
          >
            Preparing camera...
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  if (!cameraPermission.granted) {

    return (
      <SafeAreaView
        style={styles.container}
      >

        <View
          style={styles.permissionContainer}
        >

          <View
            style={styles.permissionIcon}
          >

            <Ionicons
              name="camera-outline"
              size={45}
              color="#1976D2"
            />

          </View>


          <Text
            style={styles.permissionTitle}
          >
            Camera Permission
          </Text>


          <Text
            style={styles.permissionText}
          >
            MediUnify needs access to your camera so you can capture medical documents, reports, prescriptions, and scan images.
          </Text>


          <TouchableOpacity
            style={styles.permissionButton}
            onPress={
              requestCameraPermission
            }
          >

            <Ionicons
              name="camera-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={styles.permissionButtonText}
            >
              Allow Camera
            </Text>

          </TouchableOpacity>


          <TouchableOpacity
            style={styles.backTextButton}
            onPress={() =>
              navigation.goBack()
            }
          >

            <Text
              style={styles.backText}
            >
              Go Back
            </Text>

          </TouchableOpacity>

        </View>

      </SafeAreaView>
    );
  }


  // --------------------------------------------------
  // CAMERA SCREEN
  // --------------------------------------------------

  return (
    <SafeAreaView
      style={styles.container}
    >

      {/* HEADER */}

      <View
        style={styles.header}
      >

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="arrow-back"
            size={25}
            color="#FFFFFF"
          />

        </TouchableOpacity>


        <View
          style={styles.headerContent}
        >

          <Text
            style={styles.headerTitle}
          >
            Imaging & Scan
          </Text>

          <Text
            style={styles.headerSubtitle}
          >
            Capture medical documents
          </Text>

        </View>

      </View>


      {/* CAMERA */}

      <View
        style={styles.cameraContainer}
      >

        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() =>
            setCameraReady(true)
          }
        >

          {/* SCAN FRAME */}

          <View
            style={styles.scanFrame}
          >

            <View
              style={[
                styles.corner,
                styles.topLeft,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.topRight,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomLeft,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomRight,
              ]}
            />

          </View>


          {/* CAMERA MESSAGE */}

          <View
            style={styles.cameraMessage}
          >

            <Ionicons
              name="scan-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={styles.cameraMessageText}
            >
              Position the document inside the frame
            </Text>

          </View>

        </CameraView>

      </View>


      {/* BOTTOM CONTROLS */}

      <View
        style={styles.bottomContainer}
      >

        <Text
          style={styles.instructionTitle}
        >
          Capture Medical Image
        </Text>


        <Text
          style={styles.instructionText}
        >
          You can capture prescriptions, lab reports, medical documents, or other healthcare images.
        </Text>


        {/* CAPTURE BUTTON */}

        <TouchableOpacity
          style={[
            styles.captureButton,
            (!cameraReady || saving) &&
              styles.disabledButton,
          ]}
          activeOpacity={0.8}
          disabled={
            !cameraReady || saving
          }
          onPress={takePhoto}
        >

          {saving ? (

            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />

          ) : (

            <Ionicons
              name="camera"
              size={30}
              color="#FFFFFF"
            />

          )}

        </TouchableOpacity>


        <Text
          style={styles.captureText}
        >
          {saving
            ? 'Saving photo...'
            : 'Take Photo'}
        </Text>

      </View>

    </SafeAreaView>
  );
};


// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#000000',
  },


  // HEADER

  header: {
    height: 75,
    paddingHorizontal: 18,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerContent: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  headerSubtitle: {
    marginTop: 3,
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 11,
  },


  // CAMERA

  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


  // SCAN FRAME

  scanFrame: {
    width: '80%',
    height: '58%',
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderColor: '#FFFFFF',
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },


  // CAMERA MESSAGE

  cameraMessage: {
    position: 'absolute',
    bottom: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor:
      'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
  },

  cameraMessageText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },


  // BOTTOM

  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    alignItems: 'center',
  },

  instructionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
  },

  instructionText: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color: '#78909C',
    textAlign: 'center',
    maxWidth: 330,
  },


  // CAPTURE

  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    borderWidth: 5,
    borderColor: '#E8F1FF',
  },

  disabledButton: {
    opacity: 0.5,
  },

  captureText: {
    marginTop: 7,
    fontSize: 12,
    fontWeight: '700',
    color: '#1976D2',
  },


  // PERMISSION

  permissionContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },

  permissionIcon: {
    width: 90,
    height: 90,
    borderRadius: 25,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  permissionTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#263238',
  },

  permissionText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: '#78909C',
    textAlign: 'center',
  },

  permissionButton: {
    marginTop: 25,
    height: 52,
    paddingHorizontal: 25,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  permissionButtonText: {
    marginLeft: 7,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  backTextButton: {
    marginTop: 18,
    padding: 10,
  },

  backText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '700',
  },


  // LOADING

  centerContainer: {
    flex: 1,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#607D8B',
    fontSize: 14,
  },

});

export default ImagingScreen;