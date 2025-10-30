# RevenueCat App Store Setup Guide

**Status:** Code 100% Complete ✅ - Needs App Store Configuration Only

---

## 📋 Overview

Your premium subscription system is **fully coded and ready** to monetize! You just need to configure the products in App Store Connect.

**Subscription Plans:**
- 💎 **Monthly Premium:** £4.99/month
- 💎 **Annual Premium:** £49.99/year (save 17%)
- 🎁 **14-day free trial** for all plans

---

## ✅ What's Already Done

### Backend:
- ✅ RevenueCat webhook handler deployed
- ✅ Subscription validation endpoints
- ✅ Feature access control logic

### Frontend:
- ✅ RevenueCat SDK integrated
- ✅ Subscription plans screen
- ✅ Premium paywall components
- ✅ Feature gating throughout app
- ✅ Free tier limits enforced

---

## 🚀 Setup Steps (30 minutes)

### Step 1: Create App Store Products (15 mins)

1. **Go to App Store Connect**
   - Navigate to: https://appstoreconnect.apple.com
   - Select your app: **Expenzez**
   - Go to: **Features** → **Subscriptions**

2. **Create Subscription Group**
   - Click **"+"** to create new subscription group
   - Name: **"Expenzez Premium"**
   - Reference Name: **"expenzez_premium"**

3. **Create Monthly Product**
   - Click **"+"** to add new subscription
   - **Product ID:** `expenzez_monthly_premium`
   - **Reference Name:** "Expenzez Monthly Premium"
   - **Duration:** 1 month (auto-renewing)
   - **Price:** £4.99 (UK) / $6.99 (US)
   - **Free Trial:** 14 days
   - **Subscription Group:** Expenzez Premium

4. **Create Annual Product**
   - Click **"+"** to add new subscription
   - **Product ID:** `expenzez_annual_premium`
   - **Reference Name:** "Expenzez Annual Premium"
   - **Duration:** 1 year (auto-renewing)
   - **Price:** £49.99 (UK) / $59.99 (US)
   - **Free Trial:** 14 days
   - **Subscription Group:** Expenzez Premium

5. **Add Descriptions (required)**

   **Display Name (both products):**
   ```
   Expenzez Premium
   ```

   **Description (monthly):**
   ```
   Unlock unlimited budgets, unlimited AI queries, advanced analytics, and priority support with Expenzez Premium.

   Your subscription automatically renews monthly unless auto-renew is turned off at least 24 hours before the end of the current period.

   Terms: https://expenzez.com/terms
   Privacy: https://expenzez.com/privacy
   ```

   **Description (annual):**
   ```
   Get the best value with Expenzez Premium Annual - save 17% compared to monthly!

   Unlock unlimited budgets, unlimited AI queries, advanced analytics, and priority support.

   Your subscription automatically renews yearly unless auto-renew is turned off at least 24 hours before the end of the current period.

   Terms: https://expenzez.com/terms
   Privacy: https://expenzez.com/privacy
   ```

6. **Configure Metadata**
   - Add screenshots showing premium features
   - Add promotional text highlighting benefits
   - Set up subscription offers if desired

---

### Step 2: Configure RevenueCat (10 mins)

1. **Go to RevenueCat Dashboard**
   - Navigate to: https://app.revenuecat.com
   - Select your project: **Expenzez**

2. **Add Products**
   - Go to **Products** tab
   - Click **"Add Product"**

   **Monthly Product:**
   - Identifier: `expenzez_monthly_premium`
   - Display Name: "Monthly Premium"
   - Type: Auto-renewing subscription
   - Link to App Store product ID

   **Annual Product:**
   - Identifier: `expenzez_annual_premium`
   - Display Name: "Annual Premium"
   - Type: Auto-renewing subscription
   - Link to App Store product ID

3. **Create Entitlement**
   - Go to **Entitlements** tab
   - Click **"+ New Entitlement"**
   - Identifier: `premium`
   - Display Name: "Premium Access"
   - Description: "Full access to all premium features"

4. **Link Products to Entitlement**
   - Select `premium` entitlement
   - Add both products:
     - `expenzez_monthly_premium`
     - `expenzez_annual_premium`

5. **Configure Offerings**
   - Go to **Offerings** tab
   - Create offering: `default`
   - Add both products to offering
   - Set monthly as default

6. **Set API Keys** (if not done already)
   - Go to **API Keys** tab
   - Copy **Public SDK Key**
   - Already configured in your app ✅

---

### Step 3: Test in Sandbox (5 mins)

1. **Create Sandbox Test Account**
   - Go to: https://appstoreconnect.apple.com
   - Users and Access → Sandbox Testers
   - Click **"+"** to create test account
   - Email: `test@yourdomain.com` (fake email is fine)
   - Password: Choose a password
   - **Important:** Apple ID region must match your test region

2. **Configure Test Device**
   - On your iOS device: Settings → App Store
   - Scroll down to "Sandbox Account"
   - Sign in with sandbox test account

3. **Test Purchase Flow**
   - Open Expenzez app
   - Go to Premium Subscription screen
   - Try purchasing monthly plan
   - **You won't be charged** (sandbox mode)
   - Verify 14-day free trial shows
   - Confirm purchase completes successfully
   - Check that premium features unlock

4. **Verify in RevenueCat**
   - Open RevenueCat dashboard
   - Go to **Customers** tab
   - Find your test user
   - Verify subscription shows as active
   - Check entitlement: `premium` = true

---

## 🔍 Verification Checklist

After setup, verify everything works:

- [ ] Products visible in App Store Connect
- [ ] Products linked in RevenueCat dashboard
- [ ] Sandbox purchase completes successfully
- [ ] 14-day free trial displays correctly
- [ ] Premium features unlock after purchase
- [ ] Subscription shows in RevenueCat dashboard
- [ ] Webhook receives subscription events
- [ ] Free tier limits enforced for free users
- [ ] Premium paywall appears for free users

---

## 📊 Feature Gating (Already Implemented)

Your app already enforces these limits:

**Free Tier:**
- ✅ 3 budgets maximum
- ✅ 5 AI queries per day
- ✅ Basic analytics only
- ✅ Standard support

**Premium Tier:**
- ✅ Unlimited budgets
- ✅ Unlimited AI queries
- ✅ Advanced analytics
- ✅ Priority support
- ✅ Export to CSV (implemented)
- ✅ Custom categories (ready)

---

## 🚨 Important Notes

### App Review Requirements:

1. **Restore Purchases Button**
   - ✅ Already implemented in subscription screen
   - Users can restore previous purchases

2. **Terms & Privacy Links**
   - ⚠️ Update links in product descriptions
   - Must be accessible without sign-in

3. **Subscription Management**
   - ✅ Link to iOS Settings implemented
   - Users can cancel anytime

4. **Clear Pricing**
   - ✅ Prices displayed clearly
   - ✅ Free trial period shown
   - ✅ Auto-renewal explained

### Tax & Legal:

- Apple handles all tax collection ✅
- Apple takes 30% (first year), 15% (year 2+)
- You receive payouts monthly
- Set up banking info in App Store Connect

---

## 💰 Pricing Strategy

**Current Setup:**
- Monthly: £4.99/month = £59.88/year
- Annual: £49.99/year (17% savings)

**Revenue Projections:**
```
100 subscribers = £499/month
- Apple's 30% cut = £150
- Your net revenue = £349/month (£4,188/year)

500 subscribers = £2,495/month
- Apple's 30% cut = £750
- Your net revenue = £1,745/month (£20,940/year)

1,000 subscribers = £4,990/month
- Apple's 30% cut = £1,497
- Your net revenue = £3,493/month (£41,916/year)
```

**Note:** After year 1, Apple's cut drops to 15%! 🎉

---

## 🔧 Troubleshooting

### "No products available"

**Solution:**
1. Verify products are "Ready to Submit" in App Store Connect
2. Wait 24 hours after creating products (Apple caching)
3. Check RevenueCat product identifiers match exactly
4. Verify app's Bundle ID matches RevenueCat configuration

### "Purchase failed"

**Solution:**
1. Ensure using sandbox test account (not production)
2. Sign out of production App Store account
3. Device must be set to sandbox mode
4. Check RevenueCat API key is correct

### "Free trial not showing"

**Solution:**
1. Verify free trial configured in App Store Connect
2. Check product description includes trial info
3. Ensure user hasn't used trial before (Apple tracks this)

### Webhook not receiving events

**Solution:**
1. Check webhook URL in RevenueCat settings
2. Verify AWS Lambda deployed: `expenzez-backend-dev-revenueCatWebhook`
3. Check CloudWatch logs for errors
4. Test webhook with RevenueCat's "Send Test Event"

---

## 📚 Resources

- **App Store Connect:** https://appstoreconnect.apple.com
- **RevenueCat Dashboard:** https://app.revenuecat.com
- **Subscription Best Practices:** https://developer.apple.com/app-store/subscriptions/
- **RevenueCat Docs:** https://docs.revenuecat.com

---

## ✅ Next Steps

1. ✅ Complete Step 1: Create App Store products
2. ✅ Complete Step 2: Configure RevenueCat
3. ✅ Complete Step 3: Test in sandbox
4. 🚀 Submit app update for review
5. 💰 Start earning revenue!

---

**Estimated Time to Revenue:** 1-2 weeks
- Setup: 30 minutes
- Testing: 1 day
- App Review: 1-2 weeks
- First payment: Next month

**Your subscription system is production-ready!** 🎉
