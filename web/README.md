# 🌐 Grosonix Web Application

> Next.js + TypeScript web application for AI-powered social media growth simulation

## 📋 Prerequisites

- **Node.js** 18.17 or later
- **npm** 9.0 or later (or **yarn** 1.22+)
- **Git** for version control

## 🚀 Local Setup Instructions

### 1. Navigate to Web Directory

```bash
cd web
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the web directory:

```bash
cp .env.example .env.local
```

Update the environment variables you just copied with your actual values.

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at: **http://localhost:4001**

## 🔗 API Information

### API Base URL

- **Development**: `http://localhost:4001/api`
- **Production**: `https://your-domain.com/api`

### API Documentation

- **Swagger UI**: [http://localhost:4001/docs](http://localhost:4001/docs)
- **OpenAPI Spec**: [http://localhost:4001/api/docs](http://localhost:4001/api/docs)
