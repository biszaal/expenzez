# How to Get the CORRECT RevenueCat API Key

## ❌ Error You're Seeing

```
Error: Invalid API key. Use your Web Billing API key.
```

This means you copied the **WRONG key type**.

---

## ✅ Get the Correct Key (Follow These EXACT Steps)

### Step 1: Go to RevenueCat Dashboard

1. Open: https://app.revenuecat.com
2. Log in to your account
3. Select your **Expenzez** project (if you have multiple)

### Step 2: Find the Public SDK Key

1. Click **"Projects"** in the top navigation
2. Select **"API keys"** from the left sidebar
3. Look for the section called **"Public app-specific API keys"**

### Step 3: Copy the Correct Key

**For iOS:**
- Look for the key that starts with `appl_`
- Example: `appl_AbCdEfGhIjKlMnOpQrStUvWxYz123456`
- Click the **"Show"** button to reveal it
- Click **"Copy"** icon

**For Android:**
- Look for the key that starts with `goog_`
- Example: `goog_AbCdEfGhIjKlMnOpQrStUvWxYz123456`

---

## ⚠️ Common Mistakes - DON'T Use These Keys

### ❌ WRONG: Secret Key
- Usually labeled "Secret key" or "API secret"
- Used for server-side only
- Often longer and more complex

### ❌ WRONG: Web Billing API Key
- Used for web subscriptions
- NOT for mobile apps

### ❌ WRONG: Stripe/Play Store keys
- These are separate from RevenueCat

---

## 📸 Visual Guide

**What You Should See:**

```
┌─────────────────────────────────────────────────┐
│ Public app-specific API keys                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ App Store (iOS)                                  │
│ appl_xxxxxxxxxxxxxxxxxxxx [Show] [Copy]         │
│                                                  │
│ Google Play (Android)                            │
│ goog_xxxxxxxxxxxxxxxxxxxx [Show] [Copy]         │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## ✅ Update Your .env.local

After copying the correct keys:

```bash
cd /Users/bishalaryal/Documents/Github/expenzez/expenzez-frontend

# Edit .env.local
nano .env.local
```

**Paste the keys (must start with appl_ or goog_):**

```env
# RevenueCat API Keys - MUST START WITH appl_ or goog_
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_real_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_real_key_here
```

**Save the file:**
- Press `Ctrl + O` (save)
- Press `Enter` (confirm)
- Press `Ctrl + X` (exit)

---

## 🔄 Restart Expo

```bash
# Stop current Expo server (Ctrl+C)
# Then restart with clear cache
npx expo start --clear
```

---

## ✅ Verify It Works

**Expected Console Logs:**
```
[RevenueCat] 🚀 Initializing SDK...
[RevenueCat] ✅ SDK module loaded successfully
[RevenueCat] iOS key present: true
[RevenueCat] ✅ SDK configured successfully
```

**No more "Invalid API key" error!**

---

## 🆘 Still Not Working?

### Check 1: Key Format

```bash
# View your .env.local
cat .env.local | grep REVENUECAT
```

**Should show:**
```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxx...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxx...
```

### Check 2: No Extra Spaces

Keys should have **NO spaces** before or after:
```env
# ✅ CORRECT
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_12345

# ❌ WRONG (space after =)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY= appl_12345

# ❌ WRONG (quotes)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY="appl_12345"
```

### Check 3: File Saved

Make sure you actually saved `.env.local`:
```bash
ls -la .env.local
# Should show file exists with recent timestamp
```

---

## 📚 More Help

- **RevenueCat Key Docs**: https://www.revenuecat.com/docs/authentication
- **RevenueCat Dashboard**: https://app.revenuecat.com

---

**Once you have the correct `appl_` key, restart Expo and it will work!**
