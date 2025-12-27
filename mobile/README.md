# Mobile App Setup Instructions

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

1. Navigate to the mobile directory:
```bash
cd mobile
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL:
   - Open `src/services/api.js`
   - Change `API_URL` to your backend server address
   - For physical devices, use your computer's IP address (e.g., `http://192.168.1.100:5000/api`)

## Running the App

### Development Mode (Expo Go)

Start the development server:
```bash
npm start
```

Then:
- **iOS**: Scan the QR code with your iPhone camera
- **Android**: Scan the QR code with the Expo Go app
- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal

### Building for Production

#### iOS
```bash
expo build:ios
```

#### Android
```bash
expo build:android
```

## Features

✅ Camera integration for capturing bottle images
✅ OCR text extraction (name, mg, size, batch #, expiration)
✅ Offline support with automatic sync
✅ User authentication
✅ Search and filter inventory
✅ Color-coded expiration alerts

## Troubleshooting

### Camera Permission Issues
If camera permissions aren't working:
- iOS: Check Settings > Privacy > Camera
- Android: Check Settings > Apps > Permissions > Camera

### OCR Not Working
The app uses `react-native-text-recognition`. For best results:
- Ensure good lighting
- Hold camera steady
- Position label clearly within frame

### Offline Sync Issues
- Check internet connection
- Verify backend server is running
- Check console for sync errors
