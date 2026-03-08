# Bauplan Buddy Server Health Check
# This script tests the development server without command line parsing issues

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "Bauplan Buddy Development Server Test" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# Test 1: Port accessibility
Write-Host "`n1. Testing port 8080..." -ForegroundColor Yellow
try {
    $portTest = Test-NetConnection -ComputerName localhost -Port 8080 -InformationLevel Quiet
    if ($portTest) {
        Write-Host "   ✓ Port 8080 is ACCESSIBLE" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Port 8080 is NOT accessible" -ForegroundColor Red
        Write-Host "   Make sure the development server is running with 'npm run dev'" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "   ✗ Error testing port: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: HTTP Response
Write-Host "`n2. Testing HTTP response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✓ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✓ Content Size: $($response.Content.Length) bytes" -ForegroundColor Cyan
    
    # Store content for further tests
    $content = $response.Content
} catch {
    Write-Host "   ✗ HTTP Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: React App Detection
Write-Host "`n3. Checking React app..." -ForegroundColor Yellow
if ($content -match 'id="root"') {
    Write-Host "   ✓ React app container FOUND" -ForegroundColor Green
} else {
    Write-Host "   ⚠ React app container NOT FOUND" -ForegroundColor Yellow
}

if ($content -match "Bauplan Buddy") {
    Write-Host "   ✓ App title FOUND" -ForegroundColor Green
} else {
    Write-Host "   ⚠ App title NOT FOUND" -ForegroundColor Yellow
}

# Test 4: Emergency Handling
Write-Host "`n4. Checking emergency handling..." -ForegroundColor Yellow
if ($content -match "emergency|unresponsive|EMERGENCY") {
    Write-Host "   ✓ Emergency handling code DETECTED" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Emergency handling code NOT FOUND" -ForegroundColor Yellow
}

# Test 5: Loading Screen
Write-Host "`n5. Checking loading mechanisms..." -ForegroundColor Yellow
if ($content -match "loading-screen") {
    Write-Host "   ✓ Loading screen element FOUND" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Loading screen element NOT FOUND" -ForegroundColor Yellow
}

if ($content -match "app-ready") {
    Write-Host "   ✓ App ready class mechanism FOUND" -ForegroundColor Green
} else {
    Write-Host "   ⚠ App ready class mechanism NOT FOUND" -ForegroundColor Yellow
}

# Test 6: Show first few lines
Write-Host "`n6. First 10 lines of HTML:" -ForegroundColor Yellow
$lines = $content -split "`n"
for ($i = 0; $i -lt [Math]::Min(10, $lines.Length); $i++) {
    $line = $lines[$i].Trim()
    if ($line -ne "") {
        Write-Host "   $($i+1): $line" -ForegroundColor White
    }
}

# Test 7: Performance check
Write-Host "`n7. Performance metrics..." -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
    $testResponse = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 5
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 1000) {
        Write-Host "   ✓ Response time: ${responseTime}ms (Good)" -ForegroundColor Green
    } elseif ($responseTime -lt 3000) {
        Write-Host "   ⚠ Response time: ${responseTime}ms (Acceptable)" -ForegroundColor Yellow
    } else {
        Write-Host "   ✗ Response time: ${responseTime}ms (Slow)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ✗ Performance test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=========================================" -ForegroundColor Magenta
Write-Host "Health Check Complete" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# Summary
Write-Host "`nQuick Commands:" -ForegroundColor Cyan
Write-Host "  • Run this test again: .\test-server-health.ps1" -ForegroundColor White
Write-Host "  • Open in browser: start http://localhost:8080" -ForegroundColor White
Write-Host "  • Check dev server: npm run dev" -ForegroundColor White
Write-Host "  • Emergency reload: Ctrl+Shift+R in browser" -ForegroundColor White