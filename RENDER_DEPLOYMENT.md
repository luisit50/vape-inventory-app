# Render Deployment Guide - Fast Setup

## Why Render is Faster than DisCloud:
- ✅ Auto-deploy from GitHub (no manual zips)
- ✅ Build caching (2nd+ deploys: ~30 seconds)
- ✅ Live logs and instant rollbacks
- ✅ Free SSL certificates

## Quick Setup (5 minutes):

### 1. Push to GitHub (if not already)
```bash
cd "c:\Users\Gamer\Desktop\Phone app"
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Connect to Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `vape-inventory-backend`
   - **Region:** Oregon (or closest to you)
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm ci --omit=dev`
   - **Start Command:** `node server.js`

### 3. Add Environment Variables
In Render dashboard → Environment tab:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key (if using AI OCR)
NODE_ENV=production
```

### 4. Deploy
Click **"Create Web Service"** - First deploy: ~3-5 minutes

## Speed Optimizations Already Applied:

✅ **render.yaml** - Auto-configures deployment settings
✅ **npm ci --omit=dev** - Faster installs, no dev dependencies
✅ **.dockerignore** - Excludes unnecessary files
✅ **Health check endpoint** - Faster startup detection

## Auto-Deploy on Git Push:
```bash
git add .
git commit -m "Update code"
git push
# Render auto-deploys in ~30 seconds (cached builds)
```

## Troubleshooting Slow Builds:

### If still slow (>5 min on first deploy):
1. **Check build logs** for which package is slow
2. **Sharp/Tesseract** taking long?
   - These are native dependencies, first build is slow
   - Cached builds are much faster (~30s)

### Speed up Sharp installation:
Add to package.json:
```json
"optionalDependencies": {
  "sharp": "^0.34.5"
}
```

## Free Tier Limits:
- 750 hours/month (enough for 24/7 uptime)
- Sleeps after 15 min inactivity
- First request after sleep: ~10-30s cold start
- Keep alive with cron job (optional)

## Monitor Your App:
- **Logs:** https://dashboard.render.com → Your Service → Logs (real-time)
- **Metrics:** CPU, Memory, Request volume
- **Health:** Auto-checks `/api/health` endpoint

## Pro Tips:
1. **Paid tier ($7/mo):** No sleep, 50% faster builds, more RAM
2. **Multiple regions:** Deploy to nearest users for low latency
3. **Preview deploys:** Test PRs before merging
4. **Rollback:** One-click to previous deploy if issues

## Your App URL:
After deploy: `https://vape-inventory-backend.onrender.com`

Update mobile app API URL in:
- `mobile/src/services/api.js`
- `web/src/services/api.js`
