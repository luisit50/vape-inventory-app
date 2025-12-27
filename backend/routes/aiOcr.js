const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const auth = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');

// Configure multer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// AI-enhanced OCR with validation (Premium/Pro only)
router.post('/extract-smart', auth, requireSubscription('premium'), upload.single('image'), async (req, res) => {
  try {
    // Step 1: Use Tesseract for initial extraction
    const ocrResult = await Tesseract.recognize(req.file.buffer, 'eng');
    const rawText = ocrResult.data.text;

    // Step 2: If OpenAI API key is available, enhance with AI
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const base64Image = req.file.buffer.toString('base64');
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini", // Cheaper model
          messages: [{
            role: "user",
            content: [
              {
                type: "text",
                text: `OCR extracted this text from a bottle label: "${rawText}"
                
                Please extract and validate:
                1. Product name
                2. Nicotine strength (mg) - number only
                3. Bottle size (ml) - number only  
                4. Batch/Lot number
                5. Expiration date (MM/DD/YYYY)
                
                Also analyze the image to fill in any missing or incorrect data.
                Return ONLY valid JSON: {"name":"","mg":"","bottleSize":"","batchNumber":"","expirationDate":""}`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: "low" // Faster and cheaper
                }
              }
            ]
          }],
          max_tokens: 300
        });

        const aiData = JSON.parse(response.choices[0].message.content);
        
        return res.json({
          success: true,
          data: aiData,
          source: 'ai-enhanced',
          rawText: rawText,
          confidence: 'high'
        });
      } catch (aiError) {
        console.log('AI enhancement failed, falling back to Tesseract:', aiError.message);
      }
    }

    // Step 3: Fallback to basic extraction if AI not available
    const bottleData = extractBasicData(rawText);
    
    res.json({
      success: true,
      data: bottleData,
      source: 'tesseract-only',
      rawText: rawText,
      confidence: 'medium'
    });

  } catch (error) {
    console.error('Smart OCR Error:', error);
    res.status(500).json({ 
      message: 'Error processing image',
      error: error.message 
    });
  }
});

// Multi-field AI-enhanced extraction
router.post('/extract-multi-smart', upload.fields([
  { name: 'name', maxCount: 1 },
  { name: 'brand', maxCount: 1 },
  { name: 'mg', maxCount: 1 },
  { name: 'bottleSize', maxCount: 1 },
  { name: 'batchNumber', maxCount: 1 },
  { name: 'expirationDate', maxCount: 1 },
]), async (req, res) => {
  try {
    const results = {};
    const rawTexts = {};
    const useAI = process.env.OPENAI_API_KEY && req.body.useAI !== 'false';

    if (useAI) {
      // Process all images with AI in parallel for speed
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const promises = Object.entries(req.files).map(async ([fieldName, files]) => {
        if (files && files.length > 0) {
          const file = files[0];
          const base64Image = file.buffer.toString('base64');
          
          const prompt = getFieldPrompt(fieldName);
          
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: prompt },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: "low"
                  }
                }
              ]
            }],
            max_tokens: 100
          });

          const value = response.choices[0].message.content.trim();
          results[fieldName] = cleanFieldValue(fieldName, value);
          rawTexts[fieldName] = value;
        }
      });

      await Promise.all(promises);

      return res.json({
        success: true,
        data: results,
        rawTexts: rawTexts,
        source: 'ai-vision'
      });
    }

    // Fallback to standard Tesseract multi-field
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (files && files.length > 0) {
        const result = await Tesseract.recognize(files[0].buffer, 'eng');
        const text = result.data.text;
        rawTexts[fieldName] = text;
        results[fieldName] = extractFieldValue(fieldName, text);
      }
    }

    res.json({
      success: true,
      data: results,
      rawTexts: rawTexts,
      source: 'tesseract'
    });

  } catch (error) {
    console.error('Multi-field smart OCR error:', error);
    res.status(500).json({ message: 'Error processing images', error: error.message });
  }
});

// Helper: Get field-specific prompts
function getFieldPrompt(fieldName) {
  const prompts = {
    name: "Extract ONLY the product name from this image. Return just the name, nothing else.",
    brand: "Extract ONLY the brand name from this image. Return just the brand name, nothing else.",
    mg: "Extract ONLY the nicotine strength number (without 'mg') from this image. Return just the number.",
    bottleSize: "Extract ONLY the bottle size number in ml (without 'ml') from this image. Return just the number.",
    batchNumber: "Extract ONLY the batch or lot number from this image. Return just the code.",
    expirationDate: "Extract ONLY the expiration date from this image. Format as MM/DD/YYYY. Return just the date."
  };
  return prompts[fieldName] || "Extract the relevant information from this image.";
}

// Helper: Clean and validate field values
function cleanFieldValue(fieldName, value) {
  value = value.replace(/[`'"]/g, '').trim();
  
  switch(fieldName) {
    case 'mg':
      return value.replace(/[^\d]/g, '');
    case 'bottleSize':
      return value.replace(/[^\d]/g, '');
    case 'expirationDate':
      // Ensure date format
      return value.replace(/[^\d\/\-]/g, '');
    default:
      return value;
  }
}

// Helper: Basic extraction (fallback)
function extractBasicData(text) {
  return {
    name: text.split('\n')[0] || '',
    brand: text.split('\n')[1] || '',
    mg: text.match(/(\d+)\s*mg/i)?.[1] || '',
    bottleSize: text.match(/(\d+)\s*ml/i)?.[1] || '',
    batchNumber: text.match(/(?:batch|lot)[:\s]*([A-Z0-9]+)/i)?.[1] || '',
    expirationDate: text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/)?.[1] || ''
  };
}

function extractFieldValue(fieldName, text) {
  const data = extractBasicData(text);
  return data[fieldName] || '';
}

module.exports = router;
