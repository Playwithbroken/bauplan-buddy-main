# Quick Deployment Script for Bauplan Buddy
# Run this script to deploy your app quickly

Write-Host "🚀 Bauplan Buddy Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if build exists
if (!(Test-Path "dist")) {
    Write-Host "📦 Building application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed. Please check for errors." -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Choose deployment option:" -ForegroundColor Yellow
Write-Host "1. Deploy to Vercel (Recommended)" -ForegroundColor White
Write-Host "2. Deploy to Netlify" -ForegroundColor White
Write-Host "3. Test locally with preview" -ForegroundColor White
Write-Host "4. Show deployment guide" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "🌐 Deploying to Vercel..." -ForegroundColor Yellow
        
        # Check if Vercel CLI is installed
        $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
        if (!$vercelInstalled) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        
        Write-Host "Starting Vercel deployment..." -ForegroundColor Green
        vercel --prod
    }
    
    "2" {
        Write-Host "🌍 Deploying to Netlify..." -ForegroundColor Yellow
        
        # Check if Netlify CLI is installed
        $netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue
        if (!$netlifyInstalled) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        
        Write-Host "Starting Netlify deployment..." -ForegroundColor Green
        netlify deploy --prod --dir=dist
    }
    
    "3" {
        Write-Host "🔍 Starting local preview..." -ForegroundColor Yellow
        Write-Host "Your app will be available at: http://localhost:4173" -ForegroundColor Green
        npm run preview
    }
    
    "4" {
        Write-Host "📚 Opening deployment guide..." -ForegroundColor Yellow
        if (Test-Path "DEPLOYMENT_GUIDE.md") {
            notepad "DEPLOYMENT_GUIDE.md"
        } else {
            Write-Host "❌ Deployment guide not found." -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
Write-Host "Need help? Check DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Cyan