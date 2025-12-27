# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Environment variables must be provided at build time via --build-arg or Cloud Build substitutions
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ARG VITE_SUPABASE_FUNCTION_URL
ARG GEMINI_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_SUPABASE_FUNCTION_URL=$VITE_SUPABASE_FUNCTION_URL
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
