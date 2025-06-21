# AutoJobr Deployment Guide

## Vercel Deployment

### 1. Project Structure Changes
Your current structure works perfectly for Vercel. No changes needed.

### 2. Add Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/**/*",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.ts"
    },
    {
      "src": "/extension/(.*)",
      "dest": "/extension/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "SESSION_SECRET": "@session_secret",
    "REPL_ID": "@repl_id",
    "ISSUER_URL": "@issuer_url"
  }
}
```

### 3. Environment Variables Setup
In Vercel dashboard, add:
- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: Random secure string
- `REPL_ID`: Your app identifier
- `ISSUER_URL`: Authentication provider URL
- `REPLIT_DOMAINS`: Your Vercel domain (e.g., `yourapp.vercel.app`)

### 4. Package.json Updates
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && tsc",
    "vercel-build": "npm run build"
  }
}
```

### 5. Chrome Extension Configuration
Update `extension/background.js`:
```javascript
const apiUrl = 'https://yourapp.vercel.app'; // Replace with your Vercel URL
```

## Azure Deployment

### 1. Azure App Service Setup
```yaml
# azure-pipelines.yml
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
    npm run build
  displayName: 'npm install and build'

- task: AzureWebApp@1
  inputs:
    azureSubscription: 'your-subscription'
    appName: 'autojobr-app'
    package: '.'
```

### 2. Azure Configuration
```json
// web.config (for Azure App Service)
{
  "version": 2,
  "platform": {
    "node": "18.x"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/dist/index.html"
    }
  ]
}
```

### 3. Environment Variables
In Azure App Service Configuration:
- `DATABASE_URL`
- `SESSION_SECRET` 
- `REPL_ID`
- `ISSUER_URL`
- `REPLIT_DOMAINS`

### 4. Chrome Extension Configuration
Update `extension/background.js`:
```javascript
const apiUrl = 'https://autojobr-app.azurewebsites.net'; // Your Azure URL
```

## Database Setup

### PostgreSQL on Vercel
```bash
# Install Vercel Postgres
npm i @vercel/postgres

# Update server/db.ts
import { sql } from '@vercel/postgres';
export { sql as db };
```

### PostgreSQL on Azure
```bash
# Use Azure Database for PostgreSQL
# Connection string format:
# postgresql://username:password@server.postgres.database.azure.com:5432/database?sslmode=require
```

## Build Process Changes

### Update package.json
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p server/tsconfig.json",
    "start": "node server/dist/index.js",
    "db:push": "drizzle-kit push:pg"
  }
}
```

### Server TypeScript Config
```json
// server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Chrome Extension Deployment Strategy

### 1. Dynamic API URL Detection
```javascript
// extension/background.js
const POSSIBLE_URLS = [
  'https://yourapp.vercel.app',
  'https://autojobr-app.azurewebsites.net',
  'http://localhost:5000'
];

async function detectApiUrl() {
  for (const url of POSSIBLE_URLS) {
    try {
      const response = await fetch(`${url}/api/health`, { method: 'HEAD' });
      if (response.ok) return url;
    } catch (e) {
      continue;
    }
  }
  return POSSIBLE_URLS[0]; // Default
}
```

### 2. Health Check Endpoint
```javascript
// server/routes.ts
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## CORS Configuration for Production

```javascript
// server/index.ts
app.use(cors({
  origin: [
    'https://yourapp.vercel.app',
    'https://autojobr-app.azurewebsites.net',
    'chrome-extension://*',
    /^https?:\/\/localhost:\d+$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
```

## Deployment Steps

### Vercel
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push
4. Update Chrome extension with new URL

### Azure
1. Create App Service
2. Set up deployment pipeline
3. Configure environment variables
4. Deploy and update extension URL

## Chrome Extension Distribution

### Option 1: Chrome Web Store
1. Package extension as .zip
2. Submit to Chrome Web Store
3. Include API URL configuration in options page

### Option 2: Enterprise Distribution
1. Host extension files on your domain
2. Provide installation instructions
3. Auto-detect API URL on installation

The key is ensuring the Chrome extension knows your deployed URL. Both platforms will work seamlessly once the API URL is correctly configured in the extension.