import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, Button, Card, TextInput } from 'react-native-paper';
import { inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getExpirationStatus, formatDate } from '../utils/dateUtils';

const BottleDetailScreen = ({ route, navigation }) => {
  const { token } = useAuth();
  const { bottle } = route.params;
  const [isEditing, setIsEditing] = useState(false);
  const [editedBottle, setEditedBottle] = useState({
    name: bottle.name || '',
    brand: bottle.brand || '',
    mg: bottle.mg || '',
    bottleSize: bottle.bottleSize || '',
    batchNumber: bottle.batchNumber || '',
    expirationDate: bottle.expirationDate || '',
  });
  const [saving, setSaving] = useState(false);

  const expStatus = getExpirationStatus(bottle.expirationDate);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedBottle({
      name: bottle.name || '',
      brand: bottle.brand || '',
      mg: bottle.mg || '',
      bottleSize: bottle.bottleSize || '',
      batchNumber: bottle.batchNumber || '',
      expirationDate: bottle.expirationDate || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedBottle.name || !editedBottle.expirationDate) {
      Alert.alert('Error', 'Name and expiration date are required');
      return;
    }

    setSaving(true);
    try {
      await inventoryAPI.updateBottle(bottle._id, editedBottle, token);
      Alert.alert('Success', 'Bottle updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            setIsEditing(false);
            // Navigate back and ensure HomeScreen refreshes
            navigation.navigate('Home', { refresh: Date.now() });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update bottle');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Bottle',
      'Are you sure you want to delete this bottle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await inventoryAPI.deleteBottle(bottle._id, token);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bottle');
            }
          },
        },
      ]
    );
  };

  const updateField = (field, value) => {
    setEditedBottle(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
      {bottle.imageUri && (
        <Image source={{ uri: bottle.imageUri }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Card style={[styles.card, { borderLeftColor: expStatus.color }]}>
          <Card.Content>
            {!isEditing ? (
              <>
                <Text style={styles.title}>{bottle.name}</Text>
                {bottle.brand ? (
                  <Text style={styles.brandLabel}>Brand: {bottle.brand}</Text>
                ) : null}
                
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusBadge, { backgroundColor: expStatus.color }]}>
                    {expStatus.label}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Nicotine Strength:</Text>
                  <Text style={styles.value}>{bottle.mg || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Bottle Size:</Text>
                  <Text style={styles.value}>{bottle.bottleSize || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Batch Number:</Text>
                  <Text style={styles.value}>{bottle.batchNumber || 'N/A'}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.label}>Expiration Date:</Text>
                  <Text style={styles.value}>{formatDate(bottle.expirationDate)}</Text>
                </View>

                {bottle.capturedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Captured:</Text>
                    <Text style={styles.value}>
                      {new Date(bottle.capturedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.title}>Edit Bottle</Text>
                
                <TextInput
                  label="Product Name *"
                  value={editedBottle.name}
                  onChangeText={(text) => updateField('name', text)}
                  mode="outlined"
                  style={styles.input}
                  disabled={saving}
                />
                
                <TextInput
                  label="Brand Name"
                  value={editedBottle.brand}
                  onChangeText={(text) => updateField('brand', text)}
                  mode="outlined"
                  style={styles.input}
                  disabled={saving}
                />
                
                <TextInput
                  label="Nicotine Strength (mg)"
                  value={editedBottle.mg}
                  onChangeText={(text) => updateField('mg', text)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 3mg, 6mg"
                  disabled={saving}
                />
                
                <TextInput
                  label="Bottle Size"
                  value={editedBottle.bottleSize}
                  onChangeText={(text) => updateField('bottleSize', text)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., 30ml, 60ml"
                  disabled={saving}
                />
                
                <TextInput
                  label="Batch Number"
                  value={editedBottle.batchNumber}
                  onChangeText={(text) => updateField('batchNumber', text)}
                  mode="outlined"
                  style={styles.input}
                  disabled={saving}
                />
                
                <TextInput
                  label="Expiration Date *"
                  value={editedBottle.expirationDate}
                  onChangeText={(text) => updateField('expirationDate', text)}
                  mode="outlined"
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  disabled={saving}
                />
              </>
            )}
          </Card.Content>
        </Card>

        {!isEditing ? (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleEdit}
              style={[styles.button, styles.editButton]}
              buttonColor="#2196F3"
            >
              Edit Bottle
            </Button>
            
            <Button
              mode="contained"
              onPress={handleDelete}
              style={[styles.button, styles.deleteButton]}
              buttonColor="#f44336"
            >
              Delete Bottle
            </Button>
          </View>
        ) : (
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.button}
              disabled={saving}
            >
              Cancel
            </Button>
            
            <Button
              mode="contained"
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
              buttonColor="#4CAF50"
              loading={saving}
              disabled={saving}
            >
              Save Changes
            </Button>
          </View>
        )}
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
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  card: {
    borderLeftWidth: 6,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },  brandLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },  statusContainer: {
    marginBottom: 20,
  },
  statusBadge: {
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  deleteButton: {
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
  },
  editButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
});

export default BottleDetailScreen;
