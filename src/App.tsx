import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Mic, 
  History, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight,
  AlertTriangle,
  Loader2,
  Trash2,
  Target,
  Smartphone,
  SlidersHorizontal,
  Activity,
  Brain,
  Apple,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CameraView } from './components/CameraView';
import { SettingsModal } from './components/SettingsModal';
import { performProductAnalysis, AnalysisResult } from './services/analysisService';
import { historyService, HistoryItem } from './services/historyService';
import { settingsService, UserSettings } from './services/settingsService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App: React.FC = () => {
  // --- State ---
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  const [image, setImage] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<UserSettings>(() => settingsService.getSettings());

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const phoneCameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // --- Effects ---
  useEffect(() => {
    if (!apiKey) {
      console.error("BŁĄD KRYTYCZNY: Brak klucza API");
    }
    // Load history
    setHistory(historyService.getHistory());

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pl-PL';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextDescription(transcript);
        handleAnalyze(undefined, transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setError(`Błąd rozpoznawania mowy: ${event.error}`);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // --- Handlers ---
  const handleAnalyze = async (imageData?: string, description?: string) => {
    const dataToAnalyze = imageData || image;
    const textToAnalyze = description || textDescription;

    if (!dataToAnalyze && !textToAnalyze) return;
    if (!apiKey) {
      setError("Błąd: Brak klucza API w ustawieniach serwera");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const currentSettings = settingsService.getSettings();
      const analysisResult = await performProductAnalysis(
        apiKey, 
        dataToAnalyze || undefined, 
        textToAnalyze || undefined,
        currentSettings
      );
      setResult(analysisResult);
      
      // Save to history
      const updatedHistory = historyService.saveItem(analysisResult, dataToAnalyze, textToAnalyze);
      setHistory(updatedHistory);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Wystąpił nieoczekiwany błąd podczas analizy.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setError(null);
      } catch (err) {
        console.error("Error starting recognition:", err);
      }
    } else {
      setError("Rozpoznawanie mowy nie jest wspierane w Twojej przeglądarce.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
        handleAnalyze(base64String);
      };
      reader.readAsDataURL(file);
    }
    // reset input value so re-selecting same file triggers change
    event.target.value = '';
  };

  const resetScanner = () => {
    setImage(null);
    setTextDescription(null);
    setResult(null);
    setError(null);
    setShowHistory(false);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyService.deleteItem(id);
    setHistory(updated);
  };

  // --- Render Helpers ---
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'KUPUJ': return 'text-emerald-500';
      case 'UNIKAJ': return 'text-red-500';
      case 'Z ROZWAGĄ': return 'text-amber-500';
      default: return 'text-zinc-400';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'bg-red-500/20 text-red-400 border-red-500/20';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/20';
      case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
      case 'BENEFICIAL': return 'bg-emerald-500/30 text-emerald-300 border-emerald-500/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  // --- Main Render ---
  if (!apiKey) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 selection:bg-emerald-500/30">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] p-8 space-y-8 shadow-2xl"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-red-500">BŁĄD KRYTYCZNY</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Brak klucza API. Skonfiguruj <code>VITE_GEMINI_API_KEY</code> w Vercel lub <code>GEMINI_API_KEY</code> w AI Studio.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex flex-col selection:bg-emerald-500/30">
      {/* Hidden file inputs: one for direct mobile camera, one for gallery */}
      <input 
        ref={phoneCameraInputRef}
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden" 
        onChange={handleFileUpload}
      />
      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleFileUpload}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none text-white">Zdrowe Zakupy</h1>
              <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">Medycyna Integracyjna & Naturoterapia</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-3 rounded-full transition-all active:scale-90 cursor-pointer",
                showHistory ? "bg-emerald-500/20 text-emerald-500" : "text-zinc-400 hover:bg-white/5"
              )}
              title="Historia skanów"
            >
              <History className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full px-6 py-8 flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <History className="w-6 h-6 text-emerald-500" />
                  Historia
                </h2>
                <button 
                  onClick={() => {
                    if (confirm("Czy na pewno chcesz wyczyścić całą historię?")) {
                      historyService.clearHistory();
                      setHistory([]);
                    }
                  }}
                  className="text-xs font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest cursor-pointer"
                >
                  Wyczyść wszystko
                </button>
              </div>

              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-20 space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <History className="w-8 h-8 text-zinc-700" />
                    </div>
                    <p className="text-zinc-500 font-medium">Brak historii skanowania.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      onClick={() => {
                        setImage(item.image);
                        setTextDescription(item.description);
                        setResult(item.result);
                        setShowHistory(false);
                      }}
                      className="group bg-zinc-900/50 border border-white/5 rounded-3xl p-5 flex items-center gap-5 cursor-pointer hover:bg-zinc-800/50 hover:border-emerald-500/20 transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/5">
                        {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" alt="Skan" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Mic className="w-6 h-6 text-emerald-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5",
                            getVerdictColor(item.result.products?.[0]?.verdict)
                          )}>
                            {item.result.products?.[0]?.verdict}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold truncate text-zinc-200">
                          {item.result.products?.[0]?.productName || "Analiza produktu"}
                        </h3>
                      </div>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : !image && !textDescription && !isAnalyzing ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 flex-grow flex flex-col justify-center py-6"
            >
              {/* Camera & Input Actions Grid */}
              <div className="grid gap-4">
                {/* Primary Dual Camera Trigger: Live Viewfinder or Direct Phone Camera */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Live Viewfinder */}
                  <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="group relative bg-zinc-900 border border-white/10 rounded-[2rem] p-8 flex flex-col items-center text-center gap-3.5 hover:border-emerald-500/50 transition-all active:scale-[0.98] cursor-pointer overflow-hidden shadow-lg"
                  >
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-base font-bold tracking-tight block text-white">Skaner na żywo</span>
                      <span className="text-xs text-zinc-500">Podgląd z ramką celowania</span>
                    </div>
                  </button>

                  {/* Direct Mobile Phone Native Camera (100% reliable on all phones) */}
                  <button 
                    onClick={() => phoneCameraInputRef.current?.click()}
                    className="group relative bg-zinc-900 border border-emerald-500/20 rounded-[2rem] p-8 flex flex-col items-center text-center gap-3.5 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all active:scale-[0.98] cursor-pointer overflow-hidden shadow-lg"
                  >
                    <div className="w-16 h-16 bg-emerald-500/15 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform text-emerald-400">
                      <Smartphone className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-base font-bold tracking-tight block text-white">Aparat w telefonie</span>
                      <span className="text-xs text-emerald-400/80 font-medium">Natywne zdjęcie etykiety</span>
                    </div>
                  </button>
                </div>

                {/* Secondary Actions: Voice & Gallery */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => isRecording ? stopRecording() : startRecording()}
                    className={cn(
                      "rounded-[1.75rem] border p-6 flex flex-col items-center gap-3 transition-all active:scale-[0.97] cursor-pointer",
                      isRecording 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-zinc-900 border-white/10 hover:border-emerald-500/30'
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      isRecording ? "bg-emerald-500 text-black" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      <Mic className={cn("w-6 h-6", isRecording && "animate-pulse")} />
                    </div>
                    <span className="text-xs font-bold text-zinc-200">{isRecording ? 'Zakończ nagrywanie' : 'Opisz głosowo'}</span>
                  </button>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-zinc-900 border border-white/10 rounded-[1.75rem] p-6 flex flex-col items-center gap-3 hover:border-emerald-500/30 transition-all active:scale-[0.97] cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-300">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-zinc-200">Z galerii zdjęć</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Preview Area */}
              <div className="relative aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 bg-zinc-900 shadow-2xl">
                {image ? (
                  <img src={image} className="w-full h-full object-cover" alt="Analizowany produkt" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center gap-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center">
                      <Mic className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-xl italic font-medium text-zinc-300 leading-relaxed">
                      "{textDescription}"
                    </p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-6">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <div className="text-center space-y-1">
                      <p className="text-xl font-bold tracking-tight text-white">Analizowanie produktu...</p>
                      <p className="text-xs text-emerald-400 font-semibold tracking-wider">
                        Profil: {settings.dietType} • {settings.healthGoals.length} celów • {settings.healthConditions.length + settings.neurodivergence.length} cech
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error State */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-4"
                >
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">Błąd analizy</p>
                    <p className="opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Results Area */}
              {result && (
                <div className="space-y-8 pb-20">
                  {/* Comparison Header */}
                  {result.isComparison && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8 space-y-6"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        <h3 className="text-xl font-bold text-emerald-400">Werdykt Porównawczy</h3>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {result.comparisonSummary}
                      </p>
                      <div className="bg-emerald-500 text-black p-5 rounded-2xl">
                        <p className="text-xs font-black uppercase tracking-wider mb-1">Rekomendacja</p>
                        <p className="font-bold">{result.recommendation}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Individual Products */}
                  <div className="space-y-6">
                    {result.products.map((product, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                      >
                        {/* Product Header */}
                        <div className="p-8 border-b border-white/5 space-y-6">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className={cn(
                                "text-xs font-black px-3 py-1 rounded-full bg-white/5 mb-3 inline-block tracking-wider",
                                getVerdictColor(product.verdict)
                              )}>
                                {product.verdict}
                              </span>
                              <h3 className="text-2xl font-bold tracking-tight text-white">{product.productName}</h3>
                            </div>
                            <div className="text-right">
                              <div className="text-4xl font-black text-emerald-500 tracking-tighter">
                                {product.healthScore}
                              </div>
                              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Health Score</span>
                            </div>
                          </div>

                          <p className="text-sm italic text-zinc-300 leading-relaxed">
                            "{product.summary}"
                          </p>
                        </div>

                        {/* Card Body */}
                        <div className="p-8 space-y-8">
                          {/* Personalized Health Insights */}
                          {(product.personalizedInsights?.goalMatch || 
                            (product.personalizedInsights?.conditionWarnings && product.personalizedInsights.conditionWarnings.length > 0) ||
                            (product.personalizedInsights?.allergyAlerts && product.personalizedInsights.allergyAlerts.length > 0)) && (
                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
                              <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                                  Dopasowanie do Twojego Profilu Zdrowotnego
                                </h4>
                              </div>
                              {product.personalizedInsights.goalMatch && (
                                <p className="text-xs text-zinc-200 leading-relaxed">
                                  {product.personalizedInsights.goalMatch}
                                </p>
                              )}

                              {/* Condition Warnings (e.g. skin, ADHD triggers) */}
                              {product.personalizedInsights.conditionWarnings && product.personalizedInsights.conditionWarnings.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5" />
                                    Wpływ na choroby skóry / układ nerwowy:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {product.personalizedInsights.conditionWarnings.map((warning, idx) => (
                                      <span key={idx} className="text-[11px] px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-medium">
                                        {warning}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Allergy alerts */}
                              {product.personalizedInsights.allergyAlerts && product.personalizedInsights.allergyAlerts.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Wykryte alergeny / składniki niepożądane:
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {product.personalizedInsights.allergyAlerts.map((alert, idx) => (
                                      <span key={idx} className="text-[11px] px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-bold">
                                        {alert}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pros/Cons */}
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Zalety</h4>
                              <ul className="space-y-2">
                                {product.pros.map((pro, i) => (
                                  <li key={i} className="text-xs text-zinc-300 flex gap-2">
                                    <span className="text-emerald-500 font-bold">•</span>
                                    {pro}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Wady</h4>
                              <ul className="space-y-2">
                                {product.cons.map((con, i) => (
                                  <li key={i} className="text-xs text-zinc-300 flex gap-2">
                                    <span className="text-red-500 font-bold">•</span>
                                    {con}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Detailed Risks */}
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Analiza Składników</h4>
                            <div className="grid gap-3">
                              {product.detailedRisks.map((risk, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-zinc-200">{risk.ingredient}</span>
                                    <span className={cn(
                                      "text-[9px] font-black px-2 py-0.5 rounded-full border",
                                      getRiskColor(risk.riskLevel)
                                    )}>
                                      {risk.riskLevel}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                                    {risk.reason}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Protocol Fit */}
                          <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Wpływ na Protokół</h4>
                            <p className="text-xs italic text-zinc-300 leading-relaxed">
                              "{product.protocolFit}"
                            </p>
                          </div>

                          {/* Naturopathic Clinical Advice */}
                          {product.naturopathicAdvice && (
                            <div className="p-6 bg-emerald-950/30 border border-emerald-500/20 rounded-2xl space-y-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                  Wskazówka Naturoterapeuty Klinicznego
                                </h4>
                              </div>
                              <p className="text-xs italic text-zinc-200 leading-relaxed">
                                "{product.naturopathicAdvice}"
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button 
                      onClick={resetScanner}
                      className="flex-grow py-5 bg-zinc-900 border border-white/10 rounded-2xl text-zinc-400 font-bold hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Nowy skan
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="py-5 px-6 bg-white/5 border border-white/10 rounded-2xl text-zinc-300 font-bold hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                      <span>Zmień profil</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            currentSettings={settings}
            onSave={(newSettings) => {
              settingsService.saveSettings(newSettings);
              setSettings(newSettings);
            }}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <CameraView 
            onCapture={(data) => {
              setImage(data);
              setIsCameraOpen(false);
              handleAnalyze(data);
            }}
            onClose={() => setIsCameraOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Footer Status & Persistent Profile Access */}
      <footer className="p-6 text-center border-t border-white/5 bg-[#0A0A0B]/60 space-y-3 mt-auto">
        <div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs text-zinc-300 hover:text-white transition-all inline-flex items-center gap-2 font-medium cursor-pointer py-2 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Profil i cele zdrowotne (dieta, ADHD, choroby skóry)</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
          Zdrowe Zakupy • Medycyna Integracyjna & Naturoterapia Kliniczna
        </p>
      </footer>
    </div>
  );
};

export default App;
