#!/bin/bash

echo "🚀 Starting PrintTrack Application..."

# Generate Prisma client (in case it's missing)
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Setting up database schema..."
npx prisma db push --accept-data-loss

# Start the Next.js application
echo "🌐 Starting Next.js server..."
npm start 