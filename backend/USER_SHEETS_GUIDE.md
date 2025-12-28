# User Google Sheets Setup Guide

## Overview
Each user can link their own Google Sheet to track their inventory. The system will automatically update their sheet with their bottles from the database.

## For Users: How to Set Up Your Personal Inventory Sheet

### Step 1: Get the Template
1. Open this template: [Vape Inventory Template](https://docs.google.com/spreadsheets/d/1hhc9pKai6KssvWLSzENfr9a5zKQuCIULIigrOIhUPBs/edit)
2. Click **File** → **Make a copy**
3. Name it something like "My Vape Inventory"

### Step 2: Share Your Sheet
1. Click the **Share** button (top right)
2. Add this email: `inventory-updater@vape-inventory-bot.iam.gserviceaccount.com`
   *(Get the exact email from your admin)*
3. Give it **Editor** access
4. Uncheck "Notify people"
5. Click **Share**

### Step 3: Get Your Spreadsheet ID
Your spreadsheet URL looks like:
```
https://docs.google.com/spreadsheets/d/1hhc9pKai6KssvWLSzENfr9a5zKQuCIULIigrOIhUPBs/edit
                                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                       This is your Spreadsheet ID
```

### Step 4: Link It to Your Account
1. Go to your dashboard
2. Navigate to "Google Sheets" section
3. Paste your spreadsheet URL or just the ID
4. Click "Link Sheet"

### Step 5: Update Your Sheet
1. Click "Update Now" to sync your inventory
2. Your sheet will show all your bottles organized by:
   - Product name
   - MG level (0mg, 3mg, 6mg)
   - Bottle size (30ml, 60ml, 120ml)

## What Gets Updated?

The bot will:
- ✅ Count all bottles you've scanned in the app
- ✅ Group them by product name, MG, and size
- ✅ Update the "IN STOCK" column with accurate counts
- ✅ Show you what you have and what you're missing

## Features

### Your Personal Inventory
- **Private**: Only you can see your bottles
- **Real-time**: Update anytime from the website
- **Organized**: See everything at a glance
- **Track Stock**: Know what you have and what to order

### Use Cases
- 📊 Track your overall inventory
- 🔍 See what products you're low on
- 📈 Plan your restocking needs
- 💼 Professional inventory management

## API Endpoints (For Developers)

### Link a Sheet
```http
POST /api/admin/setup-sheet
Headers: { Authorization: "Bearer <token>" }
Body: {
  "spreadsheetId": "1hhc9pKai6KssvWLSzENfr9a5zKQuCIULIigrOIhUPBs",
  "spreadsheetName": "My Inventory"
}
```

### Get My Sheet Info
```http
GET /api/admin/my-sheet
Headers: { Authorization: "Bearer <token>" }
```

### Update My Sheet
```http
POST /api/admin/update-sheet
Headers: { Authorization: "Bearer <token>" }
```

### Get Inventory Counts
```http
GET /api/admin/inventory-counts
Headers: { Authorization: "Bearer <token>" }
```

## Troubleshooting

### "No Google Sheet linked"
- You need to set up your sheet first using the setup form

### "Unable to authenticate"
- Make sure you shared the sheet with the service account email
- Check that you gave it **Editor** access, not just Viewer

### Products not matching
- The bot normalizes product names automatically
- Check console logs to see which products aren't matching

### Sheet not updating
- Verify the spreadsheet ID is correct
- Make sure your sheet has the same structure as the template
- Check that data starts at row 6 with columns A (name), B (mg), C (qty)

## Admin Configuration

The service account email and credentials should be set up by your system administrator. Each user just needs to:
1. Make a copy of the template
2. Share it with the service account
3. Link it in their dashboard

That's it! 🎉
