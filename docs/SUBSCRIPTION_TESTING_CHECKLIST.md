# ✅ Subscription Testing Checklist

Use this checklist to verify your RevenueCat integration is working correctly.

## 🔧 Setup Verification

- [ ] RevenueCat account created and configured
- [ ] Products created with correct IDs:
  - [ ] `grosonix_pro_monthly`
  - [ ] `grosonix_pro_yearly` 
  - [ ] `grosonix_agency_monthly`
  - [ ] `grosonix_agency_yearly`
- [ ] Entitlements configured
- [ ] Offerings created with all products
- [ ] Stripe connected to RevenueCat
- [ ] Environment variables set:
  - [ ] `NEXT_PUBLIC_REVENUECAT_API_KEY`
  - [ ] `REVENUECAT_SECRET_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Webhook configured: `/api/subscription/webhook`

## 🧪 Core Functionality Tests

### Free Trial Flow
- [ ] Navigate to `/dashboard/subscription`
- [ ] "Start Free Trial" button appears for new users
- [ ] Trial starts without payment
- [ ] Trial status banner shows in dashboard
- [ ] Pro features unlocked during trial
- [ ] Database shows trial subscription record
- [ ] Trial expiration warning appears near end

### Payment Flow
- [ ] Paywall appears when hitting usage limits
- [ ] All three tiers (Free/Pro/Agency) display correctly
- [ ] Monthly/Yearly toggle works
- [ ] Yearly savings percentage calculated correctly
- [ ] Test payment with `4242 4242 4242 4242` succeeds
- [ ] Subscription activates immediately after payment
- [ ] Success toast notification appears
- [ ] Database updated with active subscription

### Usage Limits
- [ ] Free users limited to 5 generations/day
- [ ] Usage banner appears at 80% limit
- [ ] Paywall triggers at 100% limit
- [ ] Pro users get 50 generations/day
- [ ] Agency users get unlimited access
- [ ] Cross-platform adaptation blocked for free users
- [ ] Usage resets daily

### Subscription Management
- [ ] Current plan displays correctly in `/dashboard/subscription`
- [ ] Billing information shows next payment date
- [ ] Cancel subscription works (sets cancel_at date)
- [ ] Reactivate subscription works (removes cancel_at)
- [ ] Upgrade flow works (free → pro → agency)
- [ ] Downgrade restrictions enforced

## 🔗 API Endpoints

Test these endpoints manually or with curl:

### GET `/api/subscription/status`
- [ ] Returns correct subscription tier
- [ ] Shows trial status if applicable
- [ ] Returns 401 for unauthenticated users

### POST `/api/subscription/trial`
- [ ] `{"action": "start"}` starts trial
- [ ] `{"action": "cancel"}` cancels trial
- [ ] Validates user eligibility

### GET `/api/subscription/manage`
- [ ] Returns management options
- [ ] Shows correct available actions

### POST `/api/subscription/manage`
- [ ] `{"action": "cancel"}` cancels subscription
- [ ] `{"action": "reactivate"}` reactivates subscription

### POST `/api/subscription/webhook`
- [ ] Processes RevenueCat webhook events
- [ ] Updates database correctly
- [ ] Handles all event types

## 🎯 User Experience Tests

### New User Journey
1. [ ] Sign up for account
2. [ ] See free trial offer
3. [ ] Start trial without payment
4. [ ] Use Pro features during trial
5. [ ] Get trial expiration warning
6. [ ] Convert to paid subscription

### Existing User Journey
1. [ ] Hit usage limits on free plan
2. [ ] See paywall with upgrade options
3. [ ] Complete payment flow
4. [ ] Immediately access Pro features
5. [ ] Manage subscription in dashboard

### Edge Cases
- [ ] Multiple trial attempts blocked
- [ ] Invalid payment cards handled gracefully
- [ ] Network errors don't break flow
- [ ] Webhook failures don't affect user experience
- [ ] Subscription cancellation preserves access until period end

## 🐛 Error Handling

- [ ] Invalid API keys show helpful error messages
- [ ] Payment failures display user-friendly errors
- [ ] Network timeouts handled gracefully
- [ ] Database errors don't crash the app
- [ ] Webhook signature validation (production)

## 📊 Analytics & Monitoring

- [ ] Subscription events logged
- [ ] Usage statistics tracked
- [ ] Payment success/failure rates monitored
- [ ] Trial conversion rates measured
- [ ] Churn analysis possible

## 🚀 Production Readiness

- [ ] All tests pass in staging environment
- [ ] Production API keys configured
- [ ] Webhook URL points to production
- [ ] Stripe in live mode
- [ ] Error monitoring set up
- [ ] Customer support process defined

## 📝 Documentation

- [ ] Setup guide complete and tested
- [ ] API documentation updated
- [ ] Customer support scripts prepared
- [ ] Billing FAQ created
- [ ] Cancellation policy documented

---

**🎯 Success Criteria**: All checkboxes completed and subscription flow works end-to-end without errors.
