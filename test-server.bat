@echo off
echo =====================================
echo Bauplan Buddy Development Server Test
echo =====================================

echo.
echo 1. Testing if port 8080 is accessible...
powershell -Command "if (Test-NetConnection localhost -Port 8080 -InformationLevel Quiet) { Write-Host 'Port 8080 is OPEN' -ForegroundColor Green } else { Write-Host 'Port 8080 is CLOSED' -ForegroundColor Red }"

echo.
echo 2. Testing HTTP response...
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8080' -UseBasicParsing -TimeoutSec 5; Write-Host ('HTTP Status: ' + $r.StatusCode) -ForegroundColor Green; Write-Host ('Content Size: ' + $r.Content.Length + ' bytes') -ForegroundColor Cyan } catch { Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red }"

echo.
echo 3. Checking for React app...
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8080' -UseBasicParsing; if ($r.Content -match 'id=\"root\"') { Write-Host 'React app container FOUND' -ForegroundColor Green } else { Write-Host 'React app container NOT FOUND' -ForegroundColor Yellow } } catch { Write-Host 'Could not check React app' -ForegroundColor Red }"

echo.
echo 4. Checking for emergency handling...
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8080' -UseBasicParsing; if ($r.Content -match 'emergency|unresponsive') { Write-Host 'Emergency handling code DETECTED' -ForegroundColor Yellow } else { Write-Host 'No emergency state detected' -ForegroundColor Green } } catch { Write-Host 'Could not check emergency handling' -ForegroundColor Red }"

echo.
echo 5. First 5 lines of HTML...
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8080' -UseBasicParsing; $lines = $r.Content -split \"`n\"; for ($i=0; $i -lt [Math]::Min(5, $lines.Length); $i++) { Write-Host $lines[$i] } } catch { Write-Host 'Could not retrieve content' -ForegroundColor Red }"

echo.
echo =====================================
echo Test completed
echo =====================================
pause