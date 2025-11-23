# 🚀 Deployment Guide - Smart Health Monitoring App

## Prerequisites

Before you begin, make sure you have:
- Node.js (v18 or higher) installed
- A Supabase account (free tier available)
- A Google Gemini API key

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization and set project details
   - Wait for the project to be created

2. **Run Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql`
   - Paste and run the SQL script
   - This will create all tables, policies, and indexes

3. **Get Supabase Credentials**
   - Go to Settings → API
   - Copy your `Project URL` and `anon/public` key

### 3. Setup Gemini API

1. **Get API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **Important**: Replace the placeholder values with your actual credentials

### 5. Run the Application

**Development Mode:**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

**Production Build:**
```bash
npm run build
npm run preview
```

## Testing the App

### Creating Test Users

1. **Register as a Patient**
   - Go to `/register`
   - Fill in the form and select "Patient" role
   - Complete registration

2. **Register as a Caretaker**
   - Register another account with "Caretaker" role
   - This account can monitor patients

### Testing Features

**For Patients:**
1. ✅ Sign in with patient credentials
2. ✅ Navigate to Doctor Bot and test AI chat
3. ✅ Try Symptom Checker with sample symptoms
4. ✅ Visit Health Metrics to see the dashboard
5. ✅ Test Manual SOS Alert button

**For Caretakers:**
1. ✅ Sign in with caretaker credentials
2. ✅ Add patients to monitor
3. ✅ View patient health metrics
4. ✅ Check real-time alerts

### Simulating Sensor Data

Since this is a demo, you'll need to manually insert sensor data for testing:

```sql
-- Insert sample sensor data (run in Supabase SQL Editor)
INSERT INTO sensor_data (patient_id, bpm, spo2, temperature, rr_interval, latitude, longitude)
VALUES 
  ('patient_user_id_here', 75, 98, 36.5, 800, 28.7041, 77.1025),
  ('patient_user_id_here', 78, 97, 36.6, 820, 28.7041, 77.1025),
  ('patient_user_id_here', 82, 96, 36.7, 850, 28.7041, 77.1025);
```

Replace `patient_user_id_here` with the actual patient's user ID from the profiles table.

## Browser Compatibility

### Required Features:
- ✅ Modern browsers (Chrome, Firefox, Edge, Safari)
- 🎤 Speech Recognition (for voice input)
- 🔊 Text-to-Speech (for voice output)
- 📍 Geolocation API (for GPS tracking)

**Note**: Some features may not work in older browsers or without HTTPS in production.

## Deployment to Production

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build and deploy:
   ```bash
   npm run build
   netlify deploy --prod
   ```

3. Configure environment variables in Netlify dashboard

### Option 3: Traditional Hosting

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your hosting provider
3. Configure environment variables on your hosting platform

## Security Considerations

1. ✅ Never commit `.env` file to version control
2. ✅ Use HTTPS in production for geolocation and speech APIs
3. ✅ Supabase RLS policies are enabled for data security
4. ✅ All API keys should be kept secret
5. ✅ Regularly rotate API keys in production

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Check that your `.env` file exists and has correct variable names (VITE_ prefix)

### Issue: Voice features not working
**Solution**: 
- Ensure you're using HTTPS (required for mic access)
- Check browser permissions for microphone
- Use Chrome/Edge for best compatibility

### Issue: Map not displaying
**Solution**: 
- Check browser console for errors
- Verify latitude/longitude values are valid
- Ensure internet connection for map tiles

### Issue: Real-time updates not working
**Solution**:
- Check Supabase project is active
- Verify RLS policies are correctly set
- Check browser console for WebSocket errors

## Performance Optimization

1. **Database Indexes**: Already included in schema
2. **Real-time Subscriptions**: Limited to necessary channels
3. **Data Pagination**: Implemented (20 records limit)
4. **Image Optimization**: Using CDN for Leaflet icons

## Support & Feedback

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs for database errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

---

**Congratulations!** 🎉 Your Smart Health Monitoring App is now ready to use!
