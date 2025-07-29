# Railway Deployment Guide

This guide will help you deploy your PrintTrack application to Railway.

## Prerequisites

1. A Railway account (https://railway.app)
2. Your code pushed to GitHub
3. A PostgreSQL database (Railway provides this)

## Environment Variables

Set these environment variables in your Railway project:

### Required Variables

```bash
# Database (Railway will auto-generate this)
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth.js Security
NEXTAUTH_SECRET=your-super-secure-random-string-here
NEXTAUTH_URL=https://your-app-name.railway.app

# Application Environment
NODE_ENV=production
```

## Deployment Steps

### 1. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Add PostgreSQL Database

1. In your Railway project dashboard
2. Click "New Service"
3. Select "Database" → "PostgreSQL"
4. Railway will automatically set the DATABASE_URL

### 3. Configure Environment Variables

In your Railway project settings, add:

```bash
NEXTAUTH_SECRET=generate-a-secure-32-character-string
NEXTAUTH_URL=https://your-app-name.railway.app
NODE_ENV=production
```

### 4. Deploy

1. Railway will automatically build and deploy
2. The build process will:
   - Install dependencies
   - Generate Prisma client
   - Push database schema
   - Build Next.js application
   - Start the server

### 5. Database Setup

The application will automatically:
- Generate Prisma client
- Push schema to PostgreSQL
- Create all necessary tables

## Build Configuration

The app is configured with:

- **Node.js 18.x** and **npm 9.x** (Railway compatible)
- **Automatic Prisma generation** during build
- **Database schema push** on deployment
- **Health check endpoint** at `/api/health`
- **Optimized Next.js build** with standalone output

## Monitoring

- Health check: `https://your-app.railway.app/api/health`
- Railway provides automatic monitoring and logs
- Database connection is tested on each health check

## Troubleshooting

### Build Failures
- Check Railway logs for specific errors
- Ensure all environment variables are set
- Verify DATABASE_URL is correctly formatted

### Database Issues
- Ensure PostgreSQL service is running
- Check DATABASE_URL format
- Verify schema has been pushed

### Application Errors
- Check application logs in Railway dashboard
- Verify NEXTAUTH_SECRET is set
- Ensure NEXTAUTH_URL matches your Railway domain

## Production Optimizations

✅ **Implemented:**
- Standalone Next.js output for smaller deployments
- Prisma client generation in build process
- Health check endpoint for monitoring
- Proper error handling and logging
- PostgreSQL optimized schema
- Production-ready environment configuration

## Support

If you encounter issues:
1. Check Railway logs
2. Verify environment variables
3. Test health check endpoint
4. Review this deployment guide

Your PrintTrack application is now production-ready for Railway! 🚀 