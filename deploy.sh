#!/bin/bash

# Sherpa Deployment Script
# Usage: ./deploy.sh [project_id]

PROJECT_ID=${1:-project-34320a6d-6ed6-4151-8c6}
REGION="us-central1"

echo "🚀 Starting Sherpa Deployment to Project: $PROJECT_ID"

# 1. Deploy Backend
echo "--------------------------------------------------"
echo "📦 Deploying Sherpa Backend..."
echo "--------------------------------------------------"
cd sherpa_backend
# Deploying from source with .gcloudignore whitelist for .env
gcloud run deploy sherpa-backend \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi

# Get Backend URL
BACKEND_URL=$(gcloud run services describe sherpa-backend --project $PROJECT_ID --region $REGION --format 'value(status.url)')
echo "✅ Backend deployed at: $BACKEND_URL"
cd ..

# 2. Update Frontend Configuration
echo "--------------------------------------------------"
echo "⚙️  Configuring Frontend..."
echo "--------------------------------------------------"
cd sherpa_frontend
# Ensure .env.production exists and update URL
cp .env .env.production 2>/dev/null || :
# Remove old URL if exists
grep -v "REACT_APP_BACKEND_URL" .env.production > .env.production.tmp && mv .env.production.tmp .env.production
echo "REACT_APP_BACKEND_URL=$BACKEND_URL" >> .env.production
echo "✅ Updated .env.production with new Backend URL"

# 3. Deploy Frontend
echo "--------------------------------------------------"
echo "🎨 Deploying Sherpa Frontend..."
echo "--------------------------------------------------"
gcloud run deploy sherpa-frontend \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi

FRONTEND_URL=$(gcloud run services describe sherpa-frontend --project $PROJECT_ID --region $REGION --format 'value(status.url)')
echo "--------------------------------------------------"
echo "🎉 Deployment Complete!"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "--------------------------------------------------"
cd ..
