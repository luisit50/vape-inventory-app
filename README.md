# Vape Juice Inventory Management System

A complete inventory management solution for tracking vape juice bottles with image capture, OCR data extraction, and expiration monitoring.

## Features

### Mobile App (iOS & Android)
- 📷 Camera integration to capture bottle images
- 🔍 OCR text extraction (mg, name, size, batch #, expiration date)
- 📱 Offline support with local storage
- 🔐 User authentication
- 🔎 Search and filter inventory
- 🔄 Automatic sync when online

### Web Dashboard
- 📊 View all inventory bottles
- 🚦 Color-coded expiration alerts:
  - 🔴 Red: 7 days or less until expiration
  - 🟡 Yellow: 7 days to 1 month until expiration
  - 🟢 Green: More than 1 month until expiration
- 🔎 Advanced search and filtering
- 📈 Inventory analytics

## Tech Stack

- **Mobile**: React Native with Expo
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Web**: React.js
- **OCR**: Google ML Kit Vision
- **Authentication**: JWT
- **Offline Storage**: AsyncStorage + Redux Persist

## Project Structure

```
Phone app/
├── mobile/              # React Native app
├── backend/             # Node.js API server
├── web/                 # React web dashboard
└── README.md
```

## Getting Started

See individual README files in each directory for setup instructions.
