// OCR service for extracting bottle data from images
import * as FileSystem from 'expo-file-system/legacy';
import api from './api';

export const extractBottleData = async (imageUri) => {
  try {
    // Create form data
    const formData = new FormData();
    
    // Read the image file
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Create file object for upload
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    // Send to backend OCR service
    const response = await api.post('/ocr/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 second timeout for OCR processing
    });

    if (response.data.success) {
      return {
        ...response.data.data,
        rawText: response.data.rawText,
      };
    } else {
      throw new Error('OCR processing failed');
    }
  } catch (error) {
    console.error('OCR Error:', error);
    // Return empty data if OCR fails - user can enter manually
    return {
      name: '',
      brand: '',
      mg: '',
      bottleSize: '',
      batchNumber: '',
      expirationDate: '',
      rawText: '',
    };
  }
};

// Multi-field OCR extraction - processes separate images for each field
export const extractMultiFieldData = async (imageUris, useAI = true) => {
  try {
    // Create form data with multiple field images
    const formData = new FormData();
    
    // Process each field's image
    for (const [fieldName, imageUri] of Object.entries(imageUris)) {
      if (imageUri) {
        const imageInfo = await FileSystem.getInfoAsync(imageUri);
        if (!imageInfo.exists) {
          console.warn(`Image for ${fieldName} does not exist`);
          continue;
        }

        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // Append each field's image with the field name
        formData.append(fieldName, {
          uri: imageUri,
          name: `${fieldName}_${filename}`,
          type: type,
        });
      }
    }

    formData.append('useAI', useAI.toString());

    // Try AI-enhanced extraction first if available
    const endpoint = useAI ? '/ai-ocr/extract-multi-smart' : '/ocr/extract-multi';
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 second timeout for multi-field processing
    });

    if (response.data.success) {
      return {
        ...response.data.data,
        rawTexts: response.data.rawTexts,
        errors: response.data.errors,
        source: response.data.source || 'unknown',
      };
    } else {
      throw new Error('Multi-field OCR processing failed');
    }
  } catch (error) {
    console.error('Multi-field OCR Error:', error);
    // Return empty data if OCR fails - user can enter manually
    return {
      name: '',
      brand: '',
      mg: '',
      bottleSize: '',
      batchNumber: '',
      expirationDate: '',
      rawTexts: {},
      errors: { general: error.message },
    };
  }
};

// Extract single field (for retakes or individual processing)
export const extractSingleField = async (imageUri, fieldName) => {
  try {
    const formData = new FormData();
    
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists) {
      throw new Error('Image file does not exist');
    }

    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    });
    
    formData.append('fieldName', fieldName);

    const response = await api.post('/ocr/extract-field', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    if (response.data.success) {
      return {
        value: response.data.value,
        rawText: response.data.rawText,
      };
    } else {
      throw new Error('Field OCR processing failed');
    }
  } catch (error) {
    console.error('Field OCR Error:', error);
    return {
      value: '',
      rawText: '',
    };
  }
};

// Extract nicotine strength (e.g., "3mg", "6 mg", "12MG")
const extractMg = (text) => {
  const mgPattern = /(\d+)\s*mg/i;
  const match = text.match(mgPattern);
  return match ? match[1] + 'mg' : '';
};

// Extract bottle size (e.g., "30ml", "60 ml", "100ML")
const extractBottleSize = (text) => {
  const sizePattern = /(\d+)\s*ml/i;
  const match = text.match(sizePattern);
  return match ? match[1] + 'ml' : '';
};

// Extract batch number (common patterns: "Batch: XXX", "Lot: XXX", "B#XXX")
const extractBatchNumber = (text) => {
  const patterns = [
    /batch[:\s#]*([A-Z0-9]+)/i,
    /lot[:\s#]*([A-Z0-9]+)/i,
    /b#\s*([A-Z0-9]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
};

// Extract expiration date (various formats)
const extractExpirationDate = (text) => {
  const patterns = [
    /exp[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /expir[a-z]*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /best\s*by[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
};

// Extract product name (heuristic: look for capitalized words, brand names)
const extractName = (text) => {
  // This is tricky - might need to be manually corrected
  // Look for sequences of capitalized words
  const lines = text.split('\n');
  for (const line of lines) {
    // Skip lines with just numbers or common words
    if (line.length > 3 && line.length < 50 && !/^\d+/.test(line)) {
      const cleaned = line.trim();
      if (cleaned && !/(batch|lot|exp|ml|mg)/i.test(cleaned)) {
        return cleaned;
      }
    }
  }
  return '';
};
