@echo off
echo Setting up Git repository for FFC Productivity Tracker...
echo.

echo Step 1: Initializing Git repository...
git init

echo.
echo Step 2: Adding remote repository (HTTPS)...
git remote add origin https://github.com/Bruce-CXNPL/fcf-productivity-tracker.git

echo.
echo Step 3: Staging all files...
git add .

echo.
echo Step 4: Creating initial commit...
git commit -m "Initial commit: FFC Productivity Tracker"

echo.
echo Step 5: Setting main branch...
git branch -M main

echo.
echo Step 6: Pushing to GitHub...
echo You will be prompted for your GitHub username and Personal Access Token
git push -u origin main

echo.
echo Setup complete! Your project is now on GitHub.
pause
