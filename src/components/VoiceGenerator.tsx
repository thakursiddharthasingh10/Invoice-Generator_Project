import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Languages, 
  Sparkles, 
  Copy, 
  Check, 
  Sliders,
  AlertCircle,
  Mic,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Invoice } from '../types/invoice';
import { generateEnglishNarration, generateHindiNarration } from '../utils/invoiceNarration';
import { useToast } from './Toast';

interface VoiceGeneratorProps {
  invoice: Invoice;
}

export const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ invoice }) => {
  const { showToast } = useToast();

  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [speed, setSpeed] = useState<number>(1.0);
  
  // Playback state
  const [speechStatus, setSpeechStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize SpeechSynthesis and load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Default voice selection based on language
      if (voices.length > 0 && !selectedVoiceUri) {
        const langCode = language === 'hi' ? 'hi' : 'en';
        const matchingVoice = voices.find(v => v.lang.startsWith(langCode)) || voices[0];
        if (matchingVoice) {
          setSelectedVoiceUri(matchingVoice.voiceURI);
        }
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update voice selection when language changes
  useEffect(() => {
    if (availableVoices.length > 0) {
      const langPrefix = language === 'hi' ? 'hi' : 'en';
      const matchingVoice = availableVoices.find(v => v.lang.startsWith(langPrefix));
      if (matchingVoice) {
        setSelectedVoiceUri(matchingVoice.voiceURI);
      }
    }
  }, [language, availableVoices]);

  // Generate narration text whenever invoice or language changes
  useEffect(() => {
    const text = language === 'hi' 
      ? generateHindiNarration(invoice)
      : generateEnglishNarration(invoice);
    setGeneratedText(text);

    // Stop current speech if invoice changed significantly
    if (speechStatus === 'playing') {
      stopSpeech();
    }
  }, [invoice, language]);

  const handleVoiceSelect = (uri: string) => {
    setSelectedVoiceUri(uri);
    if (speechStatus === 'playing') {
      stopSpeech();
    }
  };

  const startSpeech = () => {
    if (!isSupported) {
      showToast('Speech Synthesis is not supported in this browser.', 'error');
      return;
    }

    if (!generatedText.trim()) {
      showToast('Please add items and details to generate narration.', 'warning');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(generatedText);
    utterance.rate = speed;
    utterance.pitch = 1.0;

    // Pick selected voice
    if (selectedVoiceUri) {
      const voice = availableVoices.find(v => v.voiceURI === selectedVoiceUri);
      if (voice) {
        utterance.voice = voice;
      }
    }

    utterance.onstart = () => {
      setSpeechStatus('playing');
    };

    utterance.onend = () => {
      setSpeechStatus('idle');
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeechStatus('idle');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeechStatus('playing');
  };

  const pauseSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setSpeechStatus('paused');
    }
  };

  const resumeSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setSpeechStatus('playing');
    }
  };

  const stopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeechStatus('idle');
    }
  };

  const copyTranscript = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText).then(() => {
      setCopied(true);
      showToast('Narration transcript copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Filter voices for language dropdown
  const filteredVoices = availableVoices.filter(v => {
    if (language === 'hi') {
      return v.lang.toLowerCase().includes('hi') || v.lang.toLowerCase().includes('in');
    }
    return v.lang.toLowerCase().startsWith('en');
  });

  const displayVoices = filteredVoices.length > 0 ? filteredVoices : availableVoices;

  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-amber-900">Voice Synthesis Not Supported</h4>
          <p className="text-xs text-amber-700 mt-1">
            Your browser does not support the Web Speech API. Consider using Chrome, Edge, or Safari for voice invoice narration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Voice Invoice Generator</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                <Sparkles className="w-3 h-3" /> Web Speech TTS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Listen to an intelligent spoken narration of this invoice
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {speechStatus === 'playing' && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Speaking...
            </div>
          )}
          {speechStatus === 'paused' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Paused
            </div>
          )}
          {speechStatus === 'idle' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Ready
            </div>
          )}
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Playback Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {speechStatus === 'idle' && (
            <button
              type="button"
              onClick={startSpeech}
              disabled={!invoice.business.name && !invoice.client.name}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Generate Voice Narration</span>
            </button>
          )}

          {speechStatus === 'playing' && (
            <>
              <button
                type="button"
                onClick={pauseSpeech}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
              >
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </button>
              <button
                type="button"
                onClick={stopSpeech}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {speechStatus === 'paused' && (
            <>
              <button
                type="button"
                onClick={resumeSpeech}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                onClick={stopSpeech}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop</span>
              </button>
            </>
          )}

          {/* Restart narration if playing or paused */}
          {speechStatus !== 'idle' && (
            <button
              type="button"
              onClick={startSpeech}
              title="Restart Narration"
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Configuration Row: Language, Voice, Speed */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Language Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-blue-600" />
              Narration Language
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  language === 'hi'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hindi (हिंदी)
              </button>
            </div>
          </div>

          {/* Voice Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-blue-600" />
              Browser Voice
            </label>
            <select
              value={selectedVoiceUri}
              onChange={(e) => handleVoiceSelect(e.target.value)}
              className="w-full h-[38px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {displayVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang}) {v.default ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Speed / Rate Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Pace: <span className="text-blue-600 font-bold">{speed}x</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-mono w-10 text-right">{speed}x</span>
            </div>
          </div>
        </div>

        {/* Live Narration Transcript Box */}
        <div className="mt-3 border border-slate-200/90 rounded-xl bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Generated Narration Script
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copyTranscript}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                title="Copy narration text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Toggle transcript display"
              >
                {showFullTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showFullTranscript && (
            <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans select-all bg-white p-3 rounded-lg border border-slate-200/60 shadow-2xs">
              "{generatedText}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
