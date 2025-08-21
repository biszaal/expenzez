# App Store Connect Setup Guide for Expenzez

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com
   - Complete enrollment process

2. **App Store Connect Access**
   - Login at https://appstoreconnect.apple.com

## Step 1: Create App in App Store Connect

1. Go to "My Apps" → Click "+" → "New App"
2. Fill out the form:
   - **Name**: Expenzez
   - **Primary Language**: English (UK) or English (U.S.)
   - **Bundle ID**: com.biszaal.expenzez (already configured)
   - **SKU**: com.biszaal.expenzez (or any unique identifier)

## Step 2: Get Required IDs

After creating the app, you'll need these for `eas.json`:

1. **App Store Connect App ID**: 
   - Found in App Store Connect → Your App → App Information
   - It's a 10-digit number like `1234567890`

2. **Apple Team ID**:
   - Go to https://developer.apple.com/account
   - Click "Membership" in sidebar
   - Your Team ID is displayed (10-character string like `ABC1234567`)

## Step 3: Update eas.json

Replace these values in your `eas.json`:
```json
"ascAppId": "YOUR_10_DIGIT_APP_STORE_CONNECT_APP_ID",
"appleTeamId": "YOUR_10_CHARACTER_TEAM_ID"
```

## Step 4: App Metadata Required for App Store

Fill these out in App Store Connect:

### App Information
- **Category**: Finance
- **Subcategory**: Personal Finance (if available)
- **Content Rights**: Original or Licensed
- **Age Rating**: Complete questionnaire (likely 4+)

### App Privacy
Based on your app's functionality:
- **Financial Info**: Yes (banking data)
- **Contact Info**: Yes (email, name)
- **Identifiers**: Yes (User ID)
- **Usage Data**: Yes (app interaction)
- **Location**: Yes (categorization)
- **User Content**: Yes (transaction data)

### Pricing and Availability
- **Price**: Free (or set your price)
- **Availability**: All territories or select specific countries

### App Store Information
- **App Name**: Expenzez
- **Subtitle**: Smart UK Banking & Expense Tracker
- **Description**: Use the description from your app.json
- **Keywords**: expense,finance,banking,budget,money,AI,UK,TrueLayer
- **Support URL**: https://expenzez.com/support
- **Marketing URL**: https://expenzez.com
- **Privacy Policy URL**: https://expenzez.com/privacy

### App Screenshots Required
You need screenshots for:
- iPhone (6.7", 6.5", 5.5" displays)
- iPad (12.9", 11", 10.5" displays) - since supportsTablet: true

Screenshot specifications:
- PNG or JPEG format
- RGB color space
- High resolution (1284x2778 for 6.7" iPhone)
- No alpha channel

## Step 5: App Store Review Guidelines Compliance

Ensure your app complies with:
- Financial app guidelines (requires proper encryption notices)
- Banking integration guidelines
- User privacy guidelines
- iOS Human Interface Guidelines

## Step 6: Test Your App Thoroughly

Before submitting:
- Test all banking integrations
- Verify AI assistant functionality
- Check all screens in both light/dark mode
- Test on multiple device sizes
- Ensure offline functionality works properly

## Common Rejection Reasons to Avoid

1. **Incomplete App Information**: Fill all required metadata
2. **Missing Privacy Policy**: Ensure privacy URL works
3. **Banking Security**: Properly implement security measures
4. **Misleading App Description**: Accurately describe features
5. **Missing Required Screenshots**: Provide all required sizes

## Deployment Commands

After setting up App Store Connect:

```bash
# Navigate to your app directory
cd expenzez-frontend

# Run the deployment script
./deploy-to-appstore.sh
```

Or run commands individually:
```bash
eas init                           # Initialize EAS project
eas build --platform ios          # Build for iOS
eas submit --platform ios         # Submit to App Store
```

## Post-Submission

1. **Review Process**: 1-7 days typically
2. **Common Review Items**: App functionality, metadata accuracy, privacy compliance
3. **Release**: Once approved, you can release immediately or schedule

## Support Resources

- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)