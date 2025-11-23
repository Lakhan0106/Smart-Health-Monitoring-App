# 🏥 Smart Health Monitoring App

A modern, full-stack health monitoring application built with React, TypeScript, Supabase, and Gemini AI.

## ✨ Features

- 👥 **Role-Based Access**: Separate interfaces for Patients and Caretakers
- 🤖 **AI Doctor Bot**: Chat with an AI-powered health assistant (bilingual: English & Hindi)
- 🩺 **Symptom Checker**: AI-powered symptom analysis with severity classification
- 📊 **Real-Time Health Metrics**: Live monitoring of vital signs (BPM, RR interval, SpO2, etc.)
- 🚨 **Smart Alerts**: Automatic alerts for abnormal readings + manual SOS button
- 📍 **GPS Tracking**: Real-time location tracking for emergencies
- 🎤 **Voice Support**: Speech-to-text and text-to-speech in multiple languages
- 👨‍⚕️ **Caretaker Dashboard**: Monitor multiple patients with real-time data

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **AI**: Google Gemini API
- **Charts**: Recharts
- **Maps**: Leaflet + React-Leaflet
- **State Management**: Zustand
- **Icons**: Lucide React
- **Build Tool**: Vite

## 📦 Installation

1. **Clone the repository**
   ```bash
   cd m_project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Setup Supabase Database**
   
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the SQL script from `supabase-schema.sql`
   - This will create all necessary tables, policies, and indexes

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🗄️ Database Schema

### Tables

- **profiles**: User information with role (Patient/Caretaker)
- **sensor_data**: Real-time health metrics
- **alerts**: System and manual alerts
- **caretaker_assignments**: Patient-Caretaker relationships

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure authentication via Supabase Auth
- Environment variables for sensitive data

## 📱 Key Pages

1. **Landing Page**: Introduction and call-to-action
2. **Registration**: Role-based user registration
3. **Sign In**: Secure login with role-based routing
4. **Main Dashboard**: Hub with three main features
5. **Doctor Bot**: AI-powered health consultation
6. **Symptom Checker**: Intelligent symptom analysis
7. **Health Metrics**: Real-time monitoring and alerts

## 🎨 UI/UX

- Clean medical theme (Blue + Teal + White)
- Fully responsive design
- Smooth transitions and animations
- Accessibility-focused
- Modern card-based layouts

## 🚀 Build for Production

```bash
npm run build
npm run preview
```

## 📝 API Keys Required

1. **Supabase**: Create project at [supabase.com](https://supabase.com)
2. **Gemini API**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## 🤝 Contributing

This is a demonstration project. Feel free to fork and customize for your needs.

## 📄 License

MIT License

---

Built with ❤️ for better healthcare monitoring
# Smart-Health-Monitoring-App
