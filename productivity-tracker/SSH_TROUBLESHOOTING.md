# SSH Troubleshooting Guide

## Error Analysis
The error you encountered indicates that the SSH agent is not running on your Windows system. This is a common issue on Windows.

## Solution Options

### Option 1: Use HTTPS Instead of SSH (Recommended for Quick Setup)
This is the easiest approach and doesn't require SSH key setup:

```bash
cd productivity-tracker
git init
git remote add origin https://github.com/Bruce-CXNPL/fcf-productivity-tracker.git
git add .
git commit -m "Initial commit: FFC Productivity Tracker"
git branch -M main
git push -u origin main
```

When prompted, enter your GitHub username and a Personal Access Token (not your password).

### Option 2: Fix SSH Agent on Windows
If you prefer to use SSH, follow these steps:

#### Step 1: Start SSH Agent
```bash
# In PowerShell (Run as Administrator)
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
```

#### Step 2: Generate SSH Key (if not already done)
```bash
ssh-keygen -t ed25519 -C "your.email@example.com"
```

#### Step 3: Add Key to SSH Agent
```bash
ssh-add ~/.ssh/id_ed25519
```

#### Step 4: Add Public Key to GitHub
1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. Go to GitHub.com → Settings → SSH and GPG keys → New SSH key
3. Paste the key and save

#### Step 5: Test SSH Connection
```bash
ssh -T git@github.com
```

### Option 3: Use GitHub Desktop (GUI Alternative)
1. Download GitHub Desktop from: https://desktop.github.com/
2. Sign in with your GitHub account
3. Clone the repository: `https://github.com/Bruce-CXNPL/fcf-productivity-tracker.git`
4. Copy your project files into the cloned folder
5. Commit and push through the GUI

## Personal Access Token Setup (for HTTPS)
If using HTTPS (Option 1), you'll need a Personal Access Token:

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with these permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and use it as your password when pushing

## Recommended Approach
For the quickest setup, I recommend **Option 1 (HTTPS)** as it avoids SSH configuration issues and gets you up and running immediately.
