# Web Dashboard Setup Instructions

## Prerequisites

- Node.js (v16 or later)
- npm or yarn

## Installation

1. Navigate to the web directory:
```bash
cd web
```

2. Install dependencies:
```bash
npm install
```

3. Configure the API URL:
   - Open `src/services/api.js`
   - Change `API_URL` to your backend server address
   - For production, use your deployed backend URL

## Running the App

### Development Mode
```bash
npm start
```

The app will open in your browser at http://localhost:3000

### Production Build
```bash
npm run build
```

This creates an optimized build in the `build` folder ready for deployment.

## Features

✅ View all inventory bottles
✅ Color-coded expiration alerts:
   - 🔴 Red: 7 days or less until expiration
   - 🟡 Yellow: 7-30 days until expiration
   - 🟢 Green: More than 30 days until expiration
✅ Real-time statistics dashboard
✅ Search and filter functionality
✅ Responsive design for all devices

## Dashboard Overview

### Stats Cards
- **Total Bottles**: Total number of bottles in inventory
- **Critical/Expired**: Bottles expiring within 7 days or already expired
- **Warning**: Bottles expiring within 7-30 days
- **Good**: Bottles with more than 30 days until expiration

### Filter Tabs
- **All**: View all bottles
- **Critical**: View only critical/expired bottles
- **Warning**: View only warning bottles
- **Good**: View only good bottles

### Search
Search by product name or batch number in real-time

## Deployment

### Deploy to Vercel (Recommended)
1. Install Vercel CLI: `npm install -g vercel`
2. Run: `vercel`
3. Follow prompts

### Deploy to Netlify
1. Build: `npm run build`
2. Drag `build` folder to Netlify drop zone
3. Configure environment variables if needed

### Deploy to Traditional Server
1. Build: `npm run build`
2. Serve the `build` folder with any web server (nginx, Apache, etc.)

## Troubleshooting

### API Connection Issues
- Verify backend server is running
- Check `API_URL` in `src/services/api.js`
- Check browser console for CORS errors

### Login Issues
- Clear browser localStorage
- Verify backend authentication endpoints are working
- Check network tab in browser dev tools

### Build Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`
