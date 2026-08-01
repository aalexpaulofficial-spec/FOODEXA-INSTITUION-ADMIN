#!/usr/bin/env powershell

# Fix git configuration and push

# Set up git configuration (replace with your actual email and name)
$gitEmail = "aalexpaulofficial-spec@gmail.com"
$gitName = "aalexpaulofficial-spec"

if ([string]::IsNullOrEmpty($gitEmail)) {
    $gitEmail = "dev@example.com"
}
if ([string]::IsNullOrEmpty($gitName)) {
    $gitName = "Developer"
}

# Configure git
$env:GIT_AUTHOR_NAME = $gitName
$env:GIT_AUTHOR_EMAIL = $gitEmail
$env:GIT_COMMITTER_NAME = $gitName
$env:GIT_COMMITTER_EMAIL = $gitEmail

# Check if remote exists
$remoteExists = git remote show origin -n 2>$null
if (-not $remoteExists) {
    Write-Host "No remote found. Setting up origin..."
    # Use the correct repository URL from the user's git log
    git remote add origin "https://github.com/aalexpaulofficial-spec/FOODEXA-INSTITUION-ADMIN.git"
}

# Try to push to master first
try {
    Write-Host "Attempting to push to master branch..."
    git push origin master
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push to master branch successful!"
        exit 0
    }
}
catch {
    Write-Host "❌ Failed to push to master: $($_.Exception.Message)"
}

# Try to push to main branch if master failed
try {
    Write-Host "Attempting to push to main branch..."
    git push origin main
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Push to main branch successful!"
        exit 0
    }
}
catch {
    Write-Host "❌ Failed to push to main: $($_.Exception.Message)"
}

# If both failed, check current branches
Write-Host "❌ Both pushes failed!"
Write-Host "Current branches:"
git branch
Write-Host "Remote URLs:"
git remote -v
Write-Host "You'll need to manually push using: git push origin <branch_name>"