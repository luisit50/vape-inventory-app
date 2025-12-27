import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button, Text, Chip } from 'react-native-paper';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { extractBottleData, extractMultiFieldData } from '../services/ocrService';
import { inventoryAPI } from '../services/api';
import syncService from '../services/syncService';
import { AuthContext } from '../contexts/AuthContext';

const ReviewCaptureScreen = ({ navigation, route }) => {
  const { token } = useContext(AuthContext);
  // Add your state and effect hooks here
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    mg: '',
    bottleSize: '',
    batchNumber: '',
    expirationDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [multiCapture, setMultiCapture] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageUris, setImageUris] = useState(null);
  const [rawTexts, setRawTexts] = useState({});
  const [showRawTexts, setShowRawTexts] = useState(false);


  // On mount, extract image(s) from route and run OCR/AI extraction
  useEffect(() => {
    if (route && route.params) {
      const { imageUri: navImageUri, imageUris: navImageUris, multiCapture: navMultiCapture } = route.params;
      if (navMultiCapture && navImageUris) {
        setMultiCapture(true);
        setImageUris(navImageUris);
        setLoading(true);
        // Run multi-field OCR/AI extraction
        extractMultiFieldData(navImageUris, true)
          .then(result => {
            setFormData({
              name: result.name || '',
              brand: result.brand || '',
              mg: result.mg || '',
              bottleSize: result.bottleSize || '',
              batchNumber: result.batchNumber || '',
              expirationDate: result.expirationDate || '',
            });
            setRawTexts(result.rawTexts || {});
          })
          .catch(err => {
            Alert.alert('OCR Error', 'Failed to extract text from images. You can enter details manually.');
          })
          .finally(() => setLoading(false));
      } else if (navImageUri) {
        setMultiCapture(false);
        setImageUri(navImageUri);
        setLoading(true);
        // Run single-image OCR/AI extraction
        extractBottleData(navImageUri, true)
          .then(result => {
            setFormData({
              name: result.name || '',
              brand: result.brand || '',
              mg: result.mg || '',
              bottleSize: result.bottleSize || '',
              batchNumber: result.batchNumber || '',
              expirationDate: result.expirationDate || '',
            });
            setRawTexts(result.rawTexts || {});
          })
          .catch(err => {
            Alert.alert('OCR Error', 'Failed to extract text from image. You can enter details manually.');
          })
          .finally(() => setLoading(false));
      }
    }
  }, [route]);

  const handleSave = async () => {
    if (!formData.name || !formData.expirationDate) {
      Alert.alert('Error', 'Please fill in at least name and expiration date');
      return;
    }
    setSaving(true);
    try {
      const isOnline = await syncService.checkConnection();
      const bottleData = {
        ...formData,
        capturedAt: new Date().toISOString(),
      };
      if (isOnline) {
        await inventoryAPI.createBottle(bottleData, token);
        Alert.alert('Success', 'Bottle added to inventory');
      } else {
        Alert.alert('Saved Offline', 'Bottle will sync when online');
      }
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save bottle');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Extracting bottle information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
      {multiCapture && imageUris ? (
        // Show field-specific images
        <ScrollView horizontal style={styles.imageGallery} showsHorizontalScrollIndicator={false}>
          {Object.entries(imageUris).map(([field, uri]) => (
            <View key={field} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.thumbnailImage} />
              <Text style={styles.imageLabel}>{field}</Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        // Show single image
        <Image source={{ uri: imageUri }} style={styles.image} />
      )}
      
      <View style={styles.form}>
        <View style={styles.header}>
          <Text style={styles.title}>Review & Edit Bottle Information</Text>
          {multiCapture && (
            <Chip 
              icon="check-circle" 
              mode="flat"
              style={styles.multiCaptureChip}
            >
              Multi-Capture
            </Chip>
          )}
        </View>

        {/* Show debug info button */}
        {Object.keys(rawTexts).length > 0 && (
          <TouchableOpacity 
            onPress={() => setShowRawTexts(!showRawTexts)}
            style={styles.debugButton}
          >
            <MaterialIcons 
              name={showRawTexts ? "visibility-off" : "visibility"} 
              size={20} 
              color="#666" 
            />
            <Text style={styles.debugButtonText}>
              {showRawTexts ? 'Hide' : 'Show'} OCR Raw Text
            </Text>
          </TouchableOpacity>
        )}

        {showRawTexts && (
          <View style={styles.rawTextContainer}>
            {Object.entries(rawTexts).map(([field, text]) => (
              <View key={field} style={styles.rawTextItem}>
                <Text style={styles.rawTextLabel}>{field}:</Text>
                <Text style={styles.rawTextValue}>{text || '(empty)'}</Text>
              </View>
            ))}
          </View>
        )}
        
        <TextInput
          label="Product Name *"
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          mode="outlined"
          style={styles.input}
          right={multiCapture && formData.name ? <TextInput.Icon icon="check" /> : null}
        />
        <TextInput
          label="Brand Name"
          value={formData.brand}
          onChangeText={(text) => updateField('brand', text)}
          mode="outlined"
          style={styles.input}
          right={multiCapture && formData.brand ? <TextInput.Icon icon="check" /> : null}
        />
        
        <TextInput
          label="Nicotine Strength (mg)"
          value={formData.mg}
          onChangeText={(text) => updateField('mg', text)}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., 3mg, 6mg"
          right={multiCapture && formData.mg ? <TextInput.Icon icon="check" /> : null}
        />
        
        <TextInput
          label="Bottle Size"
          value={formData.bottleSize}
          onChangeText={(text) => updateField('bottleSize', text)}
          mode="outlined"
          style={styles.input}
          placeholder="e.g., 30ml, 60ml"
          right={multiCapture && formData.bottleSize ? <TextInput.Icon icon="check" /> : null}
        />
        
        <TextInput
          label="Batch Number"
          value={formData.batchNumber}
          onChangeText={(text) => updateField('batchNumber', text)}
          mode="outlined"
          style={styles.input}
          right={multiCapture && formData.batchNumber ? <TextInput.Icon icon="check" /> : null}
        />
        
        <TextInput
          label="Expiration Date *"
          value={formData.expirationDate}
          onChangeText={(text) => updateField('expirationDate', text)}
          mode="outlined"
          style={styles.input}
          placeholder="MM/DD/YYYY"
        />
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
            disabled={saving}
          >
            Retake
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            loading={saving}
            disabled={saving}
          >
            Save
          </Button>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 100, // Extra space at bottom for keyboard
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  imageGallery: {
    backgroundColor: '#000',
    paddingVertical: 10,
  },
  imageContainer: {
    marginHorizontal: 5,
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 120,
    height: 150,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  imageLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  multiCaptureChip: {
    backgroundColor: '#E8F5E9',
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
  },
  debugButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  rawTextContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rawTextItem: {
    marginBottom: 10,
  },
  rawTextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  rawTextValue: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
  },
  input: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
});

export default ReviewCaptureScreen;
