# Quick GitHub Setup - HTTPS Method

## Prerequisites ✅
- [x] Git is installed on your system
- [x] You have a GitHub account
- [x] Your empty repository exists: `https://github.com/Bruce-CXNPL/fcf-productivity-tracker.git`

## Step 1: Create Personal Access Token

1. Go to GitHub.com → Sign in
2. Click your profile picture → **Settings**
3. Scroll down → **Developer settings** (bottom left)
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**
6. Name: `FFC Productivity Tracker`
7. Select permissions:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
8. **Generate token**
9. **COPY THE TOKEN** - you won't see it again!

## Step 2: Run the Setup Script

I've created an automated script for you. Simply:

1. Open File Explorer
2. Navigate to your `productivity-tracker` folder
3. Double-click `setup-git.bat`
4. Follow the prompts

**When prompted for credentials:**
- Username: Your GitHub username
- Password: **Use the Personal Access Token** (not your GitHub password)

## Alternative: Manual Commands

If you prefer to run commands manually, open PowerShell in the `productivity-tracker` folder and run:

```powershell
git init
git remote add origin https://github.com/Bruce-CXNPL/fcf-productivity-tracker.git
git add .
git commit -m "Initial commit: FFC Productivity Tracker"
git branch -M main
git push -u origin main
```

## What Gets Committed ✅

**Safe files that will be uploaded:**
- All source code (`src/` folder)
- Configuration files (`package.json`, `next.config.js`, etc.)
- Documentation files
- Database schema (`database/schema.sql`)
- `.env.local.example` (template only)

**Secure files that are excluded:**
- `.env.local` (your actual credentials)
- `node_modules/`
- `.next/` build files
- Log files and caches

## Troubleshooting

**If you get authentication errors:**
- Make sure you're using your Personal Access Token as the password
- Verify the token has `repo` permissions
- Check that your GitHub username is correct

**If git commands fail:**
- Ensure you're in the `productivity-tracker` folder
- Verify Git is installed: `git --version`

## After Setup

Once successful, you can:
1. View your project at: `https://github.com/Bruce-CXNPL/fcf-productivity-tracker`
2. Make future changes with: `git add .`, `git commit -m "message"`, `git push`
3. Set up deployment to Vercel/Netlify if desired

Your project is secure and ready for GitHub! 🚀
