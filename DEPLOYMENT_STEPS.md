# Deployment Steps - Open Ham Prep

Follow these steps to deploy the dual-site architecture.

## Overview

- **Marketing Site:** `openhamprep.com` → GitHub Pages
- **React App:** `app.openhamprep.com` → Cloudflare Pages

---

## Part 1: GitHub Pages Setup (Marketing Site)

### Step 1: Enable GitHub Pages

1. Go to https://github.com/sonyccd/openhamprep/settings/pages
2. Under "Build and deployment":
   - **Source:** Select "GitHub Actions"
   - This allows the workflow to deploy instead of using the legacy Pages build
3. Click "Save"

### Step 2: Configure Custom Domain

1. Still in Pages settings, under "Custom domain":
   - Enter: `openhamprep.com`
   - Click "Save"
2. Wait for DNS check (may take a few minutes)
3. Once verified, check "Enforce HTTPS"

### Step 3: Update Cloudflare DNS

Since your domain is managed by Cloudflare, configure these DNS records:

**For GitHub Pages (Marketing Site):**
```
Type: A
Name: @
Content: 185.199.108.153
Proxy: ON (orange cloud)

Type: A
Name: @
Content: 185.199.109.153
Proxy: ON (orange cloud)

Type: A
Name: @
Content: 185.199.110.153
Proxy: ON (orange cloud)

Type: A
Name: @
Content: 185.199.111.153
Proxy: ON (orange cloud)
```

**Note:** You need all 4 A records pointing to GitHub's IPs for redundancy.

### Step 4: Verify Marketing Deployment

1. The GitHub Actions workflow should auto-trigger since you just pushed
2. Check workflow status: https://github.com/sonyccd/openhamprep/actions
3. Look for "Deploy Marketing Site to GitHub Pages" workflow
4. Once complete (green checkmark), visit `https://openhamprep.com`
5. You should see the marketing landing page

**Expected Result:**
- ✅ Marketing pages load from `openhamprep.com`
- ✅ Theme toggle works
- ✅ Navigation between pages works
- ✅ Links to `app.openhamprep.com/auth` are present (won't work yet)

---

## Part 2: Cloudflare Pages Setup (React App)

### Step 1: Create Cloudflare Pages Project

1. Go to Cloudflare Dashboard → **Pages**
2. Click **Create a project**
3. Select **Connect to Git**
4. Authorize Cloudflare to access your GitHub account
5. Select repository: **sonyccd/openhamprep**
6. Click **Begin setup**

### Step 2: Configure Build Settings

```
Project name: openhamprep-app (or your preference)
Production branch: main
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: / (leave blank - uses repository root)
```

### Step 3: Add Environment Variables

Click **Environment variables** and add:

```
NODE_VERSION = 18
VITE_SUPABASE_URL = <your-supabase-project-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
VITE_POSTHOG_KEY = <your-posthog-key>
VITE_POSTHOG_HOST = <your-posthog-host>
```

**Where to find Supabase values:**
- Go to your Supabase project dashboard
- Settings → API
- Copy `URL` and `anon public` key

### Step 4: Save and Deploy

1. Click **Save and Deploy**
2. Cloudflare will start the first build
3. This takes 2-5 minutes
4. You'll get a temporary URL like `openhamprep-app.pages.dev`

### Step 5: Configure Custom Domain

1. In your Cloudflare Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter: `app.openhamprep.com`
4. Click **Continue**
5. Cloudflare will automatically add the DNS record (since domain is on Cloudflare)
6. Wait for SSL certificate provisioning (~1 minute)

**Expected DNS Record (auto-created):**
```
Type: CNAME
Name: app
Content: openhamprep-app.pages.dev (or your project name)
Proxy: ON (orange cloud)
```

### Step 6: Verify App Deployment

1. Visit `https://app.openhamprep.com`
2. You should see a loading spinner, then be redirected to `/auth`
3. Test authentication flow:
   - Sign up with a test account
   - Verify email (check spam folder)
   - Log in and access dashboard

**Expected Result:**
- ✅ App loads at `app.openhamprep.com`
- ✅ Non-authenticated users → redirected to `/auth`
- ✅ Authentication works (Supabase connection)
- ✅ After login → redirected to `/dashboard`

---

## Part 3: Configure Build Optimization (Optional)

### Ignore Marketing Changes in Cloudflare

By default, Cloudflare Pages rebuilds on every commit. To only rebuild when app files change:

1. In Cloudflare Pages project settings
2. Go to **Builds & deployments**
3. Under **Build configurations** → **Production**
4. Click **Configure Production deployments**
5. Enable **Build watch paths** (if available)
6. Add path filter: `!(marketing/**)`

This prevents rebuilds when only marketing content changes.

### Path Filtering Already Set Up

The GitHub Actions workflow already has path filtering:
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'marketing/**'
```

This means GitHub Pages only deploys when marketing files change.

---

## Part 4: Testing Checklist

### Marketing Site (`openhamprep.com`)

- [ ] Landing page loads
- [ ] About page loads
- [ ] FAQ page loads
- [ ] Features page loads
- [ ] Theme toggle works (light/dark)
- [ ] Mobile menu works
- [ ] All "Sign Up / Sign In" buttons link to `app.openhamprep.com/auth`
- [ ] GitHub repo link works
- [ ] Footer displays correctly

### React App (`app.openhamprep.com`)

- [ ] Root `/` redirects to `/auth` (non-authenticated)
- [ ] Root `/` redirects to `/dashboard` (authenticated)
- [ ] Sign up flow works
- [ ] Email verification works
- [ ] Login flow works
- [ ] Dashboard loads after login
- [ ] Practice tests work
- [ ] Question answering works
- [ ] Progress tracking works
- [ ] Admin panel accessible (if admin user)

### Cross-Site Integration

- [ ] Marketing CTA buttons correctly link to app auth
- [ ] App logout doesn't break (still works)
- [ ] Cookies/sessions work correctly across subdomains

---

## Troubleshooting

### GitHub Pages Not Deploying

**Problem:** Workflow runs but site doesn't update

**Solution:**
1. Check workflow logs: https://github.com/sonyccd/openhamprep/actions
2. Ensure GitHub Pages is set to "GitHub Actions" source
3. Verify CNAME file exists in `marketing/` directory
4. Check DNS propagation: https://dnschecker.org

### Cloudflare Pages Build Fails

**Problem:** Build fails with errors

**Solutions:**
1. Check build logs in Cloudflare dashboard
2. Verify all environment variables are set
3. Ensure `NODE_VERSION=18` is set
4. Check that `npm run build` works locally
5. Verify Supabase credentials are correct

### DNS Not Resolving

**Problem:** Domain doesn't point to site

**Solutions:**
1. Wait 5-10 minutes for DNS propagation
2. Check Cloudflare DNS settings match above
3. Ensure Proxy is enabled (orange cloud)
4. Clear browser DNS cache
5. Test with: `nslookup openhamprep.com`

### SSL Certificate Issues

**Problem:** "Not Secure" warning

**Solutions:**
1. GitHub Pages: Wait 10-15 minutes after DNS setup
2. Cloudflare Pages: SSL is usually instant
3. Ensure "Enforce HTTPS" is checked in GitHub Pages settings
4. In Cloudflare, ensure SSL mode is "Full" or "Full (strict)"

### App Authentication Not Working

**Problem:** Login fails or doesn't redirect

**Solutions:**
1. Check Supabase environment variables are correct
2. In Supabase dashboard → Authentication → URL Configuration:
   - Add `app.openhamprep.com` to allowed redirect URLs
3. Check browser console for errors
4. Verify Supabase project is not paused

---

## Success Criteria

✅ **Marketing site is live:**
- `https://openhamprep.com` loads correctly
- All pages accessible
- Theme toggle works

✅ **App is live:**
- `https://app.openhamprep.com` redirects to auth
- Authentication works end-to-end
- Dashboard loads after login

✅ **Auto-deployment works:**
- Push to `main` triggers GitHub Actions for marketing
- Push to `main` triggers Cloudflare rebuild for app

✅ **Zero cost:**
- GitHub Pages: Free
- Cloudflare Pages: Free tier

---

## Next Steps After Deployment

1. **Test on Mobile:** Verify responsive design works
2. **SEO:** Submit sitemap to Google Search Console
3. **Analytics:** Verify PostHog tracking works in app
4. **Monitoring:** Set up uptime monitoring (e.g., UptimeRobot)
5. **Documentation:** Update any hardcoded URLs in docs

---

## Quick Reference

### Key URLs
- Marketing: https://openhamprep.com
- App: https://app.openhamprep.com
- GitHub Repo: https://github.com/sonyccd/openhamprep
- GitHub Actions: https://github.com/sonyccd/openhamprep/actions

### Key Files
- Marketing workflow: `.github/workflows/deploy-marketing.yml`
- Marketing content: `marketing/` directory
- App config: `vite.config.ts`, `package.json`
- Deployment docs: `CLOUDFLARE_PAGES_SETUP.md`

### Support Resources
- GitHub Pages Docs: https://docs.github.com/en/pages
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages
- Supabase Docs: https://supabase.com/docs
