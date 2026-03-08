# Windows PowerShell Utilities for Web Development
# This script provides Windows equivalents for common Unix commands

# Function to display first N lines (equivalent to 'head')
function Show-Head {
    param(
        [Parameter(Mandatory=$true, ValueFromPipeline=$true)]
        [string[]]$InputObject,
        [int]$Lines = 10
    )
    
    process {
        $InputObject | Select-Object -First $Lines
    }
}

# Function to display last N lines (equivalent to 'tail')
function Show-Tail {
    param(
        [Parameter(Mandatory=$true, ValueFromPipeline=$true)]
        [string[]]$InputObject,
        [int]$Lines = 10
    )
    
    process {
        $InputObject | Select-Object -Last $Lines
    }
}

# Function to test web server response
function Test-WebServer {
    param(
        [string]$Url = "http://localhost:8080",
        [int]$Lines = 10
    )
    
    try {
        Write-Host "Testing web server at: $Url" -ForegroundColor Green
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Cyan
        Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Cyan
        Write-Host "First $Lines lines of content:" -ForegroundColor Yellow
        
        $response.Content -split "`n" | Select-Object -First $Lines | ForEach-Object {
            Write-Host $_ -ForegroundColor White
        }
        
        return $true
    }
    catch {
        Write-Host "Error testing web server: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to monitor development server logs
function Watch-DevServer {
    param(
        [string]$LogFile = "dev-server.log",
        [int]$TailLines = 20
    )
    
    if (Test-Path $LogFile) {
        Write-Host "Monitoring last $TailLines lines of $LogFile" -ForegroundColor Green
        Get-Content $LogFile -Tail $TailLines -Wait
    } else {
        Write-Host "Log file not found: $LogFile" -ForegroundColor Red
    }
}

# Function to check if port is in use
function Test-Port {
    param(
        [int]$Port = 8080,
        [string]$Computer = "localhost"
    )
    
    $connection = Test-NetConnection -ComputerName $Computer -Port $Port -InformationLevel Quiet
    if ($connection) {
        Write-Host "Port $Port is open on $Computer" -ForegroundColor Green
    } else {
        Write-Host "Port $Port is not accessible on $Computer" -ForegroundColor Red
    }
    return $connection
}

# Function to quickly check application health
function Test-AppHealth {
    Write-Host "=== Bauplan Buddy Health Check ===" -ForegroundColor Magenta
    
    # Check if development server port is open
    Write-Host "`n1. Checking development server port..." -ForegroundColor Yellow
    $portOpen = Test-Port -Port 8080
    
    if ($portOpen) {
        # Test web server response
        Write-Host "`n2. Testing web server response..." -ForegroundColor Yellow
        $serverWorking = Test-WebServer -Url "http://localhost:8080" -Lines 5
        
        if ($serverWorking) {
            Write-Host "`n3. Checking for React app mount..." -ForegroundColor Yellow
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing
                if ($response.Content -match "id=`"root`"") {
                    Write-Host "✓ React app container found" -ForegroundColor Green
                } else {
                    Write-Host "✗ React app container not found" -ForegroundColor Red
                }
                
                if ($response.Content -match "emergency|unresponsive") {
                    Write-Host "⚠ Emergency handling code detected" -ForegroundColor Yellow
                } else {
                    Write-Host "✓ No emergency state detected" -ForegroundColor Green
                }
            }
            catch {
                Write-Host "✗ Error checking React app: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`n=== Health Check Complete ===" -ForegroundColor Magenta
}

# Export functions
Export-ModuleMember -Function Show-Head, Show-Tail, Test-WebServer, Watch-DevServer, Test-Port, Test-AppHealth

# Usage examples
Write-Host @"

=== Windows PowerShell Utilities for Bauplan Buddy ===

Usage Examples:

1. Test web server and show first 10 lines:
   Test-WebServer -Url "http://localhost:8080" -Lines 10

2. Check if development server port is open:
   Test-Port -Port 8080

3. Run complete health check:
   Test-AppHealth

4. Show first 10 lines of a web response:
   (Invoke-WebRequest "http://localhost:8080").Content -split "`n" | Show-Head -Lines 10

5. Monitor development server (if logging to file):
   Watch-DevServer -LogFile "dev-server.log"

Windows PowerShell Equivalents:
- head -10     → | Select-Object -First 10
- tail -10     → | Select-Object -Last 10
- curl URL     → Invoke-WebRequest -Uri URL
- grep pattern → | Select-String "pattern"
- wc -l        → | Measure-Object -Line

"@ -ForegroundColor Cyan