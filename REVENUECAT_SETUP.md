# RevenueCat Setup Guide

## 🎯 **Quick Setup Steps**

### 1. **Create RevenueCat Account**

- Go to [RevenueCat Dashboard](https://app.revenuecat.com/)
- Sign up for a free account
- Create a new project for "Expenzez"

### 2. **Get API Keys**

- In RevenueCat Dashboard, go to **Project Settings** → **API Keys**
- Copy your **iOS API Key** and **Android API Key**

### 3. **Configure Environment Variables**

Create a `.env.production` file in the frontend directory:

```bash
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=your_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=your_android_api_key_here
```

### 4. **Configure Products in RevenueCat**

- Go to **Products** in RevenueCat Dashboard
- Add your App Store products:
  - `com.expenzez.premium.monthly` (Monthly Plan)
  - `com.expenzez.premium.annual` (Annual Plan)

### 5. **Set Up Entitlements**

- Go to **Entitlements** in RevenueCat Dashboard
- Create an entitlement called `premium`
- Attach both products to this entitlement

### 6. **Rebuild and Deploy**

```bash
# Build new production version
eas build --platform ios --profile production

# Deploy backend changes
cd ../expenzez-backend
serverless deploy
```

## 🔧 **Current Status**

✅ **App Store Connect**: Products created with 14-day free trials
⏳ **RevenueCat**: Needs API key configuration
⏳ **Frontend**: Ready for RevenueCat integration
⏳ **Backend**: Ready for webhook handling

## 📱 **Testing**

Once configured:

1. Build and install the app
2. Go to Account → Settings → Subscription
3. Select a plan and test the purchase flow
4. Verify 14-day free trial works
5. Test subscription restoration

## 🆘 **Troubleshooting**

- **"RevenueCat Setup Required"**: API keys not configured
- **"No packages available"**: Products not linked in RevenueCat
- **Purchase fails**: Check App Store Connect product status
- **Trial not working**: Verify introductory offers in App Store Connect

## 📚 **Resources**

- [RevenueCat Documentation](https://docs.revenuecat.com/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Expenzez Subscription Guide](../SUBSCRIPTION_GUIDE.md)
