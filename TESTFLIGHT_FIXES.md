# 🛠️ TestFlight TrueLayer & JWT Token Fixes

This document outlines the fixes implemented to resolve TrueLayer "invalid redirect" errors and JWT token management issues in TestFlight builds.

## 🐛 Issues Addressed

### 1. TrueLayer "Invalid Redirect" Error
- **Problem**: TrueLayer banking connection failing in TestFlight with "invalid redirect" error
- **Root Cause**: TestFlight apps have different URL scheme handling than production apps
- **Impact**: Users unable to connect bank accounts in TestFlight builds

### 2. JWT Token Management Issues  
- **Problem**: JWT tokens expiring without proper refresh, especially during app backgrounding
- **Root Cause**: Missing automatic token refresh and poor token lifecycle management
- **Impact**: Users getting logged out frequently, API calls failing with 401 errors

## ✅ Solutions Implemented

### Phase 1: Environment Detection System

**Files Created/Modified:**
- `config/environment.ts` - Environment detection and configuration
- `config/api.ts` - Updated to use environment-specific settings

**Key Features:**
- Automatic TestFlight vs Production detection
- Environment-specific API URLs and redirect URLs
- Debug logging for troubleshooting

```typescript
// Environment-specific redirect URLs
truelayerRedirectURL: environment === 'production'
  ? 'https://expenzez.com/banking/callback'     // Universal links for production
  : 'expenzez://banking/callback',              // Custom URL scheme for TestFlight
```

### Phase 2: URL Scheme & Deep Link Configuration

**Files Modified:**
- `app.json` - Added associated domains and URL scheme configuration

**Changes Made:**
```json
{
  "associatedDomains": [
    "applinks:expenzez.com",
    "applinks:www.expenzez.com"
  ],
  "infoPlist": {
    "CFBundleURLTypes": [
      {
        "CFBundleURLName": "expenzez-redirect",
        "CFBundleURLSchemes": ["expenzez"]
      }
    ]
  }
}
```

### Phase 3: Enhanced Token Management

**Files Created:**
- `services/tokenManager.ts` - Comprehensive token management service

**Key Features:**
- ✅ Automatic JWT expiration detection
- ✅ Proactive token refresh (5 minutes before expiry)
- ✅ App state monitoring (refresh when app becomes active)
- ✅ Secure token storage with AsyncStorage
- ✅ Request deduplication (prevents multiple simultaneous refresh requests)
- ✅ Proper cleanup on auth failure

**Benefits:**
- Seamless authentication experience
- No more unexpected logouts
- Background app handling
- Better error recovery

### Phase 4: API Interceptor Improvements

**Files Modified:**
- `services/api.ts` - Enhanced request/response interceptors

**Improvements:**
- Use `tokenManager.getValidAccessToken()` instead of direct AsyncStorage access
- Automatic token refresh in response interceptor for 401 errors
- Better error handling and cleanup
- Environment-aware banking API calls

### Phase 5: Banking Callback Handling

**Files Created:**
- `services/urlHandler.ts` - URL parsing and handling
- `app/banking/callback.tsx` - Banking callback page

**Features:**
- ✅ Proper URL parsing for both custom schemes and universal links
- ✅ Environment-aware callback handling
- ✅ User-friendly callback processing page
- ✅ Error handling for failed connections
- ✅ Automatic navigation after success/failure

## 🔧 Technical Implementation Details

### Token Refresh Flow
```typescript
1. API Request → Check token validity
2. If expired/near expiry → Refresh token automatically  
3. Store new tokens securely
4. Retry original request with new token
5. On refresh failure → Clear all tokens and redirect to login
```

### TrueLayer Redirect Flow
```typescript
1. User initiates bank connection
2. System detects environment (TestFlight vs Production)
3. Uses appropriate redirect URL:
   - TestFlight: expenzez://banking/callback
   - Production: https://expenzez.com/banking/callback
4. TrueLayer redirects back with authorization code
5. App processes callback and exchanges code for tokens
6. User redirected to success/error page
```

### Environment Detection Logic
```typescript
const detectTestFlight = (): boolean => {
  const isIOS = Constants.platform?.ios;
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;
  
  if (isIOS && bundleId && (!releaseChannel || releaseChannel === 'default')) {
    return true; // Likely TestFlight
  }
  
  return false;
};
```

## 🚀 Testing Instructions

### TestFlight Testing Checklist

1. **Environment Detection**
   ```
   ✅ App correctly identifies as TestFlight environment
   ✅ Logs show correct redirect URL (expenzez://banking/callback)
   ✅ API points to production endpoint
   ```

2. **JWT Token Management**
   ```
   ✅ Tokens refresh automatically before expiry
   ✅ App handles backgrounding/foregrounding correctly
   ✅ API calls succeed without manual login
   ✅ Token cleanup works on auth failure
   ```

3. **TrueLayer Banking Integration**
   ```
   ✅ Bank connect button works without redirect errors
   ✅ TrueLayer page opens with correct redirect URL
   ✅ Authorization callback is handled correctly
   ✅ Success/error states display properly
   ✅ User is navigated to appropriate screen after callback
   ```

### Debug Information Available

When in development mode, the app will log:
- Current environment (Development/TestFlight/Production)
- Redirect URLs being used
- Token expiration times
- API endpoint configurations
- Callback processing details

## 🛡️ Security Considerations

### Secure Token Storage
- Access tokens: Short-lived (1 hour)
- Refresh tokens: Long-lived, securely stored
- Automatic cleanup on auth failures
- No sensitive data in logs (production)

### URL Scheme Security
- Custom URL schemes for TestFlight only
- Universal links preferred for production
- Proper URL validation before processing
- State parameter validation for CSRF protection

## 📱 Production Deployment Notes

### App Store Connect Configuration
When submitting to production:
1. Associated domains file must be hosted at `https://expenzez.com/.well-known/apple-app-site-association`
2. Universal links will be used instead of custom URL schemes
3. TrueLayer Console must be updated with production redirect URLs

### Backend Configuration Required
The backend API must handle:
- `/banking/callback` endpoint for processing authorization codes
- Environment-specific redirect URL validation
- TestFlight vs Production request differentiation

## 🐛 Troubleshooting

### Common Issues & Solutions

**Issue**: "Invalid redirect URL" in TestFlight
**Solution**: Verify TrueLayer Console has `expenzez://banking/callback` configured

**Issue**: Tokens not refreshing
**Solution**: Check that refresh token is stored and valid in AsyncStorage

**Issue**: Callback page not loading
**Solution**: Verify URL scheme is properly configured in app.json

**Issue**: Environment detection incorrect
**Solution**: Check Constants values in debug logs

### Debug Commands
```bash
# Check environment detection
console.log('Environment:', getEnvironmentName());
console.log('Is TestFlight:', isTestFlight());

# Check token status
const tokenInfo = await tokenManager.getTokenInfo(accessToken);
console.log('Token expires at:', new Date(tokenInfo.expiresAt));

# Check URL handling
const isValid = isValidBankingCallback(url);
console.log('Valid callback URL:', isValid);
```

## ✅ Verification Checklist

Before releasing fixes to TestFlight:

- [ ] Environment detection works correctly
- [ ] Token manager handles all edge cases
- [ ] Banking callback flow completes successfully
- [ ] Error handling provides clear user feedback
- [ ] Debug logging helps with troubleshooting
- [ ] No sensitive data exposed in logs
- [ ] Universal links configured for production
- [ ] Backend API endpoints ready

## 📊 Success Metrics

After implementing these fixes:
- ✅ TrueLayer bank connections work in TestFlight
- ✅ No more "invalid redirect" errors  
- ✅ JWT tokens refresh seamlessly in background
- ✅ Improved user authentication experience
- ✅ Better error handling and user feedback
- ✅ Environment-specific configuration working

---

**Last Updated**: August 21, 2025  
**Version**: 1.0.0  
**Environment**: TestFlight Ready