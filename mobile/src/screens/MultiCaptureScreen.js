import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';

// Define the fields to capture
const CAPTURE_FIELDS = [
  {
    id: 'name',
    label: 'Product Name',
    instruction: 'Capture the product/brand name clearly',
    required: true,
    icon: 'label',
  },
  {
    id: 'mg',
    label: 'Nicotine Strength (mg)',
    instruction: 'Focus on the mg value (e.g., "3mg", "6mg")',
    required: false,
    icon: 'science',
  },
  {
    id: 'bottleSize',
    label: 'Bottle Size',
    instruction: 'Capture the ml/size (e.g., "30ml", "60ml")',
    required: false,
    icon: 'straighten',
  },
  {
    id: 'batchNumber',
    label: 'Batch Number',
    instruction: 'Capture batch/lot number if visible',
    required: false,
    icon: 'numbers',
  },
  {
    id: 'expirationDate',
    label: 'Expiration Date',
    instruction: 'Focus on the expiration/best before date',
    required: true,
    icon: 'event',
  },
];

const MultiCaptureScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [flashMode, setFlashMode] = useState('off');
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [capturedImages, setCapturedImages] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const currentField = CAPTURE_FIELDS[currentFieldIndex];
  const isLastField = currentFieldIndex === CAPTURE_FIELDS.length - 1;
  const allRequiredCaptured = CAPTURE_FIELDS
    .filter(f => f.required)
    .every(f => capturedImages[f.id]);

  React.useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.9,
          base64: false,
        });
        
        // Store the captured image for this field
        setCapturedImages(prev => ({
          ...prev,
          [currentField.id]: photo.uri,
        }));

        setShowPreview(true);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      }
    }
  };

  const handleRetake = () => {
    setCapturedImages(prev => {
      const updated = { ...prev };
      delete updated[currentField.id];
      return updated;
    });
    setShowPreview(false);
  };

  const handleNext = () => {
    setShowPreview(false);
    if (isLastField) {
      handleComplete();
    } else {
      setCurrentFieldIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentField.required) {
      Alert.alert('Required Field', 'This field is required. Please capture an image.');
      return;
    }
    setShowPreview(false);
    if (isLastField) {
      handleComplete();
    } else {
      setCurrentFieldIndex(prev => prev + 1);
    }
  };

  const handleComplete = () => {
    if (!allRequiredCaptured) {
      Alert.alert('Missing Required Fields', 'Please capture all required fields before continuing.');
      return;
    }
    // Navigate to review screen with all captured images
    navigation.navigate('ReviewCapture', { 
      imageUris: capturedImages,
      multiCapture: true,
    });
  };

  const handleGoBack = () => {
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
      setShowPreview(!!capturedImages[CAPTURE_FIELDS[currentFieldIndex - 1].id]);
    } else {
      navigation.goBack();
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
      {!showPreview ? (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            flash={flashMode}
            ref={ref => setCameraRef(ref)}
          />
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.topButton}
              onPress={handleGoBack}
            >
              <MaterialIcons name="arrow-back" size={32} color="white" />
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

          {/* Progress indicator */}
          <View style={styles.progressBar}>
            <View style={styles.progressContainer}>
              {CAPTURE_FIELDS.map((field, index) => (
                <View
                  key={field.id}
                  style={[
                    styles.progressDot,
                    index === currentFieldIndex && styles.progressDotActive,
                    capturedImages[field.id] && styles.progressDotComplete,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {currentFieldIndex + 1} of {CAPTURE_FIELDS.length}
            </Text>
          </View>

          {/* Field info overlay */}
          <View style={styles.infoOverlay}>
            <View style={styles.infoBox}>
              <MaterialIcons name={currentField.icon} size={32} color="white" />
              <Text style={styles.fieldLabel}>
                {currentField.label} {currentField.required && '*'}
              </Text>
              <Text style={styles.fieldInstruction}>
                {currentField.instruction}
              </Text>
            </View>
          </View>

          {/* Focus frame */}
          <View style={styles.overlay}>
            <View style={styles.frame} />
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>
                {currentField.required ? 'Back' : 'Skip'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.skipButton} />
          </View>
        </>
      ) : (
        // Preview screen
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: capturedImages[currentField.id] }}
            style={styles.previewImage}
            resizeMode="contain"
          />
          
          <View style={styles.previewOverlay}>
            <View style={styles.previewInfo}>
              <MaterialIcons name={currentField.icon} size={24} color="white" />
              <Text style={styles.previewLabel}>{currentField.label}</Text>
            </View>
            
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={handleRetake}
              >
                <MaterialIcons name="refresh" size={24} color="white" />
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.previewButton, styles.previewButtonPrimary]}
                onPress={handleNext}
              >
                <MaterialIcons 
                  name={isLastField ? "check" : "arrow-forward"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.previewButtonText}>
                  {isLastField ? 'Complete' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 25,
    padding: 8,
  },
  progressBar: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: 'white',
    width: 12,
    height: 12,
  },
  progressDotComplete: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  infoOverlay: {
    position: 'absolute',
    top: 160,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  infoBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  fieldLabel: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  fieldInstruction: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
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
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    zIndex: 10,
  },
  skipButton: {
    width: 70,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  previewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  previewLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  previewButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
});

export default MultiCaptureScreen;
