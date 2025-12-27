# Testing the Website - Quick Start Guide

## ✅ Current Status

**Backend Server**: Running on http://localhost:5000  
**Web Dashboard**: Starting on http://localhost:3000

## 🧪 How to Test the Website

### Step 1: Access the Website
The website should automatically open in your browser. If not, manually go to:
```
http://localhost:3000
```

### Step 2: Create an Account
1. You'll see the login page
2. Click "Don't have an account? Sign Up" (or similar link)
3. Fill in:
   - **Name**: Your name
   - **Email**: test@example.com (or any email)
   - **Password**: password123 (at least 6 characters)
4. Click "Sign Up"

### Step 3: Login
1. If you already have an account, just login with:
   - Email and password you created
2. You'll be redirected to the dashboard

### Step 4: View the Dashboard
Once logged in, you'll see:
- **Stats cards** showing:
  - Total bottles
  - Critical/Expired (red)
  - Warning 7-30 days (yellow)
  - Good >30 days (green)
- **Search bar** to find bottles
- **Filter tabs** (All, Critical, Warning, Good)
- **Bottle cards** with color-coded status

### Step 5: Test Adding Sample Data (via Mobile App or API)
Since the mobile app requires Expo setup, you can test by adding sample data via API:

Open a new PowerShell terminal and run:

```powershell
# First, login to get your token
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body (@{email="test@example.com"; password="password123"} | ConvertTo-Json) -ContentType "application/json"
$token = $loginResponse.token

# Add a sample bottle (expires in 3 days - RED)
Invoke-RestMethod -Uri "http://localhost:5000/api/inventory" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{
  name="Blue Raspberry"
  mg="3mg"
  bottleSize="60ml"
  batchNumber="BR123"
  expirationDate="2025-12-29"
} | ConvertTo-Json) -ContentType "application/json"

# Add another bottle (expires in 15 days - YELLOW)
Invoke-RestMethod -Uri "http://localhost:5000/api/inventory" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{
  name="Strawberry Cream"
  mg="6mg"
  bottleSize="30ml"
  batchNumber="SC456"
  expirationDate="2026-01-10"
} | ConvertTo-Json) -ContentType "application/json"

# Add another bottle (expires in 60 days - GREEN)
Invoke-RestMethod -Uri "http://localhost:5000/api/inventory" -Method POST -Headers @{Authorization="Bearer $token"} -Body (@{
  name="Mango Ice"
  mg="0mg"
  bottleSize="100ml"
  batchNumber="MI789"
  expirationDate="2026-02-24"
} | ConvertTo-Json) -ContentType "application/json"
```

### Step 6: Test Features
After adding sample data:

1. **Refresh the page** (F5) to see the new bottles
2. **Test color coding**:
   - Red bottle = 7 days or less
   - Yellow bottle = 7-30 days
   - Green bottle = >30 days
3. **Test search**: Type "Mango" in search bar
4. **Test filters**: Click "Critical", "Warning", or "Good" tabs
5. **View stats**: Check the numbers update correctly

## 🔍 What to Look For

### Visual Tests
- ✅ Color-coded bottle cards (red, yellow, green borders)
- ✅ Stats cards show correct counts
- ✅ Responsive layout (resize browser window)
- ✅ Search works in real-time
- ✅ Filter tabs work correctly

### Functional Tests
- ✅ Login/logout works
- ✅ Data persists after refresh
- ✅ All bottle information displays correctly
- ✅ Expiration calculations are accurate

## 🛑 Troubleshooting

### "Cannot connect to backend"
- Check if backend is running in terminal
- Backend should show: "🚀 Server running on port 5000"

### "No bottles showing"
- You need to add data first (see Step 5)
- Try the sample data commands above

### MongoDB Connection Error
If you see MongoDB errors in the backend terminal:
```powershell
# Install MongoDB Community Server from:
# https://www.mongodb.com/try/download/community
```

Or use MongoDB Atlas (cloud):
1. Sign up at mongodb.com/cloud/atlas
2. Create free cluster
3. Update backend/.env with connection string

## 📱 Next Steps: Testing Mobile App

To test the full mobile experience:
1. Install Expo Go on your phone (iOS/Android)
2. In mobile folder: `npm install`
3. Run: `npm start`
4. Scan QR code with phone
5. Take pictures of bottles and test OCR!

---

**Current Services Running:**
- Backend API: http://localhost:5000
- Web Dashboard: http://localhost:3000
