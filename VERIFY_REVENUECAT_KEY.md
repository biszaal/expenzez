# Verify Your RevenueCat Key Configuration

## ✅ Your Current Keys

Your `.env.local` shows:
```
iOS Key: appl_yfPFpbhaPCTmblZKDJMHMyRKHKH
```

The format is **CORRECT** (`appl_` prefix), but RevenueCat is rejecting it.

---

## 🔍 Possible Issues

### 1. Wrong Project/App Selected

The key might be from a different app in your RevenueCat account.

**Verify:**
1. Go to https://app.revenuecat.com
2. Check which **project** is selected in the top-left dropdown
3. Make sure you're on the **Expenzez** project

### 2. Bundle ID Mismatch

Your app's Bundle ID is: `com.biszaal.expenzez`

The key must be from an iOS app configured with this exact Bundle ID.

**Verify:**
1. In RevenueCat dashboard, click **"Apps"** in left sidebar
2. Check the iOS app configuration
3. Verify **Bundle ID** is: `com.biszaal.expenzez`

### 3. Key Revoked or Invalid

The key might have been revoked or regenerated.

**Fix:**
1. Go to RevenueCat → **API Keys**
2. Under **"Public app-specific API keys"**
3. Click **"Show"** next to App Store (iOS)
4. Copy the CURRENT key
5. Replace in `.env.local`

---

## 🔄 Step-by-Step Verification

### Step 1: Check RevenueCat Project

```
1. Go to: https://app.revenuecat.com
2. Top-left corner: Verify project name is "Expenzez"
3. If not, switch to correct project
```

### Step 2: Check iOS App Configuration

```
1. Click "Apps" in left sidebar
2. Should see an iOS app listed
3. Click on it
4. Verify:
   - Platform: Apple App Store
   - Bundle ID: com.biszaal.expenzez
   - Status: Active
```

### Step 3: Get Fresh API Key

```
1. Click "API Keys" in left sidebar
2. Find section: "Public app-specific API keys"
3. Under "App Store (iOS)":
   - Click "Show"
   - Click "Copy" icon
4. Paste in .env.local
```

### Step 4: Verify Bundle ID Match

```bash
# Check your app's Bundle ID
cat app.json | grep bundleIdentifier
# Should show: "bundleIdentifier": "com.biszaal.expenzez"
```

---

## 🚨 Common Mistakes

### ❌ Multiple Projects in RevenueCat

If you have multiple projects (test, prod, etc.), make sure you're using the key from the **Expenzez production project**.

### ❌ Bundle ID Typo

The Bundle ID in RevenueCat MUST exactly match:
```
com.biszaal.expenzez
```

Not:
- `com.biszaal.expenzez.test`
- `com.biszaal.expenzez-app`
- `com.biszal.expenzez` (missing 'a')

### ❌ Using Play Store Key for iOS

Make sure you copied from **"App Store (iOS)"** not **"Google Play (Android)"**

---

## ✅ Test After Fix

1. Update `.env.local` with fresh key
2. Restart Expo:
   ```bash
   npx expo start --clear
   ```
3. Check console logs:
   ```
   [RevenueCat] ✅ SDK configured successfully
   ```

---

## 🆘 Still Not Working?

### Option 1: Create New App in RevenueCat

If the current setup is confused:

1. Go to RevenueCat → **"Apps"**
2. Click **"+ New App"**
3. Configure:
   - Name: `Expenzez iOS`
   - Platform: `Apple App Store`
   - Bundle ID: `com.biszaal.expenzez`
4. Save
5. Go to **API Keys** → Copy new iOS key
6. Update `.env.local`

### Option 2: Check RevenueCat Status

Check if RevenueCat is having issues:
- https://status.revenuecat.com

---

## 📸 What You Should See in RevenueCat

**API Keys Page:**
```
┌─────────────────────────────────────────┐
│ Public app-specific API keys            │
├─────────────────────────────────────────┤
│ App Store (iOS)                         │
│ com.biszaal.expenzez                    │
│ appl_xxxxxxxxxxxx [Show] [Copy]         │
│                                         │
│ Google Play (Android)                   │
│ (not configured)                        │
└─────────────────────────────────────────┘
```

The key under "App Store (iOS)" should show your Bundle ID.

---

**Next:** Verify these settings in RevenueCat dashboard, get a fresh key if needed, and restart Expo.
