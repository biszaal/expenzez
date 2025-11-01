# RevenueCat Sandbox Testing Setup

## 📋 Understanding RevenueCat Environments

RevenueCat has **two separate concepts**:

### 1. RevenueCat Project Type
- **Production Project** - Your live app (recommended even for testing)
- **Sandbox Project** - Separate test project

### 2. Apple Purchase Environment
- **Apple Sandbox** - Test purchases (no real money)
- **Apple Production** - Real purchases (real money)

---

## ✅ Recommended Setup

**Use RevenueCat PRODUCTION project with Apple SANDBOX purchases**

This is the standard approach:
- RevenueCat project: Production
- Apple purchases: Sandbox (during development)
- No real money charged during testing
- Same setup works for production

---

## 🔧 Current Setup - Sandbox Project

If you're using a RevenueCat **Sandbox project**, here's what you need:

### Step 1: Verify Sandbox Project Configuration

1. Go to https://app.revenuecat.com
2. Check project name (top-left) - should say "Sandbox" or "Test"
3. Click **"Apps"** in left sidebar
4. Verify iOS app exists with:
   - Bundle ID: `com.biszaal.expenzez`
   - Platform: Apple App Store
   - Status: Active

### Step 2: Get Sandbox API Key

1. Click **"API Keys"** in left sidebar
2. Under **"Public app-specific API keys"**
3. Copy the iOS key (starts with `appl_`)
4. This is your SANDBOX key

### Step 3: Configure Products in Sandbox

1. Click **"Products"** in left sidebar
2. Create products (if not exists):
   - `expenzez_monthly_premium`
   - `expenzez_annual_premium`
3. Click **"Entitlements"** in left sidebar
4. Create entitlement: `premium`
5. Link both products to `premium` entitlement

### Step 4: Create Offering

1. Click **"Offerings"** in left sidebar
2. Create offering: `default`
3. Add both products to the offering

---

## ⚠️ Sandbox vs Production Projects

### Using Sandbox Project (Your Current Setup)

**Pros:**
- ✅ Separate from production
- ✅ Can test without affecting production data

**Cons:**
- ❌ Need to maintain two separate configurations
- ❌ Must switch keys when going to production
- ❌ Products/entitlements need to be configured twice

### Using Production Project (Recommended)

**Pros:**
- ✅ Same configuration for development and production
- ✅ Same API keys throughout
- ✅ Only one project to maintain
- ✅ Still uses Apple Sandbox during development (no real charges)

**Cons:**
- ❌ Test data mixed with production data (usually not an issue)

---

## 🔄 How to Switch to Production Project

If you want to use the recommended setup:

### Step 1: Create Production Project (if needed)

1. Go to https://app.revenuecat.com
2. Click project dropdown (top-left)
3. Click **"+ Create new project"**
4. Name: `Expenzez` (production)
5. Click **"Create"**

### Step 2: Configure iOS App

1. In your new production project
2. Click **"Apps"** → **"+ New App"**
3. Configure:
   - Platform: `Apple App Store`
   - Name: `Expenzez iOS`
   - Bundle ID: `com.biszaal.expenzez`
4. Click **"Save"**

### Step 3: Create Products

1. Click **"Products"** → **"+ New"**
2. Create two products:

   **Product 1:**
   - Identifier: `expenzez_monthly_premium`
   - Type: `Subscription`
   - Store: `App Store`
   - Product ID: `expenzez_monthly_premium` (from App Store Connect)

   **Product 2:**
   - Identifier: `expenzez_annual_premium`
   - Type: `Subscription`
   - Store: `App Store`
   - Product ID: `expenzez_annual_premium` (from App Store Connect)

### Step 4: Create Entitlement

1. Click **"Entitlements"** → **"+ New"**
2. Configure:
   - Identifier: `premium`
   - Name: `Premium Access`
3. Click **"Add products"**
4. Add both products created above
5. Click **"Save"**

### Step 5: Create Offering

1. Click **"Offerings"** → **"+ New"**
2. Configure:
   - Identifier: `default`
   - Description: `Default offering`
3. Add both products
4. Set one as default (monthly)
5. Click **"Save"**

### Step 6: Get Production API Key

1. Click **"API Keys"**
2. Under **"Public app-specific API keys"**
3. Copy iOS key (starts with `appl_`)
4. Update `.env.local`:
   ```env
   EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_YOUR_PRODUCTION_KEY
   ```

---

## 🧪 Testing with Either Setup

### Apple Sandbox Testing (No Real Money)

Whether using RevenueCat Sandbox or Production project:

1. **Sign out of App Store** on your iPhone
2. **Settings** → **App Store** → Sign out
3. **Settings** → **App Store** → **Sandbox Account**
4. Sign in with Apple sandbox test account
   - Create at: https://appstoreconnect.apple.com → Users and Access → Sandbox Testers

### Test Purchase Flow

1. Open app in Expo Go
2. Navigate to subscription screen
3. Tap subscription plan
4. **Apple will show "Sandbox Environment"**
5. Complete purchase (won't be charged)
6. Verify premium features unlock

---

## 🎯 Current Status Check

**What you need to verify NOW:**

1. **Which RevenueCat project are you using?**
   - Go to https://app.revenuecat.com
   - Check project name (top-left dropdown)
   - Sandbox or Production?

2. **Is iOS app configured?**
   - Click "Apps"
   - Should see iOS app with Bundle ID: `com.biszaal.expenzez`

3. **Are products configured?**
   - Click "Products"
   - Should see: `expenzez_monthly_premium`, `expenzez_annual_premium`

4. **Is entitlement configured?**
   - Click "Entitlements"
   - Should see: `premium` with both products linked

5. **Is offering configured?**
   - Click "Offerings"
   - Should see: `default` with both products

---

## ✅ Expected Logs (Working Sandbox)

```
[RevenueCat] 🚀 Initializing SDK...
[RevenueCat] ✅ SDK module loaded successfully
[RevenueCat] iOS key present: true
[RevenueCat] ✅ SDK configured successfully
[RevenueCat] Offerings fetched: 2 products
```

---

## 🆘 Common Sandbox Issues

### Issue: "No products available"

**Cause:** Products not configured in RevenueCat

**Fix:**
1. Go to RevenueCat → Products
2. Create products with correct identifiers
3. Link to entitlement
4. Add to offering

### Issue: "Invalid API key"

**Cause:** Using production key in sandbox project (or vice versa)

**Fix:**
- Make sure key is from the SAME project you're using
- Sandbox project → Sandbox key
- Production project → Production key

### Issue: Purchases not working

**Cause:** Not using Apple sandbox test account

**Fix:**
1. Sign out of regular App Store
2. Use sandbox test account
3. Device must show "Sandbox Environment" during purchase

---

**Next Step:** Tell me which RevenueCat project you're using (Sandbox or Production), and I'll help you configure it properly!
