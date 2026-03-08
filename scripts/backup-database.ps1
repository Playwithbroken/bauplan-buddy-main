# Database Backup Script for Bauplan Buddy (PowerShell)
# Schedule with Windows Task Scheduler to run daily at 2 AM
# Usage: .\backup-database.ps1

param(
    [string]$BackupDir = "C:\backups\bauplan-buddy",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"
$Date = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "bauplan_backup_$Date.sql"
$CompressedFile = "$BackupFile.gz"

Write-Host "Starting database backup..." -ForegroundColor Green

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

# Get database URL from environment or .env file
$DatabaseUrl = $env:DATABASE_URL
if (-not $DatabaseUrl) {
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        $dbLine = $envContent | Where-Object { $_ -match "^DATABASE_URL=" }
        if ($dbLine) {
            $DatabaseUrl = ($dbLine -split "=", 2)[1]
        }
    }
}

if (-not $DatabaseUrl) {
    throw "DATABASE_URL not found. Set it as environment variable or in .env file"
}

# Perform backup using pg_dump
Write-Host "Creating database backup: $BackupFile" -ForegroundColor Cyan
$backupPath = Join-Path $BackupDir $BackupFile

# Execute pg_dump (assumes PostgreSQL client tools are installed)
pg_dump $DatabaseUrl | Out-File -FilePath $backupPath -Encoding UTF8

if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed"
}

# Compress the backup
Write-Host "Compressing backup..." -ForegroundColor Cyan
Compress-Archive -Path $backupPath -DestinationPath (Join-Path $BackupDir $CompressedFile) -Force
Remove-Item $backupPath

Write-Host "Backup created: $CompressedFile" -ForegroundColor Green

# Upload to cloud storage (optional - uncomment if using Azure/AWS)
# Option 1: Azure Blob Storage
# if (Get-Command az -ErrorAction SilentlyContinue) {
#     Write-Host "Uploading to Azure Blob Storage..." -ForegroundColor Cyan
#     az storage blob upload --account-name bauplanbackups `
#         --container-name database-backups `
#         --name $CompressedFile `
#         --file (Join-Path $BackupDir $CompressedFile)
# }

# Option 2: AWS S3
# if (Get-Command aws -ErrorAction SilentlyContinue) {
#     Write-Host "Uploading to AWS S3..." -ForegroundColor Cyan
#     aws s3 cp (Join-Path $BackupDir $CompressedFile) "s3://bauplan-backups/database/"
# }

# Clean up old backups
Write-Host "Cleaning up old backups..." -ForegroundColor Cyan
$cutoffDate = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -Path $BackupDir -Filter "bauplan_backup_*.gz" | 
    Where-Object { $_.LastWriteTime -lt $cutoffDate } |
    ForEach-Object {
        Write-Host "Deleting old backup: $($_.Name)" -ForegroundColor Yellow
        Remove-Item $_.FullName
    }

Write-Host "`n✅ Backup completed successfully!" -ForegroundColor Green
Write-Host "Backup location: $(Join-Path $BackupDir $CompressedFile)" -ForegroundColor Green
