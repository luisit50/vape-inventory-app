const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');

// Configure multer for multiple image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
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

// Field-specific OCR configurations
const FIELD_CONFIGS = {
  name: {
    tesseractConfig: {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -&.',
    },
    extractor: extractNameFromText,
  },
  mg: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789mgMG ',
    },
    extractor: extractMgFromText,
  },
  bottleSize: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789mlML ',
    },
    extractor: extractBottleSizeFromText,
  },
  batchNumber: {
    tesseractConfig: {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
    },
    extractor: extractBatchNumberFromText,
  },
  expirationDate: {
    tesseractConfig: {
      tessedit_char_whitelist: '0123456789/-. ',
    },
    extractor: extractExpirationDateFromText,
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

          // Extract specific data using field extractor
          const extractedValue = config.extractor(text);
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

// Field-specific extraction functions

function extractNameFromText(text) {
  // Clean up the text
  const cleaned = text.trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 2)
    .join(' ');
  
  // Take the longest meaningful line as the product name
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  if (lines.length === 0) return cleaned;
  
  // Return the longest line (likely the product name)
  const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b);
  return longestLine.length > cleaned.length / 2 ? longestLine : cleaned;
}

function extractMgFromText(text) {
  // Try multiple patterns for nicotine strength
  const patterns = [
    /(\d+)\s*mg/i,
    /(\d+)mg/i,
    /(\d+)\s*MG/,
    /mg\s*(\d+)/i,
    /(\d+)\s*mg\/ml/i,
    /(\d+)%/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseInt(match[1]);
      // Validate reasonable nicotine strengths (0-50mg typically)
      if (value >= 0 && value <= 50) {
        return match[1];
      }
    }
  }
  
  // Try to extract any number if patterns fail
  const numbers = text.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const value = parseInt(numbers[0]);
    if (value >= 0 && value <= 50) {
      return numbers[0];
    }
  }
  
  return '';
}

function extractBottleSizeFromText(text) {
  // Try multiple patterns for bottle size
  const patterns = [
    /(\d+)\s*ml/i,
    /(\d+)ml/i,
    /(\d+)\s*ML/,
    /ml\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseInt(match[1]);
      // Validate reasonable bottle sizes (10-1000ml typically)
      if (value >= 10 && value <= 1000) {
        return match[1];
      }
    }
  }
  
  // Try to extract any number if patterns fail
  const numbers = text.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const value = parseInt(numbers[0]);
    if (value >= 10 && value <= 1000) {
      return numbers[0];
    }
  }
  
  return '';
}

function extractBatchNumberFromText(text) {
  // Clean and return the text - batch numbers vary too much for strict patterns
  const cleaned = text.trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 3)
    .join(' ');
  
  // Look for common batch number patterns
  const patterns = [
    /(?:batch|lot|b|l)[:\s#]*([A-Z0-9-_]+)/i,
    /([A-Z]{1,3}\d{4,})/i,
    /(\d{6,})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return cleaned;
}

function extractExpirationDateFromText(text) {
  // Try various date formats
  const patterns = [
    // MM/DD/YYYY or MM/DD/YY
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    // DD-MM-YYYY or DD-MM-YY
    /(\d{1,2}-\d{1,2}-\d{2,4})/,
    // YYYY-MM-DD
    /(\d{4}-\d{1,2}-\d{1,2})/,
    // DD.MM.YYYY
    /(\d{1,2}\.\d{1,2}\.\d{2,4})/,
    // MMDDYY or MMDDYYYY
    /(\d{6,8})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Try to extract any sequence of numbers that could be a date
  const numbers = text.match(/\d{6,}/);
  if (numbers) {
    return numbers[0];
  }
  
  return '';
}

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
    const extractedValue = config.extractor(text);

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
