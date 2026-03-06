import { useState, useEffect, useCallback } from 'react';
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Trash2, 
  Volume2, 
  History, 
  Sparkles,
  ChevronDown,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText } from './services/geminiService';

const LANGUAGES = [
  { code: 'auto', name: 'Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ff', name: 'Peulh (Fula)' },
];

interface HistoryItem {
  id: string;
  source: string;
  target: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

const CATEGORIES = [
  {
    id: 'salutations',
    name: 'Salutations',
    icon: <Languages size={18} />,
    phrases: [
      { fr: 'Bonjour (Matin)', ff: 'Jam waali' },
      { fr: 'Bonjour (Après-midi)', ff: 'Jam ñalli' },
      { fr: 'Bonsoir', ff: 'Jam hiiri' },
      { fr: 'Comment ça va ?', ff: 'No mbaddaa?' },
      { fr: 'Ça va bien', ff: 'Jam tan' },
    ]
  },
  {
    id: 'quotidien',
    name: 'Quotidien',
    icon: <Sparkles size={18} />,
    phrases: [
      { fr: 'J\'ai faim', ff: 'Mi hebi heege' },
      { fr: 'J\'ai soif', ff: 'Mi hebi dondol' },
      { fr: 'Où est le marché ?', ff: 'Hol to luumo ngo woni?' },
      { fr: 'Je vais au travail', ff: 'Mi yahat gollirde' },
      { fr: 'Quelle heure est-il ?', ff: 'Hol waktu woni?' },
    ]
  },
  {
    id: 'dialoguer',
    name: 'Dialoguer',
    icon: <History size={18} />,
    phrases: [
      { fr: 'Comment t\'appelles-tu ?', ff: 'Hol innde maa?' },
      { fr: 'Je m\'appelle...', ff: 'Innde am ko...' },
      { fr: 'D\'où viens-tu ?', ff: 'Hol to ngummidaa?' },
      { fr: 'Je viens de...', ff: 'Mi ummii ko...' },
      { fr: 'Enchanté', ff: 'Mi weltiima e maa' },
    ]
  },
  {
    id: 'defi',
    name: 'Défi',
    icon: <Sparkles size={18} />,
    phrases: [
      { fr: 'Le soleil brille aujourd\'hui', ff: '' },
      { fr: 'La famille est importante', ff: '' },
      { fr: 'Apprendre une langue est un voyage', ff: '' },
      { fr: 'Le respect est la base de tout', ff: '' },
    ]
  }
];

export default function App() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('fr');
  const [targetLang, setTargetLang] = useState('ff');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const handlePhraseClick = (phrase: string) => {
    setSourceText(phrase);
    setSourceLang('fr');
    setTargetLang('ff');
  };

  const handleDefiClick = () => {
    const defiPhrases = CATEGORIES.find(c => c.id === 'defi')?.phrases || [];
    const randomPhrase = defiPhrases[Math.floor(Math.random() * defiPhrases.length)].fr;
    setSourceText(randomPhrase);
    setSourceLang('fr');
    setTargetLang('ff');
  };

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('lingoflow_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('lingoflow_history', JSON.stringify(history));
  }, [history]);

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const sourceLangName = sourceLang === 'auto' ? 'auto' : (LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang);
      const targetLangName = LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;
      
      const result = await translateText(sourceText, targetLangName, sourceLangName);
      setTranslatedText(result.translatedText);
      
      // Add to history
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        source: sourceText,
        target: result.translatedText,
        sourceLang,
        targetLang,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  // Debounced translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.length > 0) {
        handleTranslate();
      } else {
        setTranslatedText('');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang, handleTranslate]);

  const swapLanguages = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'auto' ? 'en' : lang;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-neutral-200 bg-white flex items-center px-6 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Languages size={20} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">yurutraduit</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600"
            title="History"
          >
            <History size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          
          {/* Source Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                <select 
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="appearance-none bg-transparent pr-8 py-1 focus:outline-none cursor-pointer hover:text-neutral-900 transition-colors"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="-ml-6 pointer-events-none" />
              </div>
              <button 
                onClick={clearAll}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                disabled={!sourceText}
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative group">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type to translate..."
                className="w-full h-64 md:h-80 p-6 rounded-2xl border border-neutral-200 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none text-lg transition-all shadow-sm group-hover:shadow-md"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={() => speak(sourceText, sourceLang)}
                  className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  disabled={!sourceText}
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button (Mobile) */}
          <div className="lg:hidden flex justify-center -my-3 z-10">
            <button 
              onClick={swapLanguages}
              className="bg-white border border-neutral-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 text-indigo-600"
            >
              <ArrowRightLeft size={20} className="rotate-90" />
            </button>
          </div>

          {/* Swap Button (Desktop) */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button 
              onClick={swapLanguages}
              className="bg-white border border-neutral-200 p-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all active:scale-95 text-indigo-600"
            >
              <ArrowRightLeft size={20} />
            </button>
          </div>

          {/* Target Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="appearance-none bg-transparent pr-8 py-1 focus:outline-none cursor-pointer hover:text-neutral-900 transition-colors"
                >
                  {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="-ml-6 pointer-events-none" />
              </div>
              {isTranslating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-indigo-600 text-xs font-medium"
                >
                  <Sparkles size={14} className="animate-pulse" />
                  Translating...
                </motion.div>
              )}
            </div>

            <div className="relative group">
              <div className="w-full h-64 md:h-80 p-6 rounded-2xl border border-neutral-200 bg-neutral-50 text-lg overflow-auto shadow-sm group-hover:shadow-md transition-all">
                {translatedText ? (
                  <p className="whitespace-pre-wrap">{translatedText}</p>
                ) : (
                  <p className="text-neutral-400 italic">Translation will appear here</p>
                )}
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={() => speak(translatedText, targetLang)}
                  className="p-2 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  disabled={!translatedText}
                >
                  <Volume2 size={20} />
                </button>
                <button 
                  onClick={copyToClipboard}
                  className={`p-2 rounded-lg transition-all ${copied ? 'text-green-600 bg-green-50' : 'text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  disabled={!translatedText}
                >
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Hub Section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900">Apprendre le Peulh</h2>
          </div>

          <div className="bg-white border border-neutral-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="flex border-b border-neutral-100 bg-neutral-50/50">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-1 py-4 px-2 text-sm font-medium transition-all flex items-center justify-center gap-2 border-b-2 ${
                    activeCategory === cat.id 
                      ? 'border-indigo-600 text-indigo-600 bg-white' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100/50'
                  }`}
                >
                  {cat.icon}
                  <span className="hidden sm:inline">{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeCategory === 'defi' ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={32} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Prêt pour un défi ?</h3>
                    <p className="text-neutral-500 mb-6 max-w-md">
                      Cliquez sur le bouton ci-dessous pour obtenir une phrase aléatoire à traduire en Peulh.
                    </p>
                    <button 
                      onClick={handleDefiClick}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                    >
                      Lancer un défi
                    </button>
                  </div>
                ) : (
                  CATEGORIES.find(c => c.id === activeCategory)?.phrases.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePhraseClick(phrase.fr)}
                      className="flex flex-col items-start p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-indigo-200 hover:bg-white transition-all text-left group"
                    >
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 group-hover:text-indigo-600">Français</span>
                      <span className="text-neutral-900 font-medium mb-2">{phrase.fr}</span>
                      {phrase.ff && (
                        <>
                          <div className="w-full h-px bg-neutral-200 my-2" />
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Peulh</span>
                          <span className="text-emerald-600 font-medium">{phrase.ff}</span>
                        </>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold mb-2">AI Powered</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Utilizing Gemini 3 Flash for highly accurate and context-aware translations across 100+ languages.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Volume2 size={20} />
            </div>
            <h3 className="font-semibold mb-2">Text-to-Speech</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Listen to translations in native accents to improve your pronunciation and understanding.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <History size={20} />
            </div>
            <h3 className="font-semibold mb-2">Smart History</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Your recent translations are saved locally so you can quickly access them anytime.
            </p>
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-30 flex flex-col"
            >
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Translation History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4">
                    <History size={48} strokeWidth={1} />
                    <p>No history yet</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-xl border border-neutral-100 bg-neutral-50 hover:border-indigo-200 transition-all cursor-pointer group"
                      onClick={() => {
                        setSourceText(item.source);
                        setTranslatedText(item.target);
                        setSourceLang(item.sourceLang);
                        setTargetLang(item.targetLang);
                        setShowHistory(false);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {LANGUAGES.find(l => l.code === item.sourceLang)?.name} → {LANGUAGES.find(l => l.code === item.targetLang)?.name}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setHistory(prev => prev.filter(h => h.id !== item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-neutral-900 line-clamp-1 mb-1">{item.source}</p>
                      <p className="text-sm text-neutral-500 line-clamp-1">{item.target}</p>
                    </div>
                  ))
                )}
              </div>
              {history.length > 0 && (
                <div className="p-4 border-t border-neutral-200">
                  <button 
                    onClick={() => setHistory([])}
                    className="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Clear History
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-8 border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} yurutraduit. Powered by Gemini AI.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-neutral-500 hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-neutral-500 hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="text-sm text-neutral-500 hover:text-indigo-600 transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
