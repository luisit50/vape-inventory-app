import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
// Redux removed
import { inventoryAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { getExpirationStatus } from '../utils/dateUtils';

const BottleDetailScreen = ({ route, navigation }) => {
  const { token } = useAuth();
  const { bottle } = route.params;
  // No dispatch needed
  const expStatus = getExpirationStatus(bottle.expirationDate);

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

  return (
    <ScrollView style={styles.container}>
      {bottle.imageUri && (
        <Image source={{ uri: bottle.imageUri }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Card style={[styles.card, { borderLeftColor: expStatus.color }]}>
          <Card.Content>
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
              <Text style={styles.value}>{bottle.expirationDate}</Text>
            </View>

            {bottle.capturedAt && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Captured:</Text>
                <Text style={styles.value}>
                  {new Date(bottle.capturedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={handleDelete}
          style={styles.deleteButton}
          buttonColor="#f44336"
        >
          Delete Bottle
        </Button>
      </View>
    </ScrollView>
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
  },
  statusContainer: {
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
});

export default BottleDetailScreen;
