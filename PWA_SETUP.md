# Progressive Web App (PWA) Setup for VertexPOS

## ✅ What's Already Done

1. **Manifest.json** - Web app manifest created at `/public/manifest.json`
2. **Service Worker** - Offline functionality at `/public/sw.js`
3. **Meta Tags** - iOS and Android meta tags added to `index.html`
4. **Service Worker Registration** - Auto-registered in `src/main.tsx`

## 📱 Required Icons

You need to create app icons in the following sizes and place them in `/public/images/`:

- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

### How to Generate Icons

1. **Option 1: Online Tools**
   - Use [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - Or use [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Upload your logo and generate all required sizes

2. **Option 2: Manual Creation**
   - Use your existing logo (`/public/images/vertexpos-logo.png`)
   - Resize it to square format (192x192 and 512x512)
   - Save as `icon-192x192.png` and `icon-512x512.png` in `/public/images/`

3. **Option 3: Image Editor**
   - Use GIMP, Photoshop, or any image editor
   - Create square versions of your logo
   - Export as PNG files

## 🚀 Installation Instructions

### For Android Users:

1. Open the app in Chrome browser
2. Tap the menu (3 dots) → "Add to Home screen" or "Install app"
3. Confirm the installation
4. The app will appear on your home screen like a native app

### For iOS Users (Safari):

1. Open the app in Safari browser
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if needed
5. Tap "Add"
6. The app will appear on your home screen

## ✨ Features

- **Offline Support**: Service worker caches essential files
- **App-like Experience**: Runs in standalone mode (no browser UI)
- **Home Screen Icon**: Custom icon on device home screen
- **Splash Screen**: Shows your logo when launching
- **Fast Loading**: Cached resources load instantly

## 🔧 Testing PWA

1. Build the app: `bun run build`
2. Preview: `bun run preview`
3. Open in mobile browser
4. Check browser console for "SW registered" message
5. Test offline by disabling network in DevTools

## 📝 Notes

- Icons must be square (same width and height)
- Icons should have transparent or solid backgrounds
- For best results, use PNG format
- The app works best when served over HTTPS (required for production)

## 🐛 Troubleshooting

- **Icons not showing**: Make sure icons exist in `/public/images/` with correct names
- **Service Worker not registering**: Check browser console for errors
- **App not installing**: Ensure you're using HTTPS or localhost
- **Offline not working**: Check service worker registration in DevTools → Application → Service Workers

