# Simple Setup Guide - No Technical Experience Required

## What You Need to Do
You need to create one simple text file to connect your app to the database you just set up.

## Step-by-Step Instructions

### Step 1: Create a New File
1. In your file explorer, go to the `productivity-tracker` folder
2. Right-click in an empty space
3. Select "New" → "Text Document"
4. Name it exactly: `.env.local` (including the dot at the beginning)
5. If Windows asks about changing the file extension, click "Yes"

### Step 2: Copy and Paste This Text
Open the `.env.local` file you just created and paste this text exactly:

```
NEXT_PUBLIC_SUPABASE_URL=https://bkpmkuararzrqkomqbbot.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcG1rdWFyYXJ6cnFrb21xYmJvdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1MDg2NjY5LCJleHAiOjIwNTA2NjI2Njl9.ya3pc3Mi0iJzdXBhYmFzZSIsInJlZiI6ImJrcG1rdWFyYXJ6cnFrb21xYmJvdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM1MDg2NjY5LCJleHAiOjIwNTA2NjI2Njl9

ADMIN_PASSWORD=admin123
NEXT_PUBLIC_DEFAULT_TIMEZONE=Australia/Sydney
```

### Step 3: Save the File
1. Press Ctrl+S to save
2. Close the file

### Step 4: Test Your App
1. Open Command Prompt (search "cmd" in Windows start menu)
2. Type: `cd "c:\FFC Workload Manager\productivity-tracker"`
3. Press Enter
4. Type: `npm run dev`
5. Press Enter
6. Wait for it to say "Ready" (might take a minute)
7. Open your web browser and go to: http://localhost:3000

## What Should Happen
- You should see your productivity tracking app
- You should see staff names like "John Smith", "Sarah Johnson", etc.
- You should see task categories like "ONBOARDING", "FRAUD", etc.
- If you see these, everything is working!

## If Something Goes Wrong
- Make sure the `.env.local` file is in the `productivity-tracker` folder
- Make sure you copied the text exactly as shown above
- Make sure there are no extra spaces or characters

## What This File Does
This file tells your app how to connect to your Supabase database. Think of it like giving your app the address and key to your database.

That's it! You're done with the technical setup.
