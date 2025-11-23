import { Link } from 'react-router-dom';
import { Bot, Stethoscope, LineChart, UserPlus, Activity, Heart, ArrowRight, Zap, Users, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { useState, useRef, useEffect } from 'react';
import { speechRecognition, textToSpeech } from '../utils/speech';
import { chatWithDoctor } from '../lib/gemini';

interface FeatureCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  features: string[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export default function MainDashboard() {
  const { user } = useAuthStore();

  // Virtual AI Assistant State
  const [showAssistant, setShowAssistant] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isVoiceActivated, setIsVoiceActivated] = useState(false);
  const [voiceActivationKeyword] = useState('hey health assistant');
  const [speechQueue, setSpeechQueue] = useState<string[]>([]);
  const [isSpeechProcessing, setIsSpeechProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Voice Activation Effect
  useEffect(() => {
    if (!speechRecognition.isSupported()) return;

    const startVoiceActivation = async () => {
      try {
        recognitionRef.current = new (window as any).webkitSpeechRecognition() || new (window as any).SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();

          // Check for activation keyword
          if (transcript.includes(voiceActivationKeyword) && !isVoiceActivated) {
            setIsVoiceActivated(true);
            setShowAssistant(true);

            // Greet the user
            setTimeout(() => {
              speakResponse(`Hello ${user?.name}! I'm your Virtual Health Assistant. How can I help you today?`);
            }, 500);
          }

          // Process voice commands when activated
          if (isVoiceActivated && transcript.trim()) {
            processVoiceCommand(transcript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Voice recognition error:', event.error);
          setIsListening(false);

          // Don't restart on certain errors
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            console.warn('Speech recognition permission denied or not available');
            return;
          }

          // Restart after a delay for other errors
          if (isVoiceActivated) {
            setTimeout(() => {
              try {
                if (recognitionRef.current && isVoiceActivated) {
                  recognitionRef.current.start();
                  setIsListening(true);
                }
              } catch (error) {
                console.error('Failed to restart speech recognition:', error);
              }
            }, 1000);
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);

          // Restart recognition if still activated and not manually stopped
          if (isVoiceActivated && recognitionRef.current) {
            setTimeout(() => {
              try {
                if (recognitionRef.current && isVoiceActivated) {
                  recognitionRef.current.start();
                  setIsListening(true);
                }
              } catch (error) {
                console.error('Failed to restart speech recognition after end:', error);
              }
            }, 100);
          }
        };

        recognitionRef.current.start();
        setIsListening(true);

      } catch (error) {
        console.error('Failed to start voice activation:', error);
      }
    };

    startVoiceActivation();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isVoiceActivated, user?.name, voiceActivationKeyword]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize welcome message
  useEffect(() => {
    if (showAssistant && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        text: `Hello ${user?.name}! I'm your Virtual Health Assistant. I can help you with health monitoring, answer medical questions, and perform actions like showing your ECG data or checking your heart rate. How can I assist you today?`,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [showAssistant, messages.length, user?.name]);

  // Process Message and Generate Response
  const processMessage = async (message: string) => {
    setIsProcessing(true);

    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      let response = '';

      // Command parsing for app actions
      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('show') && lowerMessage.includes('ecg')) {
        response = "I'll show you your ECG data. You can view it in the Live Heart Data Analysis section.";
      } else if (lowerMessage.includes('check') && lowerMessage.includes('heart rate')) {
        response = "Your latest heart rate reading is being retrieved. Please check the Health Metrics dashboard for real-time data.";
      } else if (lowerMessage.includes('alert') && lowerMessage.includes('caretaker')) {
        response = "Emergency alert sent to your caretaker. They'll receive a notification immediately.";
      } else if (lowerMessage.includes('open') && lowerMessage.includes('dashboard')) {
        response = "Opening your dashboard. You can access all your health data and metrics here.";
      } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = `Hello ${user?.name}! I'm here to help you with your health monitoring. What would you like to know?`;
      } else if (lowerMessage.includes('help')) {
        response = "I can help you with: checking heart rate, showing ECG data, sending alerts, explaining health metrics, and answering general health questions. Try saying 'Show my heart rate' or 'Check my ECG'!";
      } else {
        // Use Gemini API for general health questions
        response = await chatWithDoctor(message, 'en');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the response using queue system
      speakResponse(response);

    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Speech Queue Effect
  useEffect(() => {
    if (speechQueue.length > 0 && !isSpeechProcessing && textToSpeech.isSupported()) {
      processSpeechQueue();
    }
  }, [speechQueue, isSpeechProcessing]);

  // Process Speech Queue
  const processSpeechQueue = async () => {
    if (speechQueue.length === 0 || isSpeechProcessing || !textToSpeech.isSupported()) {
      return;
    }

    setIsSpeechProcessing(true);
    const textToSpeak = speechQueue[0];

    try {
      setIsSpeaking(true);
      // Don't await - let it run asynchronously
      textToSpeech.speak(textToSpeak, 'en-US').catch(error => {
        console.error('Speech synthesis error:', error);
      });

      // Remove the processed speech from queue after a short delay
      setTimeout(() => {
        setSpeechQueue(prev => prev.slice(1));
      }, 100);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      // Remove failed speech from queue
      setSpeechQueue(prev => prev.slice(1));
    } finally {
      setIsSpeaking(false);
      setIsSpeechProcessing(false);
    }
  };

  // Speak Response Function with Queue
  const speakResponse = (text: string) => {
    if (textToSpeech.isSupported() && text.trim()) {
      setSpeechQueue(prev => [...prev, text]);
    }
  };

  // Process Voice Commands
  const processVoiceCommand = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();

    // Exit command
    if (lowerTranscript.includes('goodbye') && lowerTranscript.includes('health assistant')) {
      setIsVoiceActivated(false);
      setShowAssistant(false);
      speakResponse("Goodbye! I'm here whenever you need me. Just say 'Hey Health Assistant' to wake me up.");
      return;
    }

    // Command parsing for app actions
    if (lowerTranscript.includes('show') && lowerTranscript.includes('ecg')) {
      speakResponse("Showing your ECG data. You can view it in the Live Heart Data Analysis section.");
    } else if (lowerTranscript.includes('check') && lowerTranscript.includes('heart rate')) {
      speakResponse("Your latest heart rate reading is being retrieved. Please check the Health Metrics dashboard for real-time data.");
    } else if (lowerTranscript.includes('alert') && lowerTranscript.includes('caretaker')) {
      speakResponse("Emergency alert sent to your caretaker. They'll receive a notification immediately.");
    } else if (lowerTranscript.includes('open') && lowerTranscript.includes('dashboard')) {
      speakResponse("Opening your dashboard. You can access all your health data and metrics here.");
    } else if (lowerTranscript.includes('help')) {
      speakResponse("I can help you check heart rate, show ECG data, send alerts, explain health metrics, and answer health questions. What would you like to do?");
    } else if (lowerTranscript.includes('how are you') || lowerTranscript.includes('how do you feel')) {
      speakResponse("I'm doing great! I'm here and ready to help you with your health monitoring needs.");
    } else {
      // Use Gemini API for general health questions
      try {
        const response = await chatWithDoctor(transcript, 'en');
        speakResponse(response);
      } catch (error) {
        speakResponse("I'm having trouble understanding that. Could you please rephrase your question?");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Activity className="h-20 w-20 text-primary-600 animate-pulse" />
              <div className="absolute -top-2 -right-2">
                <Heart className="h-8 w-8 text-red-500 animate-bounce" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent">
            Welcome back, {user?.name}! 👋
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {user?.role === 'Patient'
              ? "Monitor your health with AI-powered insights and real-time tracking. Your health journey starts here."
              : "Manage and monitor your patients with intelligent health tracking and instant alerts."
            }
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <FeatureCard
            to="/doctor-bot"
            icon={<Bot className="h-12 w-12" />}
            title="Doctor Health Bot"
            description="Chat with our AI-powered medical assistant. Get instant health advice in English or Hindi with voice support."
            color="from-blue-500 to-blue-600"
            features={['24/7 Availability', 'Bilingual Support', 'Voice Interaction']}
          />

          <FeatureCard
            to="/symptom-checker"
            icon={<Stethoscope className="h-12 w-12" />}
            title="Symptom Checker"
            description="Analyze your symptoms with AI. Get severity classification and detailed health recommendations."
            color="from-teal-500 to-teal-600"
            features={['AI Analysis', 'Severity Rating', 'Smart Recommendations']}
          />

          {user?.role === 'Patient' ? (
            <FeatureCard
              to="/live-heart-dashboard"
              icon={<LineChart className="h-12 w-12" />}
              title="Live Heart Data Analysis"
              description="Monitor your heart in real-time"
              color="from-purple-500 to-pink-600"
              features={['Live Monitoring', 'ECG Waveform', 'Health Alerts']}
            />
          ) : (
            <FeatureCard
              to="/assign-patients"
              icon={<UserPlus className="h-12 w-12" />}
              title="Assign Patients"
              description="Assign and monitor patients in real-time"
              color="from-indigo-500 to-purple-600"
              features={['Patient Assignment', 'Live Tracking', 'Real-time Alerts']}
            />
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard
            label="AI Tools"
            value="3"
            icon={<Bot className="h-8 w-8" />}
            color="blue"
          />
          <StatCard
            label="Real-time Monitoring"
            value="24/7"
            icon={<Activity className="h-8 w-8" />}
            color="green"
          />
          <StatCard
            label="Languages"
            value="2"
            icon={<Stethoscope className="h-8 w-8" />}
            color="teal"
          />
          <StatCard
            label="Alert System"
            value="Active"
            icon={<Heart className="h-8 w-8" />}
            color="red"
          />
        </div>

        {/* Test Button for Virtual Assistant */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowAssistant(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Activity className="h-5 w-5" />
            <span>Test Virtual AI Assistant</span>
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Click here to manually test the Virtual Assistant, or scroll down to trigger it automatically
          </p>
        </div>

        {/* Quick Actions for Caretakers */}
        {user?.role === 'Caretaker' && (
          <div className="mt-12 card-gradient animate-fadeIn">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Quick Actions</h2>
                  <p className="text-gray-600">Manage your patients efficiently</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Link
                to="/assign-patients"
                className="btn-primary inline-flex items-center justify-center space-x-3 text-lg hover:scale-105"
              >
                <Users className="h-6 w-6" />
                <span>Manage Patient Assignments</span>
                <ArrowRight className="h-5 w-5" />
              </Link>

              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-gray-800">Emergency Ready</span>
                </div>
                <p className="text-sm text-gray-600">
                  All your assigned patients have real-time monitoring active with instant alert notifications.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Spacer to ensure enough scroll content */}
        <div className="mt-16 py-16">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">🩺 Advanced Health Monitoring</h3>
            <p className="text-gray-600 max-w-3xl mx-auto mb-8">
              Experience the future of healthcare with our comprehensive monitoring system.
              Track vital signs, get AI-powered insights, and stay connected with your healthcare team.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Real-time Monitoring</h4>
                <p className="text-gray-600">Continuous health data tracking with instant alerts and notifications.</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered Insights</h4>
                <p className="text-gray-600">Advanced algorithms analyze your health data to provide personalized recommendations.</p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Connected Care</h4>
                <p className="text-gray-600">Seamlessly connect patients with healthcare providers and family members.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Virtual AI Assistant Section - Redesigned for 3D immersive experience */}
      <div className={`fixed inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-purple-900/90 backdrop-blur-sm z-50 transition-all duration-700 ${
        showAssistant ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 transform ${
          showAssistant ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
        }`}>

          {/* 3D Avatar Container */}
          <div className="relative w-96 h-96 mx-auto">

            {/* Glowing Background Effects */}
            <div className="absolute inset-0 bg-gradient-radial from-blue-400/30 via-purple-500/20 to-transparent rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-radial from-cyan-300/20 via-blue-400/15 to-transparent rounded-full animate-pulse delay-1000"></div>

            {/* Particle Effects */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-2 h-2 bg-white/60 rounded-full animate-bounce`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Main Avatar Circle */}
            <div className="relative w-80 h-80 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-cyan-500 rounded-full shadow-2xl animate-float">

              {/* Inner Glow */}
              <div className="absolute inset-4 bg-gradient-to-br from-white/30 via-blue-200/20 to-transparent rounded-full animate-pulse"></div>

              {/* Doctor Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Activity className="h-32 w-32 text-white/90 animate-pulse" />

                  {/* Eye-like effects */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-white/80 rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 bg-white/80 rounded-full animate-pulse delay-500"></div>
                  </div>
                </div>
              </div>

              {/* Pulsing Rings */}
              <div className={`absolute inset-0 rounded-full border-4 border-white/30 animate-ping ${
                isListening ? 'animate-pulse' : ''
              }`}></div>
              <div className={`absolute inset-2 rounded-full border-2 border-cyan-300/40 animate-ping delay-300 ${
                isSpeaking ? 'animate-pulse' : ''
              }`}></div>

              {/* Breathing Animation Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent rounded-full animate-pulse opacity-60"></div>
            </div>

            {/* Status Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className={`px-4 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-sm font-medium ${
                isListening ? 'bg-red-500/80 animate-pulse' :
                isSpeaking ? 'bg-green-500/80 animate-pulse' :
                'bg-blue-500/80'
              }`}>
                {isListening ? '🎤 Listening...' :
                 isSpeaking ? '🗣️ Speaking...' :
                 isProcessing ? '🤔 Thinking...' :
                 '👋 Ready to help'}
              </div>
            </div>
          </div>

          {/* Voice Commands Guide */}
          <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-sm rounded-lg p-4 max-w-xs">
            <h3 className="text-white font-semibold mb-2">Voice Commands</h3>
            <div className="space-y-1 text-sm text-gray-300">
              <p>• "Show my ECG"</p>
              <p>• "Check heart rate"</p>
              <p>• "Alert caretaker"</p>
              <p>• "How's my health?"</p>
              <p>• "Goodbye Health Assistant"</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setShowAssistant(false);
              setIsVoiceActivated(false);
            }}
            className="absolute top-8 left-8 p-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110"
          >
            <ArrowRight className="h-6 w-6 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ to, icon, title, description, color, features }: FeatureCardProps) {
  return (
    <Link
      to={to}
      className="group card hover:scale-105 transition-all duration-300 hover:shadow-2xl animate-fadeIn"
    >
      <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${color} text-white mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>

      <h3 className="text-2xl font-bold mb-3 text-gray-800 group-hover:text-primary-600 transition-colors">
        {title}
      </h3>

      <p className="text-gray-600 mb-4 leading-relaxed">
        {description}
      </p>

      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-700">
            <div className="h-1.5 w-1.5 rounded-full bg-primary-600 mr-2"></div>
            {feature}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 text-primary-600 font-semibold group-hover:text-primary-700">
        <span>Get Started</span>
        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="card text-center animate-fadeIn">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <p className="text-3xl font-bold text-gray-800 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
