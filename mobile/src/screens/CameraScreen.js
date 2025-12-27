import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

const CameraScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [flashMode, setFlashMode] = useState('off');

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        // Navigate to review screen with the captured image
        navigation.navigate('ReviewCapture', { imageUri: photo.uri });
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const toggleFlash = () => {
    setFlashMode(current => current === 'off' ? 'on' : 'off');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        flash={flashMode}
        ref={ref => setCameraRef(ref)}
      />
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.topButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={32} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.topButton}
          onPress={toggleFlash}
        >
          <MaterialIcons 
            name={flashMode === 'on' ? 'flash-on' : 'flash-off'} 
            size={32} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.overlay}>
        <View style={styles.frame} />
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.instructionText}>
          Position bottle label within frame
        </Text>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePicture}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 40,
    zIndex: 10,
  },
  topButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  frame: {
    width: 300,
    height: 400,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
    alignItems: 'center',
    zIndex: 10,
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
  permissionButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
});

export default CameraScreen;
