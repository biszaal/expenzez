#!/bin/bash

echo "🚀 Expenzez App Store Deployment Script"
echo "========================================"

# Step 1: Initialize EAS project (if not done)
echo "Step 1: Checking EAS project status..."
if ! eas project:info > /dev/null 2>&1; then
    echo "⚠️ EAS project not found. Running eas init..."
    eas init
else
    echo "✅ EAS project already configured"
fi

# Step 2: Check for required credentials
echo ""
echo "Step 2: Credential requirements checklist"
echo "Before proceeding, ensure you have:"
echo "  ✓ Apple Developer account (99 USD/year)"
echo "  ✓ App Store Connect app created"
echo "  ✓ Apple Team ID (found in Apple Developer portal)"
echo "  ✓ App Store Connect App ID"
echo ""
read -p "Press Enter when you have all credentials ready..."

# Step 3: Build the app
echo ""
echo "Step 3: Building iOS app for App Store..."
echo "This will take 10-20 minutes..."
eas build --platform ios --profile production

# Step 4: Submit to App Store Connect
echo ""
echo "Step 4: Submitting to App Store Connect..."
echo "Make sure your eas.json has the correct ascAppId and appleTeamId"
read -p "Press Enter to continue with submission..."
eas submit --platform ios --profile production

echo ""
echo "🎉 Deployment complete!"
echo "Next steps:"
echo "1. Go to App Store Connect (https://appstoreconnect.apple.com)"
echo "2. Complete app metadata (description, screenshots, etc.)"
echo "3. Submit for App Store review"
echo "4. Wait for Apple's review (typically 1-7 days)"