import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Mic, MicOff, Volume2, VolumeX, Bot, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { chatWithDoctor } from '../lib/gemini';
import { speechRecognition, textToSpeech } from '../utils/speech';
import toast from 'react-hot-toast';
import type { ChatMessage } from '../types';

export default function DoctorBot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI health assistant. How can I help you today? You can type or use voice input. 🩺',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithDoctor(input, language);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to get response. Please try again.');
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (!speechRecognition.isSupported()) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    try {
      setIsListening(true);
      const langCode = language === 'en' ? 'en-US' : 'hi-IN';
      const transcript = await speechRecognition.listen(langCode);
      setInput(transcript);
      toast.success('Voice input captured!');
    } catch (error) {
      console.error('Voice input error:', error);
      toast.error('Failed to capture voice input');
    } finally {
      setIsListening(false);
    }
  };

  const handleSpeak = async (text: string) => {
    if (!textToSpeech.isSupported()) {
      toast.error('Text-to-speech is not supported in your browser');
      return;
    }

    try {
      setIsSpeaking(true);
      const langCode = language === 'en' ? 'en-US' : 'hi-IN';
      await textToSpeech.speak(text, langCode);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      toast.error('Failed to speak text');
    } finally {
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    textToSpeech.stop();
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="card animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Doctor Health Bot</h1>
                <p className="text-sm text-gray-600">AI-powered medical assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'en'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  language === 'hi'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto mb-4 space-y-4 px-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="h-5 w-5 text-white" />
                  ) : (
                    <Bot className="h-5 w-5 text-white" />
                  )}
                </div>

                <div
                  className={`flex-1 p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() =>
                          isSpeaking ? stopSpeaking() : handleSpeak(message.content)
                        }
                        className="text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center space-x-1"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="h-4 w-4" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4" />
                            <span>Speak</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleVoiceInput}
              disabled={isListening || loading}
              className={`p-3 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Voice Input"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                language === 'en'
                  ? 'Type your health question...'
                  : 'अपना स्वास्थ्य प्रश्न टाइप करें...'
              }
              className="flex-1 input-field"
              disabled={loading}
            />

            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 py-3"
              title="Send Message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            💡 Tip: Use voice input for hands-free interaction. Click the microphone icon to start.
          </p>
        </div>
      </div>
    </div>
  );
}
