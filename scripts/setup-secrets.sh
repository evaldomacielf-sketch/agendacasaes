#!/bin/bash

# Configuration for Google Cloud Secret Manager
# Run this script to secure your Supabase keys

PROJECT_ID="your-project-id"
SECRET_NAME="SUPABASE_SERVICE_ROLE_KEY"
SECRET_VALUE="your-service-role-key-here"

echo "🔐 Setting up Google Cloud Secret Manager..."

# 1. Enable Secret Manager API
echo "Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"

# 2. Create the Secret
echo "Creating secret '$SECRET_NAME'..."
gcloud secrets create "$SECRET_NAME" \
    --replication-policy="automatic" \
    --project="$PROJECT_ID"

# 3. Add the Secret Version (Value)
echo "Adding secret version..."
echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"

# 4. Access Control (Optional - Grant access to a service account)
# gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
#     --member="serviceAccount:your-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
#     --role="roles/secretmanager.secretAccessor" \
#     --project="$PROJECT_ID"

echo "✅ Secret '$SECRET_NAME' created successfully."
echo "To access it in your application, ensure your environment is authenticated."
