#!/usr/bin/env node

// Test script to verify RevenueCat configuration
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing RevenueCat Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');

    // Read .env file (safely)
    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check for iOS API key
    const iosKeyMatch = envContent.match(/EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=(.+)/);
    if (iosKeyMatch) {
        const iosKey = iosKeyMatch[1].trim();
        if (iosKey.startsWith('appl_') && iosKey.length > 10) {
            console.log('✅ iOS API key configured correctly');
            console.log(`   Format: ${iosKey.substring(0, 10)}...`);
        } else {
            console.log('❌ iOS API key format incorrect');
        }
    } else {
        console.log('❌ iOS API key not found in .env');
    }

    // Check for Android API key
    const androidKeyMatch = envContent.match(/EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=(.+)/);
    if (androidKeyMatch) {
        const androidKey = androidKeyMatch[1].trim();
        if (androidKey === 'goog_YOUR_ANDROID_API_KEY') {
            console.log('⚠️  Android API key is placeholder - you\'ll need to set this for Android testing');
        } else if (androidKey.startsWith('goog_') && androidKey.length > 10) {
            console.log('✅ Android API key configured correctly');
            console.log(`   Format: ${androidKey.substring(0, 10)}...`);
        } else {
            console.log('❌ Android API key format incorrect');
        }
    }

    // Check for secret key
    const secretKeyMatch = envContent.match(/REVENUECAT_SECRET_KEY=(.+)/);
    if (secretKeyMatch) {
        const secretKey = secretKeyMatch[1].trim();
        if (secretKey.startsWith('sk_') && secretKey.length > 10) {
            console.log('✅ Secret key configured correctly');
            console.log(`   Format: ${secretKey.substring(0, 6)}...`);
        } else {
            console.log('❌ Secret key format incorrect');
        }
    }

} else {
    console.log('❌ .env file not found');
}

console.log('\n📋 Next Steps:');
console.log('1. Get your Android API key from RevenueCat Dashboard');
console.log('2. Replace goog_YOUR_ANDROID_API_KEY in .env with your real Android key');
console.log('3. Set up subscription products in App Store Connect and Google Play Console');
console.log('4. Test the app - it should now exit development mode');
console.log('5. Check the app logs for "✅ [RevenueCat] Initialized successfully"');

console.log('\n🔗 Useful Links:');
console.log('- RevenueCat Dashboard: https://app.revenuecat.com');
console.log('- Setup Guide: See PAYMENT_SETUP.md in this directory');