# 🚀 RevenueCat Subscription Integration Setup & Testing Guide

This guide walks you through setting up RevenueCat for Grosonix's subscription system and testing the complete payment flow.

## 📋 Prerequisites

- RevenueCat account (free to start)
- Stripe account (for payment processing)
- Grosonix development environment running
- Admin access to your Supabase project

## 🔧 Part 1: RevenueCat Dashboard Setup

### 1. Create RevenueCat Account & Project

1. Go to [RevenueCat Dashboard](https://app.revenuecat.com)
2. Sign up or log in
3. Create a new project: **"Grosonix"**
4. Select **Web** as your platform

### 2. Configure Products

Navigate to **Products** in the RevenueCat dashboard and create these products:

#### Pro Monthly
- **Product ID**: `grosonix_pro_monthly`
- **Type**: Subscription
- **Duration**: 1 month
- **Price**: $29.00 USD
- **Free Trial**: 7 days

#### Pro Yearly
- **Product ID**: `grosonix_pro_yearly`
- **Type**: Subscription
- **Duration**: 1 year
- **Price**: $290.00 USD (save ~17%)

#### Agency Monthly
- **Product ID**: `grosonix_agency_monthly`
- **Type**: Subscription
- **Duration**: 1 month
- **Price**: $99.00 USD

#### Agency Yearly
- **Product ID**: `grosonix_agency_yearly`
- **Type**: Subscription
- **Duration**: 1 year
- **Price**: $990.00 USD (save ~17%)

### 3. Create Entitlements

Go to **Entitlements** and create:

#### "pro_features"
- **Description**: Pro tier features
- **Attached Products**: 
  - grosonix_pro_monthly
  - grosonix_pro_yearly

#### "agency_features"
- **Description**: Agency tier features
- **Attached Products**: 
  - grosonix_agency_monthly
  - grosonix_agency_yearly

### 4. Create Offerings

Go to **Offerings** and create a **"default"** offering:

- **Pro Monthly Package**: grosonix_pro_monthly
- **Pro Yearly Package**: grosonix_pro_yearly
- **Agency Monthly Package**: grosonix_agency_monthly
- **Agency Yearly Package**: grosonix_agency_yearly

## 🔑 Part 2: Environment Configuration

### 1. Get RevenueCat API Keys

In RevenueCat Dashboard:
1. Go to **Project Settings** → **API Keys**
2. Copy the **Public API Key** (starts with `pk_`)
3. Copy the **Secret API Key** (starts with `sk_`)

### 2. Update Environment Variables

Add to your `.env.local` file:

```bash
# RevenueCat Configuration
NEXT_PUBLIC_REVENUECAT_API_KEY=pk_your_public_key_here
REVENUECAT_SECRET_KEY=sk_your_secret_key_here

# Supabase Service Role (for webhooks)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Update RevenueCat Config

Edit `web/src/lib/revenuecat/config.ts` and verify the product IDs match what you created in RevenueCat.

## 🔗 Part 3: Stripe Integration

### 1. Connect Stripe to RevenueCat

1. In RevenueCat Dashboard, go to **Integrations**
2. Click **Stripe** and follow the connection flow
3. Authorize RevenueCat to access your Stripe account

### 2. Configure Stripe Products

RevenueCat will automatically create corresponding products in Stripe. Verify they appear in your Stripe Dashboard under **Products**.

## 🎯 Part 4: Webhook Configuration

### 1. Set Up RevenueCat Webhook

1. In RevenueCat Dashboard, go to **Integrations** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/subscription/webhook`
3. Select events:
   - `INITIAL_PURCHASE`
   - `RENEWAL`
   - `CANCELLATION`
   - `EXPIRATION`
   - `BILLING_ISSUE`
   - `PRODUCT_CHANGE`

### 2. Webhook Security (Production)

For production, implement webhook signature verification in `web/src/app/api/subscription/webhook/route.ts`:

```typescript
// Uncomment and implement this in production
const signature = request.headers.get('authorization');
if (!verifyWebhookSignature(signature, body)) {
  return Response.json({ error: "Invalid signature" }, { status: 401 });
}
```

## 🧪 Part 5: Testing Guide

### 1. Development Testing Setup

#### Enable Test Mode
1. In RevenueCat Dashboard, ensure you're in **Sandbox/Test** mode
2. Use Stripe test cards for payments

#### Test Cards (Stripe)
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 2. Testing Scenarios

#### Scenario 1: Free Trial Flow
1. **Navigate**: Go to `/dashboard/subscription`
2. **Action**: Click "Start Free Trial" 
3. **Expected**: 
   - Trial starts immediately (no payment required)
   - User gets Pro features for 7 days
   - Database updated with trial subscription
   - Trial banner appears in dashboard

#### Scenario 2: Direct Pro Purchase
1. **Navigate**: Go to `/dashboard` 
2. **Trigger**: Try to generate content beyond free limit
3. **Action**: Click "Upgrade Now" in paywall
4. **Select**: Pro Monthly plan
5. **Payment**: Use test card `4242 4242 4242 4242`
6. **Expected**:
   - Payment processed successfully
   - Subscription activated immediately
   - Usage limits removed
   - Confirmation toast appears

#### Scenario 3: Trial to Paid Conversion
1. **Setup**: Start with active trial (Scenario 1)
2. **Navigate**: Go to `/dashboard/subscription`
3. **Action**: Click "Upgrade Now" when trial expires
4. **Select**: Pro Yearly (to test savings)
5. **Expected**:
   - Trial converts to paid subscription
   - Billing date updated
   - Yearly savings displayed

#### Scenario 4: Subscription Management
1. **Setup**: Have active paid subscription
2. **Navigate**: Go to `/dashboard/subscription`
3. **Test Actions**:
   - **Cancel**: Should set cancel_at date
   - **Reactivate**: Should remove cancel_at
   - **View billing**: Should show next billing date

### 3. API Testing

#### Test Subscription Status
```bash
curl -X GET "http://localhost:4001/api/subscription/status" \
  -H "Cookie: your-session-cookie"
```

#### Test Trial Start
```bash
curl -X POST "http://localhost:4001/api/subscription/trial" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"action": "start"}'
```

#### Test Usage Stats
```bash
curl -X GET "http://localhost:4001/api/ai/usage-stats" \
  -H "Cookie: your-session-cookie"
```

### 4. Database Verification

Check your Supabase database after each test:

```sql
-- Check subscription records
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';

-- Check usage tracking
SELECT * FROM ai_usage_tracking WHERE user_id = 'your-user-id';
```

## 🚨 Part 6: Troubleshooting

### Common Issues

#### 1. "RevenueCat not initialized"
- **Cause**: API key not set or invalid
- **Fix**: Verify `NEXT_PUBLIC_REVENUECAT_API_KEY` in `.env.local`

#### 2. "No offerings available"
- **Cause**: Products not properly configured
- **Fix**: Check product IDs match between config and RevenueCat dashboard

#### 3. "Payment failed"
- **Cause**: Stripe not connected or test mode mismatch
- **Fix**: Verify Stripe integration and use correct test cards

#### 4. "Webhook not receiving events"
- **Cause**: Incorrect webhook URL or local development
- **Fix**: Use ngrok for local testing: `ngrok http 4001`

### Debug Mode

Enable debug logging by adding to your component:

```typescript
// Add to any subscription component
useEffect(() => {
  console.log('Subscription state:', subscription);
  console.log('Usage stats:', usageStats);
}, [subscription, usageStats]);
```

## 🎉 Part 7: Production Deployment

### 1. Environment Variables
Update production environment with real API keys:
- `NEXT_PUBLIC_REVENUECAT_API_KEY` (production key)
- `REVENUECAT_SECRET_KEY` (production secret)

### 2. Webhook URL
Update RevenueCat webhook URL to your production domain:
`https://yourdomain.com/api/subscription/webhook`

### 3. Stripe Live Mode
Switch RevenueCat to **Live** mode and ensure Stripe is in live mode.

### 4. Testing Checklist
- [ ] Free trial flow works
- [ ] Payment processing works
- [ ] Webhooks update database
- [ ] Usage limits enforced
- [ ] Subscription management works
- [ ] Email notifications sent (if configured)

## 📞 Support

If you encounter issues:

1. **RevenueCat Docs**: https://docs.revenuecat.com/
2. **Stripe Docs**: https://stripe.com/docs
3. **Debug logs**: Check browser console and server logs
4. **Database**: Verify subscription records in Supabase

---

**🎯 Success Criteria**: Users can start free trials, upgrade to paid plans, and manage their subscriptions seamlessly while the system properly tracks usage and enforces limits.
