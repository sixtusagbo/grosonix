# 🌐 Grosonix Web Application

> Next.js + TypeScript web application for AI-powered social media growth simulation

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** 18.17 or later ([Download here](https://nodejs.org/))
- **npm** 9.0 or later (comes with Node.js) or **yarn** 1.22+
- **Git** for version control ([Download here](https://git-scm.com/))
- A **Supabase account** ([Sign up here](https://supabase.com/))
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd grosonix/web
```

### 2. Install Dependencies

```bash
npm install
# or if you prefer yarn
yarn install
```

### 3. Environment Configuration

#### Create Environment File
```bash
cp .env.example .env.local
```

#### Configure Required Environment Variables

Open `.env.local` and fill in the following variables:

### 4. Supabase Setup

#### Option A: Use Existing Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing one
3. Go to **Settings** → **API** to get your keys
4. Copy the **Project URL** and **anon public** key to your `.env.local`
5. Copy the **service_role** key (keep this secret!)

#### Option B: Local Supabase (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase locally
supabase init

# Start local Supabase
supabase start
```

### 5. Database Migration

Run the database migrations to set up the required tables:

```bash
# If using hosted Supabase, the migrations should auto-apply
# If using local Supabase:
supabase db reset
```

### 6. API Keys Setup Guide

#### OpenAI API Key (Required)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click **"Create new secret key"**
4. Copy the key and add it to your `.env.local` as `OPENAI_API_KEY`

#### Twitter API (Optional)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing one
3. Go to **Keys and Tokens**
4. Copy **Client ID** and **Client Secret**
5. Add OAuth 2.0 redirect URI: `http://localhost:4001/api/auth/twitter/callback`

#### Instagram API (Optional)
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app with **Instagram Graph API**
3. Add OAuth redirect URI: `http://localhost:4001/api/auth/instagram/callback`
4. Copy **App ID** and **App Secret**

#### LinkedIn API (Optional)
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Add OAuth redirect URI: `http://localhost:4001/api/auth/linkedin/callback`
4. Copy **Client ID** and **Client Secret**

### 7. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at: **http://localhost:4001**

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## 📁 Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── ai/            # AI-related components
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── theme/         # Theme components
│   │   └── ui/            # Reusable UI components
│   ├── lib/               # Utility libraries
│   │   ├── ai/           # AI services
│   │   ├── api/          # API clients
│   │   ├── cache/        # Caching utilities
│   │   ├── hooks/        # Custom React hooks
│   │   └── social/       # Social media integrations
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
├── .env.example         # Environment variables template
└── package.json         # Dependencies and scripts
```

## 🧪 Testing the Setup

### 1. Verify Database Connection
- Navigate to `http://localhost:4001/dashboard`
- Try creating an account
- Check if you can access the dashboard

### 2. Test AI Features
- Go to **Dashboard** → **AI Content**
- Try generating content suggestions
- Verify the swipeable interface works

### 3. Test Social Integrations (Optional)
- Go to **Dashboard** → **Settings**
- Try connecting social media accounts
- Verify OAuth flows work correctly

## 🐛 Common Issues & Solutions

### Issue: "Module not found" errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Supabase connection errors
**Solution:**
1. Verify your Supabase URL and keys in `.env.local`
2. Check if your Supabase project is active
3. Ensure database migrations have run

### Issue: OpenAI API errors
**Solution:**
1. Verify your OpenAI API key is correct
2. Check if you have sufficient credits
3. Ensure the key has proper permissions

### Issue: Social OAuth not working
**Solution:**
1. Check redirect URIs match exactly
2. Verify API keys are correct
3. Ensure OAuth apps are properly configured

### Issue: Port 4001 already in use
**Solution:**
```bash
# Kill process using port 4001
lsof -ti:4001 | xargs kill -9

# Or use a different port
npm run dev -- -p 3000
```

## 📚 API Documentation

Once the server is running, you can access:

- **API Documentation**: [http://localhost:4001/docs](http://localhost:4001/docs)
- **OpenAPI Spec**: [http://localhost:4001/api/docs](http://localhost:4001/api/docs)

## 🤝 Contributing Guidelines

### Code Style
- Use **TypeScript** for all new files
- Follow **ESLint** rules (run `npm run lint`)
- Use **Prettier** for code formatting
- Write **meaningful commit messages**

### Component Guidelines
- Use **functional components** with hooks
- Implement **proper TypeScript types**
- Add **error boundaries** for critical components
- Follow **accessibility best practices**

### API Guidelines
- Use **proper HTTP status codes**
- Implement **error handling**
- Add **input validation**
- Document endpoints with **Swagger comments**

### Database Guidelines
- Always use **migrations** for schema changes
- Enable **Row Level Security (RLS)** for new tables
- Add **proper indexes** for performance
- Use **meaningful table and column names**

## 🔒 Security Notes

- **Never commit** `.env.local` or API keys
- Use **environment variables** for all secrets
- Implement **proper authentication** checks
- Follow **OWASP security guidelines**
- Keep **dependencies updated**

## 📞 Getting Help

If you encounter issues:

1. **Check the console** for error messages
2. **Review this README** for common solutions
3. **Check existing issues** in the repository
4. **Create a new issue** with detailed information:
   - Steps to reproduce
   - Error messages
   - Environment details
   - Screenshots (if applicable)

## 🚀 Deployment

For production deployment:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**
3. **Deploy to your preferred platform** (Vercel, Netlify, etc.)
4. **Update OAuth redirect URIs** to production URLs

## 📝 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Happy coding! 🎉**

For questions or support, please open an issue or contact the development team.