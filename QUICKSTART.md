# ⚡ Quick Start Guide

Get your Smart Health Monitoring App running in **5 minutes**!

## 🎯 Prerequisites

- Node.js installed (v18+)
- A Supabase account (free)
- A Google Gemini API key (free)

---

## 🚀 Setup in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

1. Create `.env` file in the root folder
2. Copy this template:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

3. Get your keys:
   - **Supabase**: Create project at [supabase.com](https://supabase.com) → Settings → API
   - **Gemini**: Get key at [Google AI Studio](https://makersuite.google.com/app/apikey)

### Step 3: Setup Database

1. Go to your Supabase project
2. Open **SQL Editor**
3. Copy & paste the content from `supabase-schema.sql`
4. Click **Run**

---

## ▶️ Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

---

## 📱 Test the App

### Create Test Accounts

1. **Patient Account**
   - Click "Get Started"
   - Register with Patient role
   - Try Doctor Bot, Symptom Checker

2. **Caretaker Account**
   - Register another account
   - Select Caretaker role
   - Add patients to monitor

### Test Features

✅ **Doctor Bot**: Ask "What should I do if I have a fever?"  
✅ **Symptom Checker**: Enter "headache and fever"  
✅ **Voice Input**: Click microphone icon (allow browser permission)  
✅ **Health Metrics**: View dashboard and charts  

---

## 📊 Add Sample Health Data

Since this is a demo, manually insert test data in Supabase SQL Editor:

```sql
-- Replace 'patient_user_id' with actual patient ID from profiles table
INSERT INTO sensor_data (patient_id, bpm, spo2, temperature, rr_interval, latitude, longitude)
VALUES 
  ('patient_user_id', 72, 98, 36.5, 800, 28.7041, 77.1025),
  ('patient_user_id', 75, 97, 36.6, 820, 28.7041, 77.1025),
  ('patient_user_id', 78, 98, 36.7, 850, 28.7041, 77.1025);
```

Now refresh the Health Metrics page to see charts and data!

---

## 🎨 Project Structure

```
m_project/
├── src/
│   ├── pages/              # All page components
│   │   ├── LandingPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── SignInPage.tsx
│   │   ├── MainDashboard.tsx
│   │   ├── DoctorBot.tsx
│   │   ├── SymptomChecker.tsx
│   │   └── HealthMetrics.tsx
│   ├── components/         # Reusable components
│   ├── lib/               # API configurations
│   ├── store/             # State management
│   ├── types/             # TypeScript types
│   └── utils/             # Helper functions
├── supabase-schema.sql    # Database setup
├── package.json
└── .env                   # Your secrets (create this!)
```

---

## ⚠️ Common Issues

**Issue**: "Missing environment variables"  
**Fix**: Make sure `.env` file exists with `VITE_` prefix

**Issue**: Voice input not working  
**Fix**: Allow microphone permission in browser, use Chrome/Edge

**Issue**: No health data showing  
**Fix**: Insert sample data using SQL above

**Issue**: Map not displaying  
**Fix**: Check internet connection, verify lat/lng values

---

## 📚 Next Steps

- Read `FEATURES.md` for detailed feature documentation
- Check `DEPLOYMENT.md` for production deployment guide
- Explore the code and customize as needed

---

## 🆘 Need Help?

1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Ensure all environment variables are set correctly
4. Review `DEPLOYMENT.md` for troubleshooting

---

**You're all set! 🎉 Enjoy building your health monitoring app!**

For detailed deployment instructions, see `DEPLOYMENT.md`
