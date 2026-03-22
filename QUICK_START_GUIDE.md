# ⚡ Quick Start Guide - Backend & Build

## 🚀 Get Running in 15 Minutes

### **STEP 1: Environment Setup (5 minutes)**

```bash
# 1. Get your Supabase credentials
# Go to: https://supabase.com/dashboard/project/jvrrqxaagjykrswelvno/settings/api
# Copy: Project URL and anon key

# 2. Update .env file
VITE_SUPABASE_URL=https://jvrrqxaagjykrswelvno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_KEY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_SERVICE_KEY
```

### **STEP 2: Install Dependencies (2 minutes)**

```bash
npm install
```

### **STEP 3: Start Development Server (1 minute)**

```bash
npm run dev
```

**🎉 Your app should now be running at: http://localhost:3000**

---

## 🔧 Common Issues & Quick Fixes

### **Issue: `net::ERR_CONNECTION_REFUSED`**
```bash
# Kill any existing node processes
taskkill /F /IM node.exe

# Restart dev server
npm run dev
```

### **Issue: Supabase Connection Errors**
```bash
# Check your .env file has REAL keys (not placeholders)
# Keys should start with "eyJ" not "sb_publishable_"
```

### **Issue: Port Already in Use**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /F /PID [PID_NUMBER]
```

---

## 📋 Essential Pre-Flight Checks

### **Before You Start Development**
- [ ] Real Supabase keys in `.env` (not placeholders)
- [ ] `npm install` completed successfully
- [ ] Browser shows no console errors
- [ ] Navigation between pages works
- [ ] Scroll-to-top functionality works

### **Testing Core Features**
- [ ] Homepage loads correctly
- [ ] Product browsing works
- [ ] Add to cart functionality
- [ ] Checkout page loads
- [ ] Responsive design on mobile

---

## 🏗️ Production Build Quick Start

### **Build for Production**
```bash
# Create production build
npm run build

# Test production build locally
npm run preview
```

### **Deploy to Hosting**
```bash
# Upload the 'dist' folder to your hosting provider
# Configure environment variables in hosting panel
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
```

---

## 🎯 Immediate Action Items

### **Today (Priority 1)**
1. **Get real Supabase keys** from dashboard
2. **Update .env file** with real credentials  
3. **Test local development** works
4. **Verify basic functionality** (navigation, pages load)

### **This Week (Priority 2)**
1. **Set up Stripe account** and get API keys
2. **Deploy Edge Functions** to Supabase
3. **Test checkout flow** with test payments
4. **Configure email service** (Resend)

### **Next Week (Priority 3)**
1. **Production build and deployment**
2. **Domain setup and SSL**
3. **Performance optimization**
4. **Security audit**

---

## 🛠️ Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Test production build locally
npm run lint         # Run ESLint

# Supabase (if using CLI)
supabase login       # Login to Supabase
supabase link        # Link to project
supabase functions deploy [name]  # Deploy Edge Functions
```

---

## 📁 Key Files to Know

### **Configuration**
- `.env` - Environment variables
- `vite.config.js` - Vite configuration
- `package.json` - Dependencies and scripts

### **Core Application**
- `src/App.jsx` - Main app component
- `src/routes/index.jsx` - Route definitions
- `src/lib/env.js` - Environment validation

### **Backend Integration**
- `src/lib/supabaseClient.js` - Supabase client
- `src/services/` - API service functions
- `supabase/functions/` - Edge Functions

---

## 🚨 Critical Path to Launch

### **Must Complete (Blockers)**
1. ✅ Real Supabase credentials
2. ✅ Local development working
3. ⏳ Stripe payment setup
4. ⏳ Edge Functions deployed
5. ⏳ Production build

### **Should Complete (Important)**
1. ⏳ Email service setup
2. ⏳ Domain configuration
3. ⏳ Performance optimization
4. ⏳ Security review

---

## 💡 Pro Tips

### **Development Tips**
- Keep browser console open for errors
- Use Chrome DevTools for responsive testing
- Test with different network conditions
- Check mobile viewport regularly

### **Environment Tips**
- Never commit `.env` to git
- Use different keys for dev/prod
- Test with real data, not mocks
- Keep backup of your keys

### **Performance Tips**
- Optimize images before upload
- Use lazy loading for long pages
- Monitor bundle size
- Test on slow connections

---

## 🆘 Getting Help

### **Check These First**
1. Browser console for errors
2. Network tab for failed requests
3. Environment variables are loaded
4. Supabase dashboard shows project status

### **Common Debugging**
```javascript
// In browser console, test Supabase connection
import { supabase } from './src/lib/supabaseClient.js';
supabase.from('profiles').select('count').then(console.log);
```

### **Useful Resources**
- Supabase Docs: https://supabase.com/docs
- Vite Docs: https://vitejs.dev
- Stripe Docs: https://stripe.com/docs
- React Router: https://reactrouter.com

---

## 🎉 Success Indicators

### **You're Ready When:**
- ✅ Dev server runs without errors
- ✅ All pages load successfully  
- ✅ No console errors in browser
- ✅ Navigation works smoothly
- ✅ Responsive design works
- ✅ Environment variables validated

### **Production Ready When:**
- ✅ Build completes without warnings
- ✅ Preview mode works perfectly
- ✅ All API calls work in production
- ✅ Payment flow tested successfully
- ✅ Email notifications working
- ✅ Performance benchmarks met

**🚀 Start with getting real Supabase keys and you'll be up and running!**
