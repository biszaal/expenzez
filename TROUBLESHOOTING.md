# Troubleshooting Guide - TestFlight Issues

## Overview
This document addresses the three major issues discovered during TestFlight testing.

---

## Issue 1: In-App Purchase Failed ✅ DOCUMENTED

**Error**: "Purchase Failed: There was an issue processing your purchase. Please try again."

**Root Cause**: In-app purchase products are not configured in App Store Connect.

**Solution**: See `REVENUECAT_SETUP.md` for complete setup instructions.

**Status**: Requires App Store Connect configuration (no code changes needed)

---

## Issue 2: App Lock / PIN Setup Loop

**Error**: "Set up PIN for this device" warning appears even though PIN was already created. Biometric unlock not working.

### Root Cause Analysis

The app has a multi-device security system where:
1. App Lock can be enabled globally across all devices
2. Each device needs its own PIN configured
3. PINs are synced to the server for cross-device security

The issue occurs when:
- App Lock is enabled on Device A (creates PIN)
- User logs in on Device B
- Device B shows "PIN setup required" because it doesn't have a local PIN yet
- The server has the PIN, but device needs to set up its own

### Current Behavior

From `SecurityContext.tsx` (lines 267-294):
```typescript
if (securityStatus.preferences.appLockEnabled) {
  if (securityStatus.hasDevicePIN) {
    // Has PIN on this device - check session
    const hasValidSession = await nativeSecurityAPI.hasValidSession();
    setIsLocked(!hasValidSession);
  } else {
    // App lock enabled but no PIN on this device
    setIsLocked(false); // Don't lock, show PIN setup
  }
}
```

### Why This Is Actually Correct Behavior

This is not a bug - it's a security feature:
- Each device should have its own PIN
- This prevents unauthorized access if one device is compromised
- Users can have different PINs on different devices

### What Needs to Be Improved

1. **Better UI Communication**
   - Current: "Set up PIN for this device - App lock is enabled but this device needs a PIN"
   - This is confusing - users think they already set a PIN
   - Should clarify: "Set up PIN for this device to use App Lock"

2. **Auto-sync Option**
   - Could offer to use the same PIN from another device
   - Requires server-side PIN decryption (security tradeoff)

3. **Biometric Not Working**
   - Biometric is tied to device PIN
   - If device doesn't have PIN set up, biometric can't work
   - Need to ensure biometric is enabled after PIN setup

### Recommended Fixes

#### Option A: Clarify UI (Quick Fix)
Update warning message to be clearer about multi-device security.

#### Option B: Auto-sync PIN (Medium Fix)
Allow user to choose: "Use existing PIN" or "Create new PIN for this device"

#### Option C: Simplified Security (Major Change)
Switch to single PIN across all devices (less secure but simpler UX)

**Recommendation**: Option A for immediate fix, Option B for better UX

---

## Issue 3: Push Notifications Not Coming Through

**Error**: Notifications are not being received on device.

### Possible Root Causes

1. **Permissions Not Granted**
   - User may have denied notification permissions
   - App needs to handle permission denial gracefully

2. **Token Registration Failed**
   - Expo push token not registered with backend
   - Backend notification endpoint might be failing

3. **Backend Notification Service Issues**
   - Lambda functions for notifications might not be deployed
   - SNS/notification queue might not be processing

4. **Test Account Issues**
   - Test user account might not have notification preferences set
   - Notification token might not be associated with user

### Diagnostic Steps

#### Check 1: Notification Permissions
```typescript
// In NotificationContext.tsx line 188-200
const { status } = await Notifications.getPermissionsAsync();
// If status !== 'granted', user denied permissions
```

#### Check 2: Token Registration
```typescript
// Check logs for:
"[NotificationContext] Token registration response"
// Should show success: true
```

#### Check 3: Backend Endpoint
The app registers tokens at: `POST /api/notifications/register`
- Check if this Lambda function is deployed
- Verify NotificationTokens DynamoDB table exists

#### Check 4: Notification Queue Processing
- Check if notification queue processor is running
- Verify SNS topics are configured
- Check CloudWatch logs for notification Lambda

### Quick Diagnostic Test

Add this to your TestFlight device:
1. Go to iOS Settings > Expenzez > Notifications
2. Verify "Allow Notifications" is ON
3. Check that Alert styles are enabled
4. Open app and check logs for token registration

### Recommended Investigation

1. **Check Backend Deployment**
   ```bash
   cd expenzez-backend
   serverless deploy --function notificationRegister
   serverless deploy --function notificationProcessor
   ```

2. **Verify DynamoDB Tables**
   - NotificationTokens table should exist
   - NotificationQueue table should exist
   - Check AWS Console for table creation

3. **Test Token Registration Manually**
   ```bash
   # Get token from app logs, then test API endpoint
   curl -X POST https://your-api.amazonaws.com/dev/api/notifications/register \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"token":"ExponentPushToken[...]","platform":"ios"}'
   ```

4. **Check Notification Preferences**
   ```bash
   # Verify user has notification preferences set
   aws dynamodb get-item \
     --table-name NotificationPreferences \
     --key '{"userId":{"S":"USER_ID"}}'
   ```

### Likely Fix

Based on the code review, the most likely issue is:
1. Backend Lambda functions for notifications are not deployed
2. The app is trying to register tokens but getting 404/500 errors
3. This is silently failing (error handling at line 246-256)

**Immediate Action**: Deploy notification Lambda functions to backend

---

## Summary of Actions Required

| Issue | Action Required | Estimated Time | Priority |
|-------|----------------|----------------|----------|
| In-App Purchase | Configure App Store Connect products | 24-48h (Apple review) | High |
| App Lock/PIN | Improve UI messaging | 30 minutes | Medium |
| Push Notifications | Deploy backend functions | 1 hour | High |

---

## Testing Checklist

After fixes are implemented:

- [ ] In-App Purchase
  - [ ] Products appear in RevenueCat
  - [ ] Purchase flow completes successfully
  - [ ] Trial period activates correctly
  - [ ] Subscription shows in account settings

- [ ] App Lock/PIN
  - [ ] PIN setup flow is clear
  - [ ] PIN persists across app restarts
  - [ ] Biometric unlock works after PIN setup
  - [ ] Multi-device behavior is explained

- [ ] Push Notifications
  - [ ] Permissions requested on first launch
  - [ ] Token successfully registered
  - [ ] Test notification received
  - [ ] Notification preferences save correctly

---

## Support

For additional help:
- RevenueCat: See `REVENUECAT_SETUP.md`
- Backend Logs: Check CloudWatch in AWS Console
- Frontend Logs: Use Xcode Console when device is connected
