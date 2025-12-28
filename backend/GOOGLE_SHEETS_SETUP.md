# Google Sheets API Setup Guide

This guide will help you set up Google Sheets API access to automatically update your inventory spreadsheet.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select an existing project
3. Give it a name like "Vape Inventory Bot"

## Step 2: Enable Google Sheets API

1. In your project, go to **APIs & Services** > **Library**
2. Search for "Google Sheets API"
3. Click on it and press **Enable**

## Step 3: Create Service Account Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the details:
   - Service account name: `inventory-updater`
   - Description: `Bot to update inventory spreadsheet`
4. Click **Create and Continue**
5. Skip the optional steps (grant access, grant users access)
6. Click **Done**

## Step 4: Generate JSON Key

1. In the **Credentials** page, find your new service account under "Service Accounts"
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Choose **JSON** format
6. Click **Create**
7. A JSON file will download automatically

## Step 5: Save Credentials

1. Rename the downloaded file to `google-credentials.json`
2. Move it to your backend folder: `c:\Users\Gamer\Desktop\Phone app\backend\`
3. **Important:** Add this to your `.gitignore` file:
   ```
   google-credentials.json
   ```

## Step 6: Share Spreadsheet with Service Account

1. Open the downloaded `google-credentials.json` file
2. Find the `client_email` field (looks like: `inventory-updater@your-project.iam.gserviceaccount.com`)
3. Copy this email address
4. Open your [Google Sheets document](https://docs.google.com/spreadsheets/d/1hhc9pKai6KssvWLSzENfr9a5zKQuCIULIigrOIhUPBs/edit)
5. Click **Share** button (top right)
6. Paste the service account email
7. Give it **Editor** access
8. Uncheck "Notify people"
9. Click **Share**

## Step 7: Update Environment Variables

Add to your `.env` file:

```env
# Google Sheets API
GOOGLE_SHEETS_CREDENTIALS_PATH=./google-credentials.json
```

## Step 8: Install Dependencies

Run this command in your backend folder:

```bash
npm install googleapis
```

## Step 9: Run the Script

```bash
node updateGoogleSheet.js
```

## Expected Output

```
🔌 Connecting to MongoDB...
✅ MongoDB connected
📊 Getting inventory counts from database...
✅ Found 45 unique products in database
🔑 Authenticating with Google Sheets...
✅ Google Sheets authenticated
📖 Reading spreadsheet data...
✅ Read 150 rows from spreadsheet
✅ Match: "Black Raz Ade a-30mL" 3mg 30ml → 5 bottles
✅ Match: "Blemon Berry Freeze a-30mL" 0mg 30ml → 3 bottles
✍️  Writing updates to Google Sheet...
✅ Google Sheet updated successfully!
📝 Updated 150 rows
```

## Scheduling Automatic Updates

### Option 1: Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 9 AM)
4. Action: Start a program
5. Program: `node`
6. Arguments: `c:\Users\Gamer\Desktop\Phone app\backend\updateGoogleSheet.js`
7. Start in: `c:\Users\Gamer\Desktop\Phone app\backend`

### Option 2: Create API Endpoint
Add this to your `server.js` to trigger manually via HTTP:

```javascript
app.post('/api/admin/update-sheet', async (req, res) => {
  const { updateGoogleSheet } = require('./updateGoogleSheet');
  try {
    await updateGoogleSheet();
    res.json({ success: true, message: 'Sheet updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## Troubleshooting

### Error: "Unable to authenticate"
- Make sure `google-credentials.json` exists in the backend folder
- Check that the path in `.env` is correct

### Error: "The caller does not have permission"
- Make sure you shared the spreadsheet with the service account email
- Give it **Editor** access, not just **Viewer**

### Products not matching
- Check the console output to see which products aren't matching
- The script normalizes names, but you may need to adjust the matching logic
- Products in database should have the same format as in the sheet

### Zero counts showing up
- This is normal - it means those products aren't in your database yet
- As you add bottles via your app, the counts will update

## Security Notes

⚠️ **Never commit `google-credentials.json` to Git!**
⚠️ **Keep this file secure - it gives full access to your spreadsheet**
