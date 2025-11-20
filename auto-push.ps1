# ============================================
# Auto-Push Script for GitHub
# ============================================
# Repository: GroupALogistics-backend

$repoPath = "C:\Users\shiv0\backend"
$branch = "main"
$checkInterval = 60  # Check every 60 seconds

Write-Host "╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🤖 AUTO-PUSH TO GITHUB ENABLED 🤖    ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`nRepository: GroupALogistics-backend" -ForegroundColor Gray
Write-Host "GitHub: https://github.com/shiv48646/GroupALogistics-backend" -ForegroundColor Gray
Write-Host "Branch: $branch" -ForegroundColor Gray
Write-Host "Check Interval: $checkInterval seconds" -ForegroundColor Gray
Write-Host "`n👀 Watching for changes... (Press Ctrl+C to stop)`n" -ForegroundColor Yellow

$lastPushTime = Get-Date

while ($true) {
    try {
        Set-Location $repoPath
        
        # Check for changes
        $status = git status --porcelain 2>$null
        
        if ($status) {
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 📝 Changes detected!" -ForegroundColor Yellow
            
            # Show what changed
            $changedFiles = ($status | Measure-Object).Count
            Write-Host "   Files changed: $changedFiles" -ForegroundColor Gray
            
            # Add all changes
            git add . 2>$null
            
            # Create commit message
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $commitMessage = "Auto-commit: Changes at $timestamp"
            
            # Commit
            $commitOutput = git commit -m "$commitMessage" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                # Push to GitHub
                Write-Host "   🚀 Pushing to GitHub..." -ForegroundColor Cyan
                $pushResult = git push origin $branch 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "   ✅ Successfully pushed to GitHub!" -ForegroundColor Green
                    Write-Host "   🔗 https://github.com/shiv48646/GroupALogistics-backend" -ForegroundColor DarkGray
                    $lastPushTime = Get-Date
                } else {
                    Write-Host "   ⚠️  Push failed: $pushResult" -ForegroundColor Red
                }
            }
            
            Write-Host ""
        } else {
            # Show we're still watching (every 5 minutes)
            $timeSinceLastPush = (Get-Date) - $lastPushTime
            if ($timeSinceLastPush.TotalMinutes -ge 5) {
                Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 👁️  Still watching... (No changes)" -ForegroundColor DarkGray
                $lastPushTime = Get-Date
            }
        }
        
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds $checkInterval
}
