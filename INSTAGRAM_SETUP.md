# 📸 Instagram Graph API Setup Guide

> **Important:** Instagram Basic Display API was deprecated on September 4, 2024. We now use Instagram Graph API for better functionality and future-proofing.

## 🚀 Why Instagram Graph API?

- ✅ **Not deprecated** - Active and supported by Meta
- ✅ **Business-focused** - Designed for professional use cases
- ✅ **Rich analytics** - Detailed insights and metrics
- ✅ **Content management** - Ability to publish and manage content
- ✅ **Advanced features** - Audience insights, hashtag performance, etc.

## 📋 Prerequisites

### Instagram Account Requirements
- **Business Account** or **Creator Account** (required)
- Connected to a **Facebook Page**
- Account must be active and in good standing

### Facebook Developer Setup
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add **Instagram Graph API** product
4. Configure OAuth redirect URIs

## 🔧 Setup Steps

### 1. Create Facebook App
```bash
# Go to: https://developers.facebook.com/apps/
# Click "Create App" → "Business" → Fill details
```

### 2. Add Instagram Graph API Product
```bash
# In your Facebook app dashboard:
# Products → Add Product → Instagram Graph API
```

### 3. Configure OAuth Settings
```bash
# App Settings → Basic
# Add OAuth Redirect URIs:
https://your-domain.com/api/auth/instagram/callback
http://localhost:4001/api/auth/instagram/callback  # For development
```

### 4. Get App Credentials
```bash
# App Settings → Basic
# Copy App ID and App Secret
```

### 5. Environment Variables
```env
# In your .env file:
INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret
```

## 🔐 Required Permissions

The app requests these Facebook permissions:
- `instagram_basic` - Basic Instagram account access
- `instagram_manage_insights` - Access to Instagram insights
- `pages_show_list` - List user's Facebook pages
- `pages_read_engagement` - Read page engagement data

## 📊 Available Data

### Profile Metrics
- Follower count
- Following count
- Media count
- Account type (Business/Creator)

### Content Analytics
- Post engagement (likes, comments)
- Media insights (impressions, reach, saves)
- Hashtag performance
- Audience demographics

### Advanced Features (Coming Soon)
- Content publishing
- Story insights
- Shopping tag analytics
- Audience insights

## 🚨 Common Issues & Solutions

### "No Instagram Business Account Found"
**Problem:** User doesn't have a Business/Creator account
**Solution:** 
1. Convert Instagram to Business/Creator account
2. Connect to a Facebook Page
3. Try connecting again

### "Permission Denied"
**Problem:** Missing required permissions
**Solution:**
1. Check Facebook app permissions
2. Ensure Instagram account is connected to Facebook page
3. Re-authorize the connection

### "Invalid OAuth Redirect"
**Problem:** Redirect URI mismatch
**Solution:**
1. Check Facebook app OAuth settings
2. Ensure redirect URI matches exactly
3. Include both production and development URLs

## 🔄 Migration from Basic Display API

If you were using Instagram Basic Display API:

### What Changed
- ❌ Basic Display API → ✅ Graph API
- ❌ Personal accounts → ✅ Business/Creator only
- ❌ Limited data → ✅ Rich analytics
- ❌ Facebook login required → ✅ Better integration

### Migration Benefits
- More comprehensive analytics
- Better long-term support
- Advanced business features
- Consistent with Instagram's business focus

## 📈 Business Account Benefits

### Why Business/Creator Account?
- **Analytics Access** - Detailed insights and metrics
- **API Access** - Full Graph API functionality
- **Content Tools** - Publishing and management features
- **Audience Insights** - Demographics and behavior data
- **Professional Features** - Contact buttons, shopping, etc.

### How to Convert
1. Go to Instagram app
2. Settings → Account → Switch to Professional Account
3. Choose Business or Creator
4. Connect to Facebook Page
5. Complete setup

## 🎯 Next Steps

1. **Set up Facebook Developer account**
2. **Create app with Instagram Graph API**
3. **Configure OAuth settings**
4. **Add environment variables**
5. **Convert Instagram to Business account**
6. **Test the connection**

The Instagram Graph API provides a much more robust foundation for social media analytics and will serve us well as we build advanced features in future phases!