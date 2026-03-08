# Bauplan Buddy Deployment Guide

## Quick Start Deployment (5 minutes)

### Option 1: Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy the app**
   ```bash
   # From project root
   vercel
   ```
   
3. **Follow prompts:**
   - Link to Vercel account (create free account if needed)
   - Choose project name
   - Confirm settings
   - Get your live URL!

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build and deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

## Production Deployment

### Docker Deployment (Cloud)

#### Railway (Recommended)
1. Push code to GitHub
2. Connect Railway to your GitHub repo
3. Railway auto-detects Dockerfile and deploys
4. Get your production URL

#### Render
1. Connect GitHub repository to Render
2. Select "Web Service"
3. Render builds using your Dockerfile
4. Free tier available

### Traditional Server Deployment

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Upload dist/ folder** to your web server
3. **Configure web server** to serve SPA (redirect all routes to index.html)

## Environment Configuration

### Current State
- Uses mock backend (localStorage)
- No real API integration
- Ready for frontend-only deployment

### For Real Backend Integration
Create `.env.production`:
```bash
VITE_USE_API=true
VITE_API_URL=https://your-api-domain.com/api
VITE_USE_MOCK_BACKEND=false
```

## Domain & SSL

### Custom Domain
- Vercel: Add custom domain in dashboard
- Netlify: Configure in site settings
- Docker: Use reverse proxy (Cloudflare, etc.)

### SSL Certificates
- Automatic with Vercel/Netlify
- Manual setup needed for VPS

## Monitoring & Analytics

Your app includes:
- Performance monitoring hooks
- Analytics service integration
- Error tracking capabilities

## Next Steps After Deployment

1. **Set up monitoring** (error tracking, analytics)
2. **Configure real backend** (if needed)
3. **Set up CI/CD** for automatic deployments
4. **Add custom domain** and SSL
5. **Implement user authentication** (if needed)

## Performance Optimizations

Already implemented:
- ✅ Code splitting (vendor, feature chunks)
- ✅ Asset optimization
- ✅ Gzip compression (Nginx)
- ✅ Service worker caching
- ✅ PWA features

## Security Features

Configured:
- ✅ Security headers (CSP, XSS protection)
- ✅ Input validation (Zod)
- ✅ Secure asset delivery

## Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Port Conflicts
- Development server auto-increments ports (8080 → 8081, etc.)
- Production uses port 80 (configurable)

### Missing Dependencies
```bash
# Install all dependencies
npm ci
```