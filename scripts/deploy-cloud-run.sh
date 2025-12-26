#!/bin/bash

# Configuration
SERVICE_NAME="agendacasaes-app"
REGION="us-central1" # Change as needed
MEMORY="2Gi"

echo "🚀 Deploying to Google Cloud Run..."

# Build and Deploy
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --platform managed \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory "$MEMORY" \
  --port 80

echo "✅ Deployment command sent."
