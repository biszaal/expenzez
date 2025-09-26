# Apple/Google Pay Integration Setup Guide

This guide explains how to configure Apple/Google Pay payments for Expenzez subscriptions using RevenueCat.

## 🚀 Overview

The app now supports two payment methods:
1. **Native Payments**: Apple App Store / Google Play Store (15-30% fees)
2. **Web Payments**: Apple Pay / Google Pay via RevenueCat web (2.9% fees)

Users get to choose which payment method to use, with web payments offering significant cost savings.

## 📱 Current Status

### ✅ Implemented Features
- Environment variable support for RevenueCat API keys
- Enhanced RevenueCat service with web payment support
- Updated SubscriptionContext with new payment methods
- Modern subscription UI with payment method selection
- Automatic platform detection (iOS = Apple Pay, Android = Google Pay)
- Error handling and fallback systems
- Development mode with mock services

### 🔧 Development Mode
Currently running in development mode with mock services. To enable real payments:

## 🛠️ Setup Instructions

### 1. RevenueCat Account Setup

1. **Create RevenueCat Account**: Visit [https://app.revenuecat.com](https://app.revenuecat.com)
2. **Create New Project**: Set up your app with iOS and Android platforms
3. **Get API Keys**: Navigate to your project settings to get:
   - iOS API Key (format: `appl_xxxxxxxxxxxxxxxxxxxxxxxx`)
   - Android API Key (format: `goog_xxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. App Store Connect Setup (iOS)

1. **Create Subscription Products**:
   - Go to App Store Connect → Your App → Subscriptions
   - Create these subscription IDs:
     - `premium-monthly` - £4.99/month
     - `premium-annual` - £49.99/year

2. **Configure Subscription Groups**:
   - Create a subscription group for your premium tiers
   - Add both monthly and annual options to the group

3. **Test Environment**:
   - Create sandbox test users
   - Test purchases in iOS Simulator with sandbox accounts

### 3. Google Play Console Setup (Android)

1. **Create Subscription Products**:
   - Go to Google Play Console → Your App → Monetize → Subscriptions
   - Create these subscription IDs:
     - `premium-monthly` - £4.99/month
     - `premium-annual` - £49.99/year

2. **Configure Billing**:
   - Set up billing periods and pricing
   - Enable testing with Google Play Console test accounts

### 4. RevenueCat Dashboard Configuration

1. **Connect App Stores**:
   - iOS: Connect to App Store Connect with your developer credentials
   - Android: Upload Google Play Service Account JSON file

2. **Configure Products**:
   - Map your App Store/Play Store subscription IDs to RevenueCat
   - Create an "Offerings" configuration with packages:
     - Package ID: `monthly` → Product: `premium-monthly`
     - Package ID: `annual` → Product: `premium-annual`

3. **Enable Web Payments** (Optional):
   - Go to RevenueCat Dashboard → Web → Settings
   - Enable Stripe integration for web payments
   - Configure Apple Pay/Google Pay in Stripe dashboard
   - Add domain: `pay.rev.cat` for web checkout

### 5. Environment Variables

Create or update your environment configuration:

```bash
# .env or environment variables
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_your_actual_ios_api_key_here
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_your_actual_android_api_key_here
```

### 6. Testing the Integration

1. **Development Testing**:
   ```bash
   npm start
   # App will use mock services and show both payment options
   ```

2. **Sandbox Testing**:
   - Set your real API keys
   - Use TestFlight (iOS) or Internal Testing (Android)
   - Test with sandbox/test accounts

3. **Production Testing**:
   - Deploy to app stores
   - Test with real payments (small amounts)
   - Verify both native and web payment flows

## 💡 Key Features

### Payment Method Selection
Users see two options when purchasing:
1. **Pay with Apple Pay/Google Pay** - Web-based, lower fees (2.9%)
2. **Pay via iOS/Android** - Native platform payment (15-30% fees)

### Automatic Fallbacks
- If web payments fail, users can retry with native payments
- Development mode works without real API keys
- Graceful error handling for all payment scenarios

### Platform Compliance
- **Fully App Store Compliant**: Native payments always available
- **Web Payments Legal**: Following 2024 Epic vs Apple ruling
- **Regional Support**: US users get full web payment options

## 🔍 Troubleshooting

### Common Issues

1. **"Development Mode" Message**:
   - Check your API keys are correctly formatted
   - Ensure environment variables are loaded properly

2. **Purchase Failures**:
   - Verify products exist in App Store Connect/Play Console
   - Check RevenueCat dashboard for product mapping
   - Test with valid sandbox accounts

3. **Web Payment Not Opening**:
   - Ensure Stripe is configured in RevenueCat
   - Check that domain `pay.rev.cat` is registered in Stripe
   - Verify user's device supports web payments

### Debug Logs

The app provides detailed logging:
- `📱 [SubscriptionPlans]` - UI interactions
- `🛒 [SubscriptionContext]` - Purchase flows
- `🧪 [RevenueCat]` - Service operations
- `🌐 [RevenueCat]` - Web payment generation

## 📋 Checklist for Production

- [ ] RevenueCat API keys configured
- [ ] iOS subscription products created in App Store Connect
- [ ] Android subscription products created in Play Console
- [ ] RevenueCat products mapped to store products
- [ ] Stripe integration enabled (for web payments)
- [ ] Apple Pay/Google Pay configured in Stripe
- [ ] Sandbox testing completed
- [ ] Production testing with real payments
- [ ] App Store/Play Store review approval

## 💰 Cost Comparison

| Payment Method | Platform Fee | Processing Fee | Total Cost |
|----------------|--------------|----------------|------------|
| Native (App Store/Play) | 15-30% | 0% | 15-30% |
| Web (Apple/Google Pay) | 0% | 2.9% + $0.30 | ~2.9% |

Users save approximately **82% on fees** by choosing web payments over native platform payments.

## 🆘 Support

If you encounter issues:
1. Check RevenueCat documentation: [https://docs.revenuecat.com](https://docs.revenuecat.com)
2. Review app store guidelines for subscription setup
3. Test in sandbox environment before production deployment

---

**Note**: This integration is compliant with 2024/2025 App Store and Play Store guidelines, providing users with choice while maintaining full platform compliance.