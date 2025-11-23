import { Link } from 'react-router-dom';
import { Activity, Heart, Users, Bot, Stethoscope, LineChart, ArrowRight, Shield, MapPin, Star, Zap, Phone, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center animate-fadeIn">
            <div className="flex justify-center mb-8 relative">
              <div className="relative">
                <Activity className="h-24 w-24 text-primary-600 animate-pulse" />
                <div className="absolute -top-2 -right-2">
                  <Heart className="h-8 w-8 text-red-500 animate-bounce" />
                </div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Smart Health
              <br />
              <span className="text-gray-800">Monitoring</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-10 leading-relaxed font-light">
              Monitor your health in real-time with AI-powered insights.
              Connect with caretakers, track vital signs, and get instant medical assistance
              through our intelligent health monitoring system.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/register"
                className="group btn-gradient inline-flex items-center justify-center space-x-3 text-lg px-10 py-4 hover:scale-105"
              >
                <Zap className="h-6 w-6 group-hover:animate-pulse" />
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/signin"
                className="btn-secondary inline-flex items-center justify-center space-x-2 text-lg px-10 py-4 hover:scale-105"
              >
                <span>Sign In</span>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex justify-center items-center gap-8 mt-12 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>HIPAA Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced decorative elements */}
        <div className="absolute top-20 left-10 opacity-10 animate-float">
          <Heart className="h-40 w-40 text-red-400" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-10 animate-float-delayed">
          <Activity className="h-48 w-48 text-blue-400" />
        </div>
        <div className="absolute top-1/2 left-1/4 opacity-5 animate-pulse">
          <LineChart className="h-32 w-32 text-purple-400" />
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Comprehensive Health Monitoring
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for complete health monitoring in one intelligent platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Bot className="h-10 w-10" />}
            title="AI Doctor Bot"
            description="Get instant medical advice through our AI-powered health assistant. Available 24/7 in English and Hindi with voice support."
            color="from-blue-500 to-blue-600"
            features={['24/7 Availability', 'Bilingual Support', 'Voice Interaction']}
          />

          <FeatureCard
            icon={<Stethoscope className="h-10 w-10" />}
            title="Symptom Checker"
            description="Analyze your symptoms with AI and receive severity classification with detailed recommendations and next steps."
            color="from-teal-500 to-teal-600"
            features={['AI Analysis', 'Severity Rating', 'Smart Recommendations']}
          />

          <FeatureCard
            icon={<LineChart className="h-10 w-10" />}
            title="Real-Time Metrics"
            description="Monitor heart rate, blood pressure, SpO2, temperature, and other vital signs with live updates and interactive charts."
            color="from-green-500 to-green-600"
            features={['Live Monitoring', 'Interactive Charts', 'Health Trends']}
          />

          <FeatureCard
            icon={<Users className="h-10 w-10" />}
            title="Caretaker Support"
            description="Connect with caretakers who can monitor your health metrics, receive instant alerts, and provide emergency assistance."
            color="from-purple-500 to-purple-600"
            features={['Patient Assignment', 'Live Tracking', 'Real-time Alerts']}
          />

          <FeatureCard
            icon={<Shield className="h-10 w-10" />}
            title="Smart Alerts"
            description="Automatic alerts for abnormal readings, manual SOS button for emergencies, and smart notifications for caretakers."
            color="from-red-500 to-red-600"
            features={['Auto Alerts', 'SOS Button', 'Smart Notifications']}
          />

          <FeatureCard
            icon={<MapPin className="h-10 w-10" />}
            title="GPS Tracking"
            description="Real-time location tracking for emergencies, ensuring help reaches you quickly with precise location data."
            color="from-orange-500 to-orange-600"
            features={['Live Location', 'Emergency Response', 'Privacy Protected']}
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              How It Works
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Get started in three simple steps and take control of your health monitoring
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <Step
              number="1"
              title="Register"
              description="Create your account as a Patient or Caretaker with your basic information and preferences."
              icon={<Users className="h-8 w-8" />}
            />
            <Step
              number="2"
              title="Connect"
              description="Patients can link with caretakers for continuous health monitoring and emergency support."
              icon={<Heart className="h-8 w-8" />}
            />
            <Step
              number="3"
              title="Monitor"
              description="Track vital signs in real-time, use AI tools, receive alerts, and stay connected with your care team."
              icon={<Activity className="h-8 w-8" />}
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="card-gradient max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <Clock className="h-16 w-16 text-primary-600 animate-pulse" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of users who are already monitoring their health smarter with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn-gradient inline-flex items-center justify-center space-x-3 text-lg px-10 py-4 hover:scale-105"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Phone className="h-4 w-4" />
              <span>24/7 Support Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Activity className="h-8 w-8 text-primary-400" />
              <span className="text-2xl font-bold">Smart Health Monitoring</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Empowering patients and caretakers with intelligent health monitoring technology for better healthcare outcomes.
            </p>
            <p className="flex items-center justify-center space-x-2 text-gray-500">
              <span>© 2025 Smart Health Monitoring App.</span>
              <Heart className="h-4 w-4 text-red-400" />
              <span>Built with ❤️ for better healthcare</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  features: string[];
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ icon, title, description, color, features }: FeatureCardProps) {
  const cardStyles: Record<string, string> = {
    'from-blue-500 to-blue-600': 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200',
    'from-teal-500 to-teal-600': 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-teal-200',
    'from-green-500 to-green-600': 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-200',
    'from-purple-500 to-purple-600': 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-200',
    'from-red-500 to-red-600': 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-200',
    'from-orange-500 to-orange-600': 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-orange-200',
  };

  const iconStyles: Record<string, string> = {
    'from-blue-500 to-blue-600': 'bg-white/20 text-white',
    'from-teal-500 to-teal-600': 'bg-white/20 text-white',
    'from-green-500 to-green-600': 'bg-white/20 text-white',
    'from-purple-500 to-purple-600': 'bg-white/20 text-white',
    'from-red-500 to-red-600': 'bg-white/20 text-white',
    'from-orange-500 to-orange-600': 'bg-white/20 text-white',
  };

  return (
    <div className={`group card hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeIn ${cardStyles[color]}`}>
      <div className={`inline-flex p-4 rounded-xl ${iconStyles[color]} mb-6 backdrop-blur-sm`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="leading-relaxed opacity-90 mb-4">{description}</p>
      {features && (
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 opacity-80">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="text-center text-white">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white text-primary-600 font-bold text-2xl mb-4">
        {number}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-blue-100 leading-relaxed">{description}</p>
    </div>
  );
}
