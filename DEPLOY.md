# AgendaCasaES - Production Deployment Guide

## Quick Start

```bash
# Build and deploy to Cloud Run
gcloud builds submit --config=cloudbuild.yaml
```

---

## 1. Environment Variables

### Frontend (Build-time via Vite)

|Variable|Description|Source|
|--------|-----------|------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Supabase Dashboard > API |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | Sentry > Project Settings |
| `VITE_SUPABASE_FUNCTION_URL` | Edge Functions base URL | `https://<project>.supabase.co/functions/v1` |

### Edge Functions (Runtime via Supabase Secrets)

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `SUPABASE_URL` | Auto-injected | Supabase (automatic) |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Supabase (automatic) |
| `RESEND_API_KEY` | Resend email API key | `supabase secrets set RESEND_API_KEY=xxx` |
| `STRIPE_SECRET_KEY` | Stripe payments | `supabase secrets set STRIPE_SECRET_KEY=xxx` |
| `GOOGLE_CALENDAR_CLIENT_ID` | Google OAuth | `supabase secrets set ...` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Google OAuth | `supabase secrets set ...` |
| `GCP_PROJECT_ID` | For Vertex AI | `supabase secrets set GCP_PROJECT_ID=xxx` |
| `GCP_LOCATION` | Vertex AI region | `supabase secrets set GCP_LOCATION=us-central1` |

---

## 2. Google Secret Manager (Cloud Run)

### Create Secrets

```bash
# Create secrets in GCP
echo -n "your_supabase_url" | gcloud secrets create VITE_SUPABASE_URL --data-file=-
echo -n "your_anon_key" | gcloud secrets create VITE_SUPABASE_ANON_KEY --data-file=-
echo -n "your_sentry_dsn" | gcloud secrets create VITE_SENTRY_DSN --data-file=-
```

### Grant Access

```bash
# Get Cloud Build service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant access to secrets
gcloud secrets add-iam-policy-binding VITE_SUPABASE_URL \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

### Use in cloudbuild.yaml

```yaml
availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/VITE_SUPABASE_URL/versions/latest
      env: VITE_SUPABASE_URL
```

---

## 3. Supabase Transaction Pooler

For high-concurrency production workloads, use the **Transaction Pooler** connection:

|Setting|Value|
|-------|-----|
| Host | `aws-0-sa-east-1.pooler.supabase.com` |
| Port | `6543` (Transaction Mode) |
| Database | `postgres` |
| User | `postgres.<project-ref>` |

**Note**: Edge Functions use the Supabase JS client which handles connection pooling automatically via the REST API. Direct Postgres connections (if any) should use port `6543`.

---

## 4. Deploy Steps

### Step 1: Set GCP Project

```bash
export PROJECT_ID=your-gcp-project-id
gcloud config set project $PROJECT_ID
```

### Step 2: Create Secrets (First time only)

```bash
# Required secrets for build
gcloud secrets create VITE_SUPABASE_URL --replication-policy="automatic"
gcloud secrets create VITE_SUPABASE_ANON_KEY --replication-policy="automatic"
gcloud secrets create VITE_SENTRY_DSN --replication-policy="automatic"

# Add secret values
echo -n "https://xxx.supabase.co" | gcloud secrets versions add VITE_SUPABASE_URL --data-file=-
echo -n "eyJhbGci..." | gcloud secrets versions add VITE_SUPABASE_ANON_KEY --data-file=-
echo -n "https://xxx.ingest.sentry.io/xxx" | gcloud secrets versions add VITE_SENTRY_DSN --data-file=-
```

### Step 3: Deploy

```bash
# Option A: Using Cloud Build (recommended)
gcloud builds submit --config=cloudbuild.yaml

# Option B: Direct deploy (requires local .env with values)
docker build -t gcr.io/$PROJECT_ID/agendacasaes:latest \
  --build-arg VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
  --build-arg VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
  --build-arg VITE_SENTRY_DSN=$VITE_SENTRY_DSN .

docker push gcr.io/$PROJECT_ID/agendacasaes:latest

gcloud run deploy agendacasaes \
  --image gcr.io/$PROJECT_ID/agendacasaes:latest \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated
```

### Step 4: Verify

```bash
# Get service URL
gcloud run services describe agendacasaes --region=southamerica-east1 --format='value(status.url)'

# Test health endpoint
curl https://your-service-url/health
```

---

## 5. Sentry Configuration

Already integrated in the application:

- **Frontend**: `@sentry/react` with ErrorBoundary, Tracing, and Session Replay
- **DSN**: Set via `VITE_SENTRY_DSN` environment variable
- **Features enabled**:
  - Error tracking
  - Performance tracing (100% sample rate)
  - Session replay (10% normal, 100% on error)

### Adding User Context

In your auth flow, after login:

```typescript
import * as Sentry from "@sentry/react";

Sentry.setUser({
  id: user.id,
  email: user.email,
});

Sentry.setTag("tenant_id", profile.tenant_id);
```

---

## 6. Troubleshooting

|Issue|Solution|
|-----|--------|
| 502 Bad Gateway | Check Cloud Run logs, ensure port 8080 is exposed |
| Blank page | Verify nginx SPA fallback, check browser console |
| Sentry not receiving events | Verify DSN is correct and not blocked by CSP |
| Build fails on secrets | Check IAM permissions for Cloud Build SA |

---

## Architecture Summary

```text
┌─────────────────────────────────────────────────────────────┐
│                     Cloud Run (Frontend)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Nginx (Port 8080)                                      ││
│  │  - Gzip compression                                     ││
│  │  - Security headers                                     ││
│  │  - SPA fallback                                         ││
│  │  - Static asset caching (1 year)                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Supabase                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Postgres   │  │     Auth     │  │   Storage    │       │
│  │  (Port 6543) │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Edge Functions (Deno)                        ││
│  │  agent-notifications, agent-scheduler, agent-ai, etc.    ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```
