# Cloudflare Pages Setup for Open Ham Prep App

This guide explains how to deploy the React application to Cloudflare Pages at `app.openhamprep.com`.

## Overview

- **Marketing Site:** `openhamprep.com` → GitHub Pages (static HTML from `/marketing`)
- **React App:** `app.openhamprep.com` → Cloudflare Pages (React SPA from repository root)

## Cloudflare Pages Configuration

### 1. Create New Project in Cloudflare Pages

1. Log in to Cloudflare Dashboard
2. Go to **Pages** → **Create a project**
3. Connect to your GitHub repository: `sonyccd/openhamprep`
4. Configure build settings:

### 2. Build Settings

```
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: / (repository root)
```

### 3. Environment Variables

Add these environment variables in Cloudflare Pages settings:

```
NODE_VERSION=18
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_POSTHOG_KEY=<your-posthog-key>
VITE_POSTHOG_HOST=<your-posthog-host>
```

### 4. Custom Domain Setup

1. In Cloudflare Pages project settings, go to **Custom domains**
2. Add custom domain: `app.openhamprep.com`
3. Cloudflare will automatically configure DNS (since domain is already on Cloudflare)

### 5. Branch Deployments

- **Production branch:** `main`
- **Preview deployments:** Enabled for all branches (optional)

### 6. Build Optimization

Cloudflare Pages will:
- Automatically cache dependencies
- Deploy to global edge network
- Handle HTTPS certificates
- Provide automatic deployments on git push

## DNS Configuration

In Cloudflare DNS settings for `openhamprep.com`:

### Marketing Site (GitHub Pages)
```
Type: A
Name: @
Content: 185.199.108.153
         185.199.109.153
         185.199.110.153
         185.199.111.153
Proxy: Enabled
```

### App Subdomain (Cloudflare Pages)
```
Type: CNAME
Name: app
Content: <your-cloudflare-pages-url>.pages.dev
Proxy: Enabled
```

## Deployment Workflow

### Automatic Deployments

Every push to `main` branch triggers:
1. **GitHub Pages:** Deploys `/marketing` to `openhamprep.com` (if marketing files changed)
2. **Cloudflare Pages:** Deploys React app to `app.openhamprep.com` (if app files changed)

### Path-based Deployment Filtering

The GitHub Actions workflow only triggers when files in `/marketing` change:

```yaml
paths:
  - 'marketing/**'
```

Cloudflare Pages can be configured to ignore `/marketing` directory changes if needed.

## Testing

1. **Local Development:**
   ```bash
   npm run dev
   # Visit http://localhost:5173
   ```

2. **Production Build:**
   ```bash
   npm run build
   npm run preview
   # Visit http://localhost:4173
   ```

3. **Live Sites:**
   - Marketing: https://openhamprep.com
   - App: https://app.openhamprep.com

## Troubleshooting

### Build Failures

1. Check environment variables are set correctly
2. Verify Node version is 18+
3. Check build logs in Cloudflare Pages dashboard

### Routing Issues

The app uses client-side routing. Cloudflare Pages automatically handles this for Vite/React apps with a `_redirects` file or by detecting the framework.

If needed, create `public/_redirects`:
```
/*    /index.html   200
```

### CORS Issues

Ensure Supabase project settings allow your Cloudflare Pages domain:
- Production: `app.openhamprep.com`
- Preview: `*.pages.dev`

## Cost

- **Cloudflare Pages:** Free tier includes:
  - Unlimited bandwidth
  - Unlimited requests
  - 500 builds/month
  - 1 build at a time

Perfect for this project!

## Next Steps

After initial setup:
1. Test deployment with a small change
2. Verify environment variables work
3. Check custom domain resolves correctly
4. Test authentication flow with Supabase
5. Monitor build times and optimize if needed
