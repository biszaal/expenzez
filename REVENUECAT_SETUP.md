# RevenueCat In-App Purchase Setup Guide

## Issue
The purchase flow shows "Purchase Failed: There was an issue processing your purchase" because the in-app purchase products are not configured in App Store Connect and RevenueCat.

## Required Setup Steps

### 1. App Store Connect Configuration

1. **Login to App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Navigate to your app: "Expenzez" (Bundle ID: `com.biszaal.expenzez`)

2. **Create In-App Purchases**
   - Go to Features > In-App Purchases
   - Click the "+" button to create new subscriptions
   - Create TWO auto-renewable subscriptions:

#### Monthly Subscription
- **Product ID**: `expenzez_premium_monthly`
- **Reference Name**: Expenzez Premium Monthly
- **Subscription Group**: Create new group "Premium" (if not exists)
- **Subscription Duration**: 1 Month
- **Price**: £4.99 (Tier 7)
- **Introductory Offer**: 14 Days Free Trial
  - Type: Free trial
  - Duration: 14 days
  - Number of periods: 1
- **Localizations**:
  - Name: Premium Monthly
  - Description: Get unlimited access to all premium features with automatic monthly renewal.

#### Annual Subscription
- **Product ID**: `expenzez_premium_annual`
- **Reference Name**: Expenzez Premium Annual
- **Subscription Group**: Premium (same as above)
- **Subscription Duration**: 1 Year
- **Price**: £49.99 (Tier 49)
- **Introductory Offer**: 14 Days Free Trial
  - Type: Free trial
  - Duration: 14 days
  - Number of periods: 1
- **Localizations**:
  - Name: Premium Annual
  - Description: Save 17% with annual subscription. Unlimited access to all premium features.

3. **Submit for Review**
   - Add screenshots/metadata for the subscriptions
   - Submit for Apple review (can take 24-48 hours)

### 2. RevenueCat Dashboard Configuration

1. **Login to RevenueCat**
   - Go to https://app.revenuecat.com
   - Select your "Expenzez" project

2. **Configure Products**
   - Go to Products tab
   - Click "Add Products"
   - Add both product IDs:
     - `expenzez_premium_monthly`
     - `expenzez_premium_annual`
   - Ensure they're marked as "Auto-renewable subscriptions"

3. **Create Entitlement**
   - Go to Entitlements tab
   - Create entitlement with identifier: `premium`
   - Attach both products to this entitlement

4. **Configure Offering**
   - Go to Offerings tab
   - Create or edit "Default" offering
   - Add both packages:
     - Package 1: `expenzez_premium_monthly` (Monthly)
     - Package 2: `expenzez_premium_annual` (Annual)

5. **Verify API Keys**
   - Go to API Keys tab
   - Confirm your iOS API key matches the one in `.env`:
     - Current: `appl_yfPFpbhaPCTmblZKDJMHMyRKhKH`
   - If different, update `.env` file

### 3. Testing Before Production

#### Sandbox Testing
1. **Create Sandbox Test User**
   - In App Store Connect: Users and Access > Sandbox Testers
   - Create a test account

2. **Test on Device**
   - Sign out of production App Store on device
   - Install TestFlight build
   - Use sandbox test account to test purchases
   - Verify 14-day trial and subscription flow

#### Production Testing Checklist
- [ ] Products created in App Store Connect
- [ ] Products approved by Apple (24-48 hours)
- [ ] Products configured in RevenueCat
- [ ] Entitlement created and linked
- [ ] Offering configured with correct package IDs
- [ ] API key verified in `.env`
- [ ] Sandbox testing completed successfully
- [ ] Production build submitted to App Store

## Current Status

✅ Code implementation is correct
✅ API key is configured
❌ Products not created in App Store Connect
❌ Products not configured in RevenueCat

## Timeline

- **Immediate**: Create products in App Store Connect
- **24-48 hours**: Wait for Apple approval
- **After approval**: Configure in RevenueCat
- **Testing**: Verify purchase flow works

## Alternative: Mock Trial (Temporary)

Until products are approved, the app is currently using mock trial in development mode. This allows users to activate a 14-day trial locally. However, this is NOT a real payment and will not work in production.

To disable mock trial and show proper error messages:
- The code automatically detects if API keys are valid
- In production builds, it will not use mock services
- Users will see proper error messages if products aren't configured

## Support Resources

- RevenueCat Documentation: https://docs.revenuecat.com
- App Store Connect Guide: https://developer.apple.com/app-store-connect/
- RevenueCat iOS SDK: https://docs.revenuecat.com/docs/ios
