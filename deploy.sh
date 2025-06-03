#!/bin/bash

# Deployment script for STG-44 Discord Landing Page
echo "🚀 Starting deployment process..."

# Build the application
echo "📦 Building application..."
npm run build

# Set production environment variables
export NODE_ENV=production
export PORT=${PORT:-10000}

# Start the application
echo "🌐 Starting STG-44 server..."
npm start &

# Wait for server to start
sleep 5

# Test health endpoint
echo "🔍 Testing health endpoint..."
curl -f http://localhost:${PORT}/health || exit 1

# Setup uptime monitoring (for external services)
echo "⏰ Setting up uptime monitoring..."
echo "Add these endpoints to your uptime monitoring service:"
echo "Health Check: https://your-app.onrender.com/health"
echo "API Status: https://your-app.onrender.com/api/uptime"

echo "✅ Deployment completed successfully!"
echo "🎯 STG-44 Discord landing page is now live!"
echo "📊 Visit analytics and Discord webhooks are active"