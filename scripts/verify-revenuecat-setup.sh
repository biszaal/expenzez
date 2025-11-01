#!/bin/bash

# RevenueCat Setup Verification Script
# This script checks if RevenueCat is properly configured for production builds

echo "🔍 Verifying RevenueCat Setup..."
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Install with: npm install -g eas-cli"
    exit 1
fi

echo "✅ EAS CLI found"
echo ""

# Check EAS secrets
echo "📋 Checking EAS Secrets..."
eas secret:list 2>&1 | grep -i revenuecat > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ RevenueCat secrets exist in EAS"
    echo ""
    echo "Configured secrets:"
    eas secret:list 2>&1 | grep -A 3 -i revenuecat | grep -E "(Name|Updated)"
else
    echo "❌ No RevenueCat secrets found in EAS"
    echo ""
    echo "To fix, run:"
    echo "  eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value <your-ios-key>"
    echo "  eas secret:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value <your-android-key>"
    exit 1
fi

echo ""
echo "⚠️  IMPORTANT: Verify your EAS secrets contain actual API keys, not placeholders!"
echo ""
echo "To check secret values (they will be hidden):"
echo "  eas secret:list"
echo ""
echo "To update secrets:"
echo "  eas secret:delete --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY"
echo "  eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value <your-actual-key>"
echo ""

# Check react-native-purchases package
echo "📦 Checking react-native-purchases package..."
if grep -q "react-native-purchases" package.json; then
    VERSION=$(grep "react-native-purchases" package.json | sed 's/.*: "\(.*\)".*/\1/')
    echo "✅ react-native-purchases installed: $VERSION"
else
    echo "❌ react-native-purchases not found in package.json"
    exit 1
fi

echo ""
echo "📱 App Configuration:"
BUNDLE_ID=$(grep -A 20 '"ios"' app.json | grep bundleIdentifier | sed 's/.*: "\(.*\)".*/\1/')
echo "  Bundle ID: $BUNDLE_ID"
echo ""
echo "⚠️  Make sure this Bundle ID matches your RevenueCat app configuration!"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1. Verify EAS secrets contain real API keys from RevenueCat dashboard"
echo "2. Verify RevenueCat dashboard app is configured with Bundle ID: $BUNDLE_ID"
echo "3. Verify products are created in App Store Connect"
echo "4. Verify products are linked in RevenueCat dashboard"
echo "5. Build a new version: eas build --platform ios --profile production"
echo ""
echo "✅ Verification complete!"
