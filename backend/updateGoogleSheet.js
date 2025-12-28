const { google } = require('googleapis');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bottle = require('./models/Bottle');

dotenv.config();

// Google Sheets configuration
const SPREADSHEET_ID = '1hhc9pKai6KssvWLSzENfr9a5zKQuCIULIigrOIhUPBs';
const SHEET_NAME = 'Sheet1'; // The actual sheet tab name

/**
 * Authenticate with Google Sheets API
 */
async function getGoogleSheetsClient() {
  let auth;
  
  // Check if credentials are in environment variable (for production)
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
      auth = new google.auth.GoogleAuth({
        credentials: credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      console.error('Error parsing GOOGLE_CREDENTIALS_JSON:', error);
      throw new Error('Invalid Google credentials in environment variable');
    }
  } else {
    // Use credentials file (for local development)
    const credPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || './google-credentials.json';
    auth = new google.auth.GoogleAuth({
      keyFile: credPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  return sheets;
}

/**
 * Get inventory counts from database
 * Groups by name, mg, and bottleSize
 * @param {string} userId - Optional userId to filter inventory for specific user
 */
async function getInventoryCounts(userId = null) {
  const matchStage = userId ? { $match: { userId: new mongoose.Types.ObjectId(userId) } } : null;
  
  const pipeline = [
    ...(matchStage ? [matchStage] : []),
    {
      $group: {
        _id: {
          name: '$name',
          mg: '$mg',
          bottleSize: '$bottleSize'
        },
        count: { $sum: 1 }
      }
    }
  ];

  const counts = await Bottle.aggregate(pipeline);

  // Convert to easier lookup format
  const inventory = {};
  counts.forEach(item => {
    const key = `${item._id.name}|${item._id.mg}|${item._id.bottleSize}`;
    inventory[key] = item.count;
  });

  return inventory;
}

/**
 * Normalize product name for matching
 * Strips size suffix like 'a-30mL' or 'b-60mL' from sheet names
 */
function normalizeProductName(name) {
  if (!name) return '';
  let normalized = name.toString().trim().toLowerCase();
  
  // Remove size suffix like 'a-30ml', 'b-60ml', 'a-120ml', etc.
  normalized = normalized.replace(/\s*[a-z]-(\d+)ml$/i, '');
  
  // Remove all punctuation to handle cases like "MR." vs "MR"
  normalized = normalized.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Normalize mg value for matching
 * Database stores: "0", "3", "6"
 * Sheet has: "0mg", "3mg", "6mg"
 */
function normalizeMg(mg) {
  if (!mg && mg !== 0) return '0';
  const str = mg.toString().toLowerCase().trim();
  // Extract just the number
  const match = str.match(/(\d+)/);
  if (match) {
    return match[1];
  }
  return '0';
}

/**
 * Normalize bottle size for matching
 * Database stores: "30", "60", "120"
 * Sheet has: embedded in name like "a-30mL"
 */
function normalizeSize(size) {
  if (!size) return '';
  const str = size.toString().trim();
  // Extract just the number
  const match = str.match(/(\d+)/);
  if (match) {
    return match[1];
  }
  return str;
}

/**
 * Calculate similarity between two strings (0-100)
 * Uses Levenshtein distance for fuzzy matching
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 100;
  if (!str1 || !str2) return 0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  // Levenshtein distance
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  const distance = costs[shorter.length];
  const similarity = ((longer.length - distance) / longer.length) * 100;
  return Math.round(similarity);
}

/**
 * Find matching inventory count with fuzzy matching
 */
function findInventoryCount(inventory, productName, mg, size) {
  const normalizedProduct = normalizeProductName(productName);
  const normalizedMg = normalizeMg(mg);
  const normalizedSize = normalizeSize(size);

  // console.log(`\n🔍 Looking for: "${productName}" (normalized: "${normalizedProduct}") | ${mg} (${normalizedMg}) | ${size} (${normalizedSize})`);

  // Try exact match first
  const exactKey = `${productName}|${mg}|${size}`;
  if (inventory[exactKey]) {
    // console.log(`   ✅ EXACT MATCH: ${inventory[exactKey]} bottles`);
    return inventory[exactKey];
  }

  let bestMatch = null;
  let bestScore = 0;
  const SIMILARITY_THRESHOLD = 90; // 90% similarity required (strict to avoid matching similar names like "Freeze" vs "Squeeze")

  // Try fuzzy matching
  for (const [key, count] of Object.entries(inventory)) {
    const [dbName, dbMg, dbSize] = key.split('|');
    const dbNormalized = normalizeProductName(dbName);
    const dbMgNorm = normalizeMg(dbMg);
    const dbSizeNorm = normalizeSize(dbSize);
    
    // Must match mg and size exactly, but allow fuzzy name matching
    if (dbMgNorm === normalizedMg && dbSizeNorm === normalizedSize) {
      const nameSimilarity = calculateSimilarity(dbNormalized, normalizedProduct);
      
      // console.log(`   📋 Comparing: "${dbName}" (normalized: "${dbNormalized}") | Similarity: ${nameSimilarity}%`);
      
      if (nameSimilarity === 100) {
        // Perfect match
        // console.log(`   ✅ PERFECT MATCH: ${count} bottles`);
        return count;
      } else if (nameSimilarity >= SIMILARITY_THRESHOLD && nameSimilarity > bestScore) {
        // Good fuzzy match
        bestMatch = { name: dbName, count, similarity: nameSimilarity };
        bestScore = nameSimilarity;
      }
    }
  }

  if (bestMatch) {
    // console.log(`   ✨ FUZZY MATCH: "${bestMatch.name}" (${bestMatch.similarity}% similar) - ${bestMatch.count} bottles`);
    return bestMatch.count;
  }

  // console.log(`   ❌ NO MATCH (need ${SIMILARITY_THRESHOLD}% similarity)`);
  return 0; // No match found
}

/**
 * Update Google Sheet with inventory counts
 * @param {string} userId - Optional userId to filter inventory for specific user
 * @param {string} spreadsheetId - Optional custom spreadsheet ID
 * @param {boolean} closeConnection - Whether to close MongoDB connection after (default: false)
 */
async function updateGoogleSheet(userId = null, spreadsheetId = SPREADSHEET_ID, closeConnection = false) {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB connected');
    }

    if (userId) {
      console.log(`👤 Filtering inventory for user: ${userId}`);
    } else {
      console.log('🌐 Getting inventory for ALL users');
    }

    // console.log('📊 Getting inventory counts from database...');
    const inventory = await getInventoryCounts(userId);
    // console.log(`✅ Found ${Object.keys(inventory).length} unique products in database`);

    // console.log('🔑 Authenticating with Google Sheets...');
    const sheets = await getGoogleSheetsClient();
    // console.log('✅ Google Sheets authenticated');

    // console.log('📖 Reading spreadsheet data...');
    const range = `${SHEET_NAME}!A:C`; // Read all rows, columns A to C
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ No data found in spreadsheet');
      return;
    }

    // console.log(`✅ Read ${rows.length} rows from spreadsheet`);

    // Log first few rows to debug
    // console.log('\n📋 First 5 rows from sheet:');
    // rows.slice(0, 5).forEach((row, i) => {
    //   console.log(`   Row ${i}: [${row.join(' | ')}]`);
    // });

    // Column indices (based on sheet structure)
    const nameColIndex = 0; // Column A: Product name
    const mgColIndex = 1;    // Column B: MG
    const qtyColIndex = 2;   // Column C: IN STOCK QTY (first stock column)

    // console.log('\n📍 Using columns: A (name), B (mg), C (qty)');

    // Prepare updates
    const updates = [];
    let matchedCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const productName = row[nameColIndex] || '';
      const mg = row[mgColIndex] || '0mg';
      
      // Skip empty product names and header rows
      if (!productName || productName.toLowerCase().includes('osuna') || productName.toLowerCase().includes('rsv house')) {
        continue;
      }
      
      // Extract size from product name (e.g., "a-30mL")
      const sizeMatch = productName.match(/a-(\d+)mL/i) || productName.match(/(\d+)ml/i);
      const size = sizeMatch ? sizeMatch[1] : '30'; // Just the number

      // Find inventory count
      const count = findInventoryCount(inventory, productName, mg, size);

      if (count > 0) {
        matchedCount++;
        // console.log(`✅ Match: "${productName}" ${mg} ${size}ml → ${count} bottles`);
      } else {
        notFoundCount++;
        // console.log(`⚠️  Not found: "${productName}" ${mg} ${size}`);
      }

      // Update QTY column C (IN STOCK)
      const targetCol = qtyColIndex; // Column C (index 2)
      const actualRow = i + 1; // Row number in sheet (1-indexed)
      updates.push({
        range: `${SHEET_NAME}!${getColumnLetter(targetCol)}${actualRow}`,
        values: [[count]]
      });
    }

    console.log(`\n📊 Summary: ${matchedCount} matched, ${notFoundCount} not found`);

    // Write updates to Google Sheet
    console.log('✍️  Writing updates to Google Sheet...');
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });

    console.log('✅ Google Sheet updated successfully!');
    console.log(`📝 Updated ${updates.length} rows`);

  } catch (error) {
    console.error('❌ Error updating Google Sheet:', error.message);
    console.error(error);
    throw error; // Re-throw so API can handle it
  } finally {
    // Only close connection if explicitly requested (for CLI usage)
    if (closeConnection) {
      await mongoose.connection.close();
      console.log('👋 MongoDB connection closed');
    }
  }
}

/**
 * Convert column index to letter (0 -> A, 1 -> B, etc.)
 */
function getColumnLetter(index) {
  let letter = '';
  let num = index;
  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }
  return letter;
}

// Run the update
if (require.main === module) {
  // Get userId from command line argument
  // Usage: node updateGoogleSheet.js [userId] [spreadsheetId]
  const userId = process.argv[2] || null;
  const spreadsheetId = process.argv[3] || SPREADSHEET_ID;
  
  if (userId) {
    console.log(`🎯 Updating sheet for specific user: ${userId}`);
  } else {
    console.log('🌐 Updating sheet with ALL users inventory');
  }
  
  // When running from CLI, close connection after
  updateGoogleSheet(userId, spreadsheetId, true)
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateGoogleSheet, getInventoryCounts };
