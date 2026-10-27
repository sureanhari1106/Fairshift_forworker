import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  language?: string; // 'ta-IN' or 'en-US'
  onTranscriptChange?: (text: string) => void;
}

export function useSpeechRecognition({ language = 'ta-IN', onTranscriptChange }: UseSpeechRecognitionOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check Web Speech API support
  const hasSpeechApi = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  // Initialize Web Speech Recognition if available
  useEffect(() => {
    if (hasSpeechApi) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === 'ta' || language === 'ta-IN' ? 'ta-IN' : 'en-US';

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        const cleaned = currentTranscript.trim();
        setTranscript(cleaned);
        if (onTranscriptChange) onTranscriptChange(cleaned);
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition event warning:', e.error);
        if (e.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        }
      };

      recognitionRef.current = rec;
    }
  }, [hasSpeechApi, language, onTranscriptChange]);

  const startRecording = useCallback(async () => {
    setError(null);
    audioChunksRef.current = [];

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Start MediaRecorder for audio recording
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Convert to base64 for API / persistence
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64Data = res.split(',')[1] || '';
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(250);

      // 3. Start speech recognition if supported
      if (recognitionRef.current) {
        try {
          recognitionRef.current.lang = language === 'ta' || language === 'ta-IN' ? 'ta-IN' : 'en-US';
          recognitionRef.current.start();
        } catch (recErr) {
          console.warn('Recognition start caught:', recErr);
        }
      }

      setIsRecording(true);
    } catch (err: any) {
      console.error('Audio recording failed to start:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone access was denied. You can still type your request manually.');
      } else {
        setError('Unable to access microphone on this device. You can type your request directly.');
      }
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Stop recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop error
      }
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
    setAudioUrl(null);
    setAudioBase64(null);
    setTranscript('');
    setError(null);
  }, [isRecording, stopRecording]);

  // Transcribe via Gemini backend if browser Speech API failed or was empty
  const transcribeAudioViaBackend = useCallback(async () => {
    if (!audioBase64) return;
    setIsTranscribing(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: 'audio/webm',
          language,
        }),
      });
      const data = await res.json();
      if (data.transcript) {
        setTranscript(data.transcript);
        if (onTranscriptChange) onTranscriptChange(data.transcript);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Could not reach transcription service. You can type your text manually.');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBase64, language, onTranscriptChange]);

  return {
    isRecording,
    transcript,
    setTranscript,
    audioUrl,
    audioBase64,
    error,
    isTranscribing,
    hasSpeechApi,
    startRecording,
    stopRecording,
    resetRecording,
    transcribeAudioViaBackend,
  };
}
