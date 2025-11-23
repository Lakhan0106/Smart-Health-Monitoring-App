import { useState } from 'react';
import { ArrowLeft, Search, Mic, MicOff, Volume2, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { analyzeSymptoms, type SymptomAnalysis } from '../lib/gemini';
import { speechRecognition, textToSpeech } from '../utils/speech';
import toast from 'react-hot-toast';

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleAnalyze = async () => {
    if (!symptoms.trim() || loading) return;

    setLoading(true);
    setAnalysis(null);

    try {
      const result = await analyzeSymptoms(symptoms, language);
      setAnalysis(result);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze symptoms. Please try again.');
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
      setSymptoms(transcript);
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
    } finally {
      setIsSpeaking(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Mild':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Severe':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 animate-fadeIn">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Symptom Checker</h1>
                  <p className="text-sm text-gray-600">AI-powered analysis</p>
                </div>
              </div>

              {/* Language Selection */}
              <div className="mb-4">
                <label className="label">Language</label>
                <div className="grid grid-cols-2 gap-2">
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

              {/* Symptom Input */}
              <div className="mb-4">
                <label className="label">
                  {language === 'en' ? 'Describe Your Symptoms' : 'अपने लक्षण बताएं'}
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'E.g., I have a headache, fever, and body pain...'
                      : 'उदाहरण: मुझे सिरदर्द, बुखार और शरीर में दर्द है...'
                  }
                  rows={6}
                  className="input-field resize-none"
                  disabled={loading}
                />
              </div>

              {/* Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                disabled={isListening || loading}
                className={`w-full mb-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-5 w-5" />
                    <span>Use Voice Input</span>
                  </>
                )}
              </button>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!symptoms.trim() || loading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    <span>Analyze Symptoms</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 mt-4 flex items-start">
                <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
                <span>
                  This is an AI-powered tool and should not replace professional medical advice.
                  Always consult a healthcare provider for accurate diagnosis.
                </span>
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {!analysis && !loading && (
              <div className="card text-center py-16 animate-fadeIn">
                <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {language === 'en' ? 'Ready to Analyze' : 'विश्लेषण के लिए तैयार'}
                </h3>
                <p className="text-gray-600">
                  {language === 'en'
                    ? 'Describe your symptoms and click analyze to get AI-powered insights'
                    : 'अपने लक्षणों का वर्णन करें और एआई-संचालित अंतर्दृष्टि प्राप्त करने के लिए विश्लेषण पर क्लिक करें'}
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6 animate-fadeIn">
                {/* Severity Card */}
                <div className={`card border-2 ${getSeverityColor(analysis.severity)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">
                      {language === 'en' ? 'Severity Level' : 'गंभीरता स्तर'}
                    </h2>
                    <button
                      onClick={() => handleSpeak(analysis.severity)}
                      disabled={isSpeaking}
                      className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-12 w-12" />
                    <span className="text-4xl font-bold">{analysis.severity}</span>
                  </div>
                </div>

                {/* Match Percentages */}
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">
                    {language === 'en' ? 'Match Analysis' : 'मिलान विश्लेषण'}
                  </h2>
                  <div className="space-y-4">
                    <ProgressBar
                      label="Mild"
                      percentage={analysis.matchPercentages.mild}
                      color="green"
                    />
                    <ProgressBar
                      label="Moderate"
                      percentage={analysis.matchPercentages.moderate}
                      color="yellow"
                    />
                    <ProgressBar
                      label="Severe"
                      percentage={analysis.matchPercentages.severe}
                      color="red"
                    />
                  </div>
                </div>

                {/* Possible Conditions */}
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">
                    {language === 'en' ? 'Possible Conditions' : 'संभावित स्थितियां'}
                  </h2>
                  <ul className="space-y-2">
                    {analysis.possibleConditions.map((condition, index) => (
                      <li
                        key={index}
                        className="flex items-start p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <span className="ml-3 text-gray-800">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="card">
                  <h2 className="text-xl font-bold mb-4">
                    {language === 'en' ? 'Recommendations' : 'सिफारिशें'}
                  </h2>
                  <ul className="space-y-3">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li
                        key={index}
                        className="flex items-start p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-800">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Detailed Explanation */}
                <div className="card bg-gradient-to-br from-primary-50 to-medical-light">
                  <h2 className="text-xl font-bold mb-4">
                    {language === 'en' ? 'Detailed Explanation' : 'विस्तृत स्पष्टीकरण'}
                  </h2>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {analysis.explanation}
                  </p>
                  <button
                    onClick={() => handleSpeak(analysis.explanation)}
                    disabled={isSpeaking}
                    className="mt-4 btn-secondary flex items-center space-x-2"
                  >
                    <Volume2 className="h-5 w-5" />
                    <span>{isSpeaking ? 'Speaking...' : 'Read Aloud'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  percentage: number;
  color: 'green' | 'yellow' | 'red';
}

function ProgressBar({ label, percentage, color }: ProgressBarProps) {
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-gray-800">{label}</span>
        <span className="font-bold text-gray-800">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
