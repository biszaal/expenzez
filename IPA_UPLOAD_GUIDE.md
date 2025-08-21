# 📱 IPA Upload to App Store Connect Guide

## Your IPA File Location
```
/Users/bishalaryal/Downloads/application-e0dc4ab0-d6b4-449f-abd2-c61148066cad.ipa
```

## Method 1: EAS Submit (Recommended)

### Upload Specific IPA File
```bash
cd expenzez-frontend
eas submit --platform ios --path "/Users/bishalaryal/Downloads/application-e0dc4ab0-d6b4-449f-abd2-c61148066cad.ipa"
```

### Upload Latest EAS Build
```bash
cd expenzez-frontend
eas submit --platform ios
```

### Authentication Details
- **Apple ID**: `biszaal@icloud.com`
- **Apple Team ID**: `HG4G2ZMGV8` (already configured)
- **Bundle ID**: `com.biszaal.expenzez`

When prompted:
1. Enter your Apple ID password
2. Enter the 6-digit 2FA code from your device
3. Wait for upload to complete (typically 5-10 minutes)

## Method 2: Transporter App (Fallback)

### Step 1: Install Transporter
- Open Mac App Store
- Search for "Transporter"
- Download and install (free from Apple)

### Step 2: Upload Process
1. Open Transporter app
2. Sign in with Apple ID: `biszaal@icloud.com`
3. Click the "+" button or drag the IPA file directly
4. Select your IPA file: `/Users/bishalaryal/Downloads/application-e0dc4ab0-d6b4-449f-abd2-c61148066cad.ipa`
5. Click "Deliver" to start upload
6. Wait for upload completion

## Method 3: Command Line (Advanced)

### Using xcrun altool
```bash
xcrun altool --upload-app \
  --type ios \
  --file "/Users/bishalaryal/Downloads/application-e0dc4ab0-d6b4-449f-abd2-c61148066cad.ipa" \
  --username "biszaal@icloud.com" \
  --password "@keychain:AC_PASSWORD"
```

Note: You'll need to create an app-specific password in your Apple ID settings first.

## What Happens After Upload

### 1. Processing Time
- Upload: 5-10 minutes
- Processing: 10-30 minutes
- Available in App Store Connect: Within 1 hour

### 2. Check Upload Status
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Sign in with `biszaal@icloud.com`
3. Navigate to "My Apps" → "Expenzez"
4. Check "TestFlight" tab for your build

### 3. Build Information
- **App Name**: Expenzez
- **Bundle ID**: com.biszaal.expenzez
- **Version**: 1.0.0
- **Build Number**: 1

## Next Steps After Successful Upload

### 1. Complete App Metadata
- App description and keywords
- Screenshots (iPhone and iPad sizes required)
- Privacy policy URL: `https://expenzez.com/privacy`
- Support URL: `https://expenzez.com/support`

### 2. Submit for Review
- Go to "App Store" tab (not TestFlight)
- Add your uploaded build to the app version
- Complete all required metadata
- Click "Submit for Review"

### 3. Review Timeline
- Apple review: 1-7 days typically
- Common issues: Banking compliance, privacy policy accuracy
- Address any feedback and resubmit if needed

## Troubleshooting

### Upload Fails
- **Authentication Error**: Check Apple ID credentials
- **Bundle ID Mismatch**: Verify bundle identifier matches App Store Connect
- **Build Already Exists**: Increment build number and rebuild

### Build Not Appearing
- Wait up to 1 hour for processing
- Check App Store Connect email for error notifications
- Verify upload completed successfully

### Common Rejection Reasons
- Missing app metadata
- Invalid privacy policy
- Banking app compliance issues
- Misleading app description

## App Store Connect URLs
- **Main Dashboard**: https://appstoreconnect.apple.com
- **My Apps**: https://appstoreconnect.apple.com/apps
- **TestFlight**: Check internal testing builds here
- **App Store**: Complete metadata and submit for review here

## Contact Information
- **Apple Developer Support**: https://developer.apple.com/support/
- **App Store Connect Help**: https://help.apple.com/app-store-connect/

---

## Quick Commands Summary

### Upload with EAS (try this first):
```bash
cd expenzez-frontend
eas submit --platform ios --path "/Users/bishalaryal/Downloads/application-e0dc4ab0-d6b4-449f-abd2-c61148066cad.ipa"
```

### Check upload status:
```bash
eas build:list --platform ios
```

### Alternative: Use Transporter app for drag-and-drop upload

Your app is ready for App Store submission! 🚀