# App Store Connect In-App Purchase Setup

## 🚨 Why You're Seeing "Subscriptions Not Available"

**Root Cause:** The in-app purchase products don't exist in App Store Connect yet.

Even though you configured products in RevenueCat, Apple's StoreKit (which RevenueCat uses) requires the products to be created in App Store Connect first.

**What's happening:**
1. RevenueCat SDK initializes successfully ✅
2. RevenueCat fetches offerings from Apple StoreKit ❌
3. Apple returns empty - products don't exist in App Store Connect
4. `monthlyPackage` and `annualPackage` are `undefined`
5. App shows "Subscriptions Not Available" error

---

## ✅ Fix: Create Products in App Store Connect

### Step 1: Go to App Store Connect

1. Open: https://appstoreconnect.apple.com
2. Sign in with your Apple Developer account
3. Click **"My Apps"**
4. Select **"Expenzez"** app

### Step 2: Create In-App Purchases

1. Click **"In-App Purchases"** tab (on the left sidebar)
2. Click **"+"** button to create new in-app purchase

### Step 3: Create Monthly Subscription

**Configure Monthly Product:**
- **Type:** Auto-Renewable Subscription
- **Reference Name:** `Expenzez Premium Monthly` (display name for you)
- **Product ID:** `expenzez_premium_monthly` (MUST match RevenueCat exactly)
- **Subscription Group:** Create new group called `Premium Membership`

**Subscription Duration:**
- **Duration:** 1 Month

**Subscription Prices:**
- **Price:** £4.99 (GBP - UK)
- Apple will auto-calculate prices for other regions

**Subscription Display Name & Description:**
- **Display Name:** `Monthly Premium`
- **Description:** `Unlimited AI insights, budgets, and advanced analytics. Billed monthly.`

**App Store Localizations:**
- Language: English (UK)
- Display Name: `Monthly Premium`
- Description: Same as above

**Review Information:**
- **Screenshot:** (Optional - can add later)
- **Review Notes:** `Premium subscription with 14-day free trial. Provides unlimited access to AI insights, budgets, and analytics.`

**Click "Save"**

---

### Step 4: Create Annual Subscription

**Configure Annual Product:**
- **Type:** Auto-Renewable Subscription
- **Reference Name:** `Expenzez Premium Annual` (display name for you)
- **Product ID:** `expenzez_premium_annual` (MUST match RevenueCat exactly)
- **Subscription Group:** Select existing `Premium Membership` group

**Subscription Duration:**
- **Duration:** 1 Year

**Subscription Prices:**
- **Price:** £49.99 (GBP - UK)
- Apple will auto-calculate prices for other regions

**Subscription Display Name & Description:**
- **Display Name:** `Annual Premium`
- **Description:** `Unlimited AI insights, budgets, and advanced analytics. Billed annually. Save 17%!`

**App Store Localizations:**
- Language: English (UK)
- Display Name: `Annual Premium`
- Description: Same as above

**Review Information:**
- **Screenshot:** (Optional - can add later)
- **Review Notes:** `Annual premium subscription with 14-day free trial. Best value - save 17% compared to monthly billing.`

**Click "Save"**

---

### Step 5: Configure Free Trial

Both products need a free trial configured:

1. For each product, scroll to **"Introductory Offers"**
2. Click **"+ Add Introductory Offer"**
3. Configure:
   - **Duration:** 2 weeks (14 days)
   - **Price:** Free
   - **Type:** Free Trial
4. Click **"Save"**

---

### Step 6: Submit for Review (Optional)

⚠️ **Note:** For testing in Sandbox, you DON'T need to submit for review. Products can be tested immediately after creation.

For production (live users):
1. Click **"Submit for Review"** for each product
2. Apple typically approves in-app purchases quickly (1-2 days)
3. You can test in Sandbox while waiting for approval

---

## 🧪 Testing After Setup

### What to Do Next:

1. **Wait 5-10 minutes** after creating products
   - Apple's systems need to propagate the product data
   - RevenueCat cache may also need to refresh

2. **Clear app data** (if testing in dev build):
   ```bash
   # Restart Expo dev server
   npx expo start --clear
   ```

3. **Reopen subscription plans screen**
   - Products should now appear
   - You should see: "Monthly Plan £4.99/month" and "Annual Plan £49.99/year"

4. **Test purchase with Sandbox account**:
   - Settings → App Store → Sign out
   - Settings → App Store → Sandbox Account → Sign in with test account
   - Try purchasing - should show "Sandbox Environment"
   - Complete purchase (won't be charged)

---

## ✅ Expected Behavior After Fix

**Console logs should show:**
```
[RevenueCat] 🚀 Initializing SDK...
[RevenueCat] ✅ SDK module loaded successfully
[RevenueCat] iOS key present: true
[RevenueCat] ✅ SDK configured successfully
[RevenueCat] Offerings fetched: 2 products
```

**Subscription plans screen:**
- Shows both Monthly (£4.99) and Annual (£49.99) plans
- "Start 14-Day Free Trial" button is enabled
- Clicking purchase shows Apple payment sheet

---

## 🆘 Troubleshooting

### Issue: Products still not showing after 10 minutes

**Fix:**
1. Verify Product IDs match EXACTLY:
   - App Store Connect: `expenzez_premium_monthly`
   - RevenueCat Products: `expenzez_premium_monthly`
2. Make sure products are in **"Ready to Submit"** or **"Waiting for Review"** status
3. Products must be in the same **Subscription Group**

### Issue: "Cannot connect to iTunes Store" during Sandbox testing

**Fix:**
1. Sign out of regular Apple ID in Settings → App Store
2. Use Sandbox test account (create at https://appstoreconnect.apple.com → Users and Access → Sandbox Testers)
3. Make sure you're testing on a physical device (Simulator has issues with purchases)

### Issue: RevenueCat shows "Invalid product identifier"

**Fix:**
- Product IDs in App Store Connect MUST match RevenueCat EXACTLY
- Check for typos, spaces, or case differences
- Wait 5-10 minutes after creating products for propagation

---

## 📋 Checklist

Before testing subscriptions, ensure:

- [ ] Products created in App Store Connect with correct IDs
- [ ] Products added to same Subscription Group
- [ ] Free trial configured (14 days)
- [ ] Waited 5-10 minutes for propagation
- [ ] RevenueCat products configured with correct identifiers
- [ ] Products attached to Premium entitlement in RevenueCat
- [ ] Correct API key from "Expenzez (App Store)" in .env.local
- [ ] App restarted with cleared cache

---

## 📚 References

- **App Store Connect:** https://appstoreconnect.apple.com
- **RevenueCat Dashboard:** https://app.revenuecat.com
- **RevenueCat Docs:** https://www.revenuecat.com/docs/getting-started

---

**Next Step:** Create the two products in App Store Connect, wait 5-10 minutes, then test again!
