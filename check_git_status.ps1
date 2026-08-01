$ErrorActionPreference = "Stop"

# Check git status
Write-Output "Checking git status..."
git status

Write-Output "Checking git log..."
git log --oneline -1

Write-Output "Checking git diff..."
git diff --name-only