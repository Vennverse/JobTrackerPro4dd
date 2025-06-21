# Quick Deployment Guide

## Vercel Deployment (Recommended)

### 1. Environment Variables
Add these in Vercel dashboard:
```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=random_secure_string_32_chars
REPL_ID=your_app_name
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=yourapp.vercel.app
```

### 2. CORS Configuration Update
Edit `server/index.ts` - add your Vercel domain:
```javascript
app.use(cors({
  origin: [
    'https://yourapp.vercel.app', // Add your Vercel URL here
    'chrome-extension://*',
    'moz-extension://*',
    /^https?:\/\/localhost:\d+$/,
    /^https?:\/\/.*\.replit\.app$/,
    /^https?:\/\/.*\.replit\.dev$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

### 3. Chrome Extension Setup
Edit `extension/background.js` line 14:
```javascript
const possibleUrls = [
  'https://yourapp.vercel.app', // Your Vercel URL
  'http://localhost:5000'
];
```

### 4. Deploy Steps
1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables
4. Deploy automatically

## Azure Deployment

### 1. Environment Variables
Add in Azure App Service Configuration:
```
DATABASE_URL=your_postgres_connection_string
SESSION_SECRET=random_secure_string_32_chars
REPL_ID=your_app_name
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=yourapp.azurewebsites.net
```

### 2. CORS Configuration Update
Edit `server/index.ts` - add your Azure domain:
```javascript
app.use(cors({
  origin: [
    'https://yourapp.azurewebsites.net', // Add your Azure URL here
    'chrome-extension://*',
    // ... rest of origins
  ],
  // ... rest of config
}));
```

### 3. Chrome Extension Setup
Edit `extension/background.js` line 14:
```javascript
const possibleUrls = [
  'https://yourapp.azurewebsites.net', // Your Azure URL
  'http://localhost:5000'
];
```

### 4. Deploy Steps
1. Create Azure App Service
2. Set up GitHub Actions deployment
3. Configure environment variables
4. Deploy

## Database Options

### Vercel Postgres
```bash
npm install @vercel/postgres
```

### Azure Database for PostgreSQL
Use connection string format:
```
postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require
```

### Neon (Works with both)
```
postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

## Chrome Extension Connection

### Auto-Update for Multiple Environments
Replace `extension/background.js` line 10-20:
```javascript
async function detectApiUrl() {
  const urls = [
    'https://yourapp.vercel.app',
    'https://yourapp.azurewebsites.net',
    'http://localhost:5000'
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(`${url}/api/health`, { method: 'HEAD' });
      if (response.ok) return url;
    } catch (e) { continue; }
  }
  return urls[0];
}

const apiUrl = await detectApiUrl();
```

## Final Checklist

### Before Deployment:
- [ ] Update CORS with your domain
- [ ] Set all environment variables
- [ ] Update Chrome extension API URL
- [ ] Test database connection

### After Deployment:
- [ ] Verify `/api/health` endpoint works
- [ ] Test authentication flow
- [ ] Install and test Chrome extension
- [ ] Verify extension connects to deployed app

### Extension Distribution:
1. Package `extension/` folder as ZIP
2. Users install as unpacked extension
3. Extension auto-detects your deployed URL
4. Users log into web app first, then extension syncs

The key is making sure the Chrome extension knows your deployed URL. Both Vercel and Azure will work perfectly once the URLs are configured correctly.