const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// OCR endpoint
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('Processing OCR for image...');

    // Perform OCR on the image buffer
    const result = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: info => console.log(info)
      }
    );

    const text = result.data.text;
    console.log('Extracted text:', text);

    // Extract bottle data from text
    const bottleData = extractBottleData(text);

    res.json({
      success: true,
      data: bottleData,
      rawText: text
    });

  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.message 
    });
  }
});

// Helper function to extract bottle data from OCR text
function extractBottleData(text) {
  const data = {
    name: extractName(text),
    mg: extractMg(text),
    bottleSize: extractBottleSize(text),
    batchNumber: extractBatchNumber(text),
    expirationDate: extractExpirationDate(text),
  };

  return data;
}

// Extract nicotine strength (e.g., "3mg", "6 mg", "12MG")
function extractMg(text) {
  // Try multiple patterns
  const patterns = [
    /(\d+)\s*mg/i,
    /(\d+)mg/i,
    /(\d+)\s*MG/,
    /mg\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Extract bottle size (e.g., "30ml", "60 ml", "100ML")
function extractBottleSize(text) {
  const patterns = [
    /(\d+)\s*ml/i,
    /(\d+)ml/i,
    /(\d+)\s*ML/,
    /ml\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Extract batch number (common patterns)
function extractBatchNumber(text) {
  const patterns = [
    /batch[:\s#]*([A-Z0-9]+)/i,
    /lot[:\s#]*([A-Z0-9]+)/i,
    /b#\s*([A-Z0-9]+)/i,
    /batch\s*([A-Z0-9]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

// Extract expiration date (various formats)
function extractExpirationDate(text) {
  const patterns = [
    /exp[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /expir[a-z]*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /use\s*by[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /best\s*before[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return formatDate(match[1]);
    }
  }
  return '';
}

// Extract product name - look for brand names like "GHOST TOWN"
function extractName(text) {
  // Look for "GHOST" pattern specifically since that's the brand
  const ghostMatch = text.match(/GHOST\s*[A-Z]*[A-Z\s]*/i);
  if (ghostMatch) {
    return ghostMatch[0].trim().replace(/\s+/g, ' ');
  }
  
  const lines = text.split('\n').filter(line => line.trim().length > 3);
  
  if (lines.length === 0) return '';
  
  // Try to find a line that looks like a product name
  // Usually it's near the top and doesn't contain numbers or common words
  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    // Skip lines with only numbers, symbols, or common labels
    if (!/^[\d\s\W]+$/.test(cleaned) && 
        !/^(batch|lot|exp|made|mfg|warning|this|product|tobacco|nicotine)/i.test(cleaned) &&
        cleaned.length > 3) {
      return cleaned;
    }
  }
  
  return lines[0].trim();
}

// Format date to YYYY-MM-DD
function formatDate(dateStr) {
  try {
    // Handle MM/DD/YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let [part1, part2, year] = parts;
      
      // Convert 2-digit year to 4-digit
      if (year.length === 2) {
        year = '20' + year;
      }
      
      // Assume MM/DD/YYYY format (US standard)
      const month = part1.padStart(2, '0');
      const day = part2.padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  return dateStr;
}

// Field-specific OCR configurations
const FIELD_CONFIGS = {
  name: {
    tesseractConfig: {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -&.',
    },
  },
  mg: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789mgMG ',
    },
  },
  bottleSize: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789mlML ',
    },
  },
  batchNumber: {
    tesseractConfig: {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    },
  },
  expirationDate: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789/-. ',
    },
  },
};

// Multi-field OCR endpoint
router.post('/extract-multi', upload.fields([
  { name: 'name', maxCount: 1 },
  { name: 'mg', maxCount: 1 },
  { name: 'bottleSize', maxCount: 1 },
  { name: 'batchNumber', maxCount: 1 },
  { name: 'expirationDate', maxCount: 1 },
]), async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    console.log('Processing multi-field OCR...');
    const results = {};
    const rawTexts = {};
    const errors = {};

    // Process each field's image
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (files && files.length > 0) {
        try {
          const file = files[0];
          const config = FIELD_CONFIGS[fieldName];
          
          console.log(`Processing ${fieldName}...`);
          
          // Perform OCR with field-specific configuration
          const ocrResult = await Tesseract.recognize(
            file.buffer,
            'eng',
            {
              logger: info => {
                if (info.status === 'recognizing text') {
                  console.log(`${fieldName}: ${Math.round(info.progress * 100)}%`);
                }
              },
              ...config.tesseractConfig,
            }
          );

          const text = ocrResult.data.text;
          rawTexts[fieldName] = text;
          console.log(`${fieldName} raw text:`, text);

          // Extract specific data using existing extractors
          let extractedValue = '';
          switch(fieldName) {
            case 'name':
              extractedValue = extractName(text);
              break;
            case 'mg':
              extractedValue = extractMg(text);
              break;
            case 'bottleSize':
              extractedValue = extractBottleSize(text);
              break;
            case 'batchNumber':
              extractedValue = extractBatchNumber(text);
              break;
            case 'expirationDate':
              extractedValue = extractExpirationDate(text);
              break;
          }
          results[fieldName] = extractedValue;
          
          console.log(`${fieldName} extracted:`, extractedValue);
        } catch (error) {
          console.error(`Error processing ${fieldName}:`, error.message);
          errors[fieldName] = error.message;
          results[fieldName] = '';
        }
      }
    }

    res.json({
      success: true,
      data: results,
      rawTexts: rawTexts,
      errors: Object.keys(errors).length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Multi-field OCR Error:', error);
    res.status(500).json({ 
      message: 'Error processing images',
      error: error.message 
    });
  }
});

// Single field OCR endpoint (for retakes or individual captures)
router.post('/extract-field', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const fieldName = req.body.fieldName;
    if (!fieldName || !FIELD_CONFIGS[fieldName]) {
      return res.status(400).json({ message: 'Invalid or missing field name' });
    }

    const config = FIELD_CONFIGS[fieldName];
    
    console.log(`Processing single field: ${fieldName}`);
    
    const result = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: info => console.log(info),
        ...config.tesseractConfig,
      }
    );

    const text = result.data.text;
    
    // Extract value
    let extractedValue = '';
    switch(fieldName) {
      case 'name':
        extractedValue = extractName(text);
        break;
      case 'mg':
        extractedValue = extractMg(text);
        break;
      case 'bottleSize':
        extractedValue = extractBottleSize(text);
        break;
      case 'batchNumber':
        extractedValue = extractBatchNumber(text);
        break;
      case 'expirationDate':
        extractedValue = extractExpirationDate(text);
        break;
    }

    res.json({
      success: true,
      field: fieldName,
      value: extractedValue,
      rawText: text,
    });

  } catch (error) {
    console.error('Field OCR Error:', error);
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.message 
    });
  }
});

module.exports = router;
