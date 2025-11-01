# Testing RevenueCat Subscriptions in Expo Go

You can now test subscriptions in Expo Go without building TestFlight versions!

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your RevenueCat API Keys

1. Go to RevenueCat dashboard: https://app.revenuecat.com
2. Select your **Expenzez** project
3. Navigate to **API Keys** (left sidebar)
4. Copy the **Public SDK Key** for iOS and Android
   - **iOS**: Starts with `appl_`
   - **Android**: Starts with `goog_`

### Step 2: Create Local Environment File

```bash
cd expenzez-frontend

# Copy the template
cp .env.local.template .env.local

# Edit .env.local and paste your REAL API keys
nano .env.local
```

**Your `.env.local` should look like:**
```env
# RevenueCat API Keys (REAL KEYS - DO NOT COMMIT)
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxx

# Google Maps API Key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# API Base URL
EXPO_PUBLIC_API_BASE_URL=https://jvgwbst4og.execute-api.eu-west-2.amazonaws.com

# Environment
EXPO_PUBLIC_ENVIRONMENT=development
```

### Step 3: Install Dependencies

```bash
# Make sure react-native-purchases is installed
npm install

# Or explicitly install it
npx expo install react-native-purchases
```

### Step 4: Start Expo Go

```bash
# Clear cache and start
npx expo start --clear
```

### Step 5: Test Subscriptions

1. Open app in Expo Go on your iPhone
2. Navigate to subscription screen
3. Check console logs - you should see:
   ```
   [RevenueCat] 🚀 Initializing SDK...
   [RevenueCat] ✅ SDK module loaded successfully
   [RevenueCat] iOS key present: true
   [RevenueCat] ✅ SDK configured successfully
   ```

## ✅ What Works in Expo Go

- ✅ SDK initialization
- ✅ Product fetching
- ✅ Purchase flow (sandbox mode)
- ✅ Restore purchases
- ✅ Subscription status checking

## ⚠️ Important Notes

### Security

**`.env.local` contains REAL API keys - NEVER commit it!**

It's already in `.gitignore`, but double-check:
```bash
# Verify .env.local is ignored
git status
# Should NOT show .env.local
```

### Sandbox Testing

**In Expo Go, all purchases are in SANDBOX mode**
- You won't be charged real money
- Use App Store sandbox test account
- Test subscriptions expire faster (24 hours = 5 minutes in sandbox)

### Production vs Expo Go

| Environment | API Keys Source | Log Level | Purchases |
|-------------|-----------------|-----------|-----------|
| **Expo Go** | `.env.local` | DEBUG | Sandbox |
| **TestFlight** | EAS Secrets | ERROR | Sandbox |
| **Production** | EAS Secrets | ERROR | Real |

## 🐛 Troubleshooting

### "Subscriptions Not Available" in Expo Go

**Check console logs for:**
```
[RevenueCat] ❌ No API key found
```

**Solution:**
1. Verify `.env.local` exists in `expenzez-frontend/`
2. Verify it contains real API keys (starts with `appl_` or `goog_`)
3. Restart Expo: `npx expo start --clear`

### "Failed to import SDK"

**Solution:**
```bash
npx expo install react-native-purchases
```

### Purchase Flow Not Working

**Solution:**
1. Sign out of App Store on your device
2. Go to: Settings → App Store → Sandbox Account
3. Sign in with Apple sandbox test account
4. Try purchase again

## 📚 Resources

- **RevenueCat Expo Tutorial**: https://www.revenuecat.com/blog/engineering/expo-in-app-purchase-tutorial/
- **RevenueCat Dashboard**: https://app.revenuecat.com
- **Create Sandbox Test Accounts**: https://appstoreconnect.apple.com → Users and Access → Sandbox Testers

## 🚀 When to Build TestFlight

**You need TestFlight/Production builds for:**
- Final testing before App Store submission
- Testing with real App Store products
- Beta testing with real users
- Production release

**Use Expo Go for:**
- Rapid development testing
- Quick iteration on subscription UI
- Testing subscription flow logic
- Debugging RevenueCat integration

---

**Happy Testing! 🎉**
