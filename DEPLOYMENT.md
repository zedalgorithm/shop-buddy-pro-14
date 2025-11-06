# Deployment Guide

This guide will help you deploy your VertexPOS application to various hosting platforms.

## Prerequisites

1. **Supabase Setup**: Make sure you have:
   - Supabase project URL
   - Supabase Anon/Public Key
   - Database tables created and configured

2. **Environment Variables**: You need to set these:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

## Deployment Options

### Option 1: Vercel (Recommended - Easiest)

Vercel is the easiest platform to deploy Vite React apps.

#### Steps:

1. **Install Vercel CLI** (optional, for command line deployment):
   ```bash
   npm i -g vercel
   ```

2. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - Click "Deploy"

4. **Or Deploy via CLI**:
   ```bash
   vercel
   ```
   Follow the prompts and add environment variables when asked.

Your app will be live at `https://your-project-name.vercel.app`

---

### Option 2: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy via Netlify Dashboard**:
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Add environment variables in Site settings → Environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Deploy site"

Your app will be live at `https://your-project-name.netlify.app`

---

### Option 3: Cloudflare Pages

1. **Push to GitHub**

2. **Deploy via Cloudflare Dashboard**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages → "Create a project"
   - Connect to GitHub and select your repository
   - Build settings:
     - Framework preset: Vite
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Add environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Click "Save and Deploy"

Your app will be live at `https://your-project-name.pages.dev`

---

### Option 4: GitHub Pages (Free but requires more setup)

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/your-repo-name"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

**Note**: GitHub Pages doesn't support environment variables well. You'll need to use a different approach or build the variables into your code (not recommended for production).

---

## Environment Variables Setup

### For Vercel:
1. Go to Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`

### For Netlify:
1. Go to Site Settings → Environment Variables
2. Add the same variables

### For Cloudflare Pages:
1. Go to Pages → Your Project → Settings → Environment Variables
2. Add the same variables

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication (login/signup)
- [ ] Test all CRUD operations (products, transactions, etc.)
- [ ] Check Supabase RLS policies are configured correctly
- [ ] Test on mobile devices
- [ ] Set up custom domain (optional)

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### App Doesn't Work After Deployment
- Verify Supabase CORS settings allow your domain
- Check Supabase RLS policies
- Verify environment variables in hosting platform
- Check browser console for errors

### Authentication Issues
- Ensure Supabase project has correct auth settings
- Check redirect URLs in Supabase dashboard
- Verify environment variables are correct

## Support

For issues related to:
- **Deployment**: Check your hosting platform's documentation
- **Supabase**: Check [Supabase Docs](https://supabase.com/docs)
- **Vite**: Check [Vite Docs](https://vitejs.dev)

