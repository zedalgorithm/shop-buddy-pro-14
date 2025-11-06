# Deploy to Vercel - Step by Step Guide

## Quick Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login (use GitHub for easy integration)

3. **Create New Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

4. **Configure Environment Variables**:
   - In the project setup, click "Environment Variables"
   - Add these two variables:
     ```
     VITE_SUPABASE_URL = https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY = your-anon-key-here
     ```
   - You can find these in your Supabase Dashboard → Settings → API

5. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

---

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

---

## Important Notes

### Environment Variables
Make sure to set these in Vercel Dashboard → Project Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Configuration
After deployment, update your Supabase Auth settings:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Redirect URLs":
   - `https://your-project.vercel.app`
   - `https://your-project.vercel.app/**`

### Build Settings (Auto-detected by Vercel)
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

---

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase redirect URLs include your Vercel domain
- [ ] Test login functionality
- [ ] Test product creation/editing
- [ ] Test POS transactions
- [ ] Check mobile responsiveness

---

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify all dependencies are in `package.json`
- Ensure environment variables are set

### Authentication Not Working
- Verify Supabase redirect URLs include Vercel domain
- Check environment variables are correct
- Review Supabase RLS policies

### App Shows Blank Page
- Check browser console for errors
- Verify environment variables
- Check Vercel deployment logs

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Check deployment logs in Vercel Dashboard

