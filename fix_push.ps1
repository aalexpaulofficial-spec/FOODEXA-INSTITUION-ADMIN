#!/usr/bin/env powershell

# Fix git push issue
git remote -v

# Check current branch
:git branch

# Try to push to master branch
try {
    git push origin master
    Write-Host "Push successful!"
}
catch {
    Write-Host "Error pushing to master. Trying alternative..."
    # Try to push to main branch
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Push to main branch successful!"
    } else {
        Write-Host "Could not push. Need to set up remote or check permissions."
        Write-Host "Current remotes:"
        git remote -v
    }
}