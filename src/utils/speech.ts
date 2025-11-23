// Speech Recognition (Speech-to-Text)
export class SpeechRecognition {
  private recognition: any;
  private isListening = false;
  private onCommand?: (command: string) => void;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  async listen(language: 'en-US' | 'hi-IN' = 'en-US'): Promise<string> {
    if (!this.recognition) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      this.recognition.lang = language;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(event.error));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      try {
        this.recognition.start();
        this.isListening = true;
      } catch (error) {
        reject(error);
      }
    });
  }

  // Voice command listening for emergency alerts
  startVoiceCommands(onCommand: (command: string) => void): void {
    if (!this.recognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.onCommand = onCommand;
    this.recognition.lang = 'en-US'; // Default to English for commands

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      console.log('Voice command detected:', transcript);

      // Check for emergency commands
      if (transcript.includes('send alert') || transcript.includes('help me') ||
          transcript.includes('emergency') || transcript.includes('alert')) {
        if (this.onCommand) {
          this.onCommand('EMERGENCY_ALERT');
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Voice command error:', event.error);
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('Voice commands started');
    } catch (error) {
      console.error('Failed to start voice commands:', error);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

// Text-to-Speech
export class TextToSpeech {
  private synth: SpeechSynthesis | null;

  constructor() {
    this.synth = window.speechSynthesis || null;
  }

  isSupported(): boolean {
    return !!this.synth;
  }

  speak(text: string, language: 'en-US' | 'hi-IN' = 'en-US'): Promise<void> {
    if (!this.synth) {
      return Promise.reject(new Error('Text-to-speech is not supported'));
    }

    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech first
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      try {
        this.synth!.speak(utterance);
      } catch (error) {
        reject(error);
      }
    });
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

// Create singleton instances
export const speechRecognition = new SpeechRecognition();
export const textToSpeech = new TextToSpeech();
