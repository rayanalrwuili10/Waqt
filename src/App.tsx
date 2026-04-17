import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Heart, Wallet, BookOpen, CheckSquare, 
  Settings, AlertCircle, Clock, Moon, Utensils, Home as HomeIcon, 
  Plane, BarChart3, TrendingUp, Sparkles, MapPin, Plus, Save,
  LogOut, LogIn, UserPlus, Sun, Languages, Trophy, Trash, Check, ArrowRight,
  Menu, ChevronRight, ChevronLeft, Zap, Coffee, Target, Shield, User,
  Globe, Fingerprint, Lock, Share2, Activity, ShoppingBag, Brain, Phone, Search, Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Section } from './types';
import { getAIInsight } from './lib/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db } from './lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INITIAL_STATE: AppState = {
  health: { steps: 0, weight: 70, exercises: [], dailyWater: 0 },
  food: [],
  money: { income: 0, transactions: [], budget: 0, savingsGoal: 0, alerts: [] },
  sleep: [],
  habits: [],
  faith: { lastQuranPage: 1, khatmaCount: 0, prayers: {}, sadakah: 0, ramadanMode: false, azkarCount: 0 },
  goals: [],
  travel: [],
  home: { bills: [], shoppingList: [], maintenance: [] },
  medical: { bloodType: '-', allergies: [], medications: [], contacts: [] },
  productivity: { focusTimeToday: 0, appUsage: {}, mood: 3, personalityTraits: [] },
  dailyQuestion: '',
  badges: [],
  lifeMode: 'standard',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [points, setPoints] = useState(0);
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [aiInsight, setAiInsight] = useState<string>("جاري تحليل بياناتك...");
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('waqt_user');
    
    if (savedUser) {
      const username = savedUser;
      const userRef = doc(db, 'users', username);
      
      const unsubscribe = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrentUser(data);
          setPoints(data.points || 0);
          setTheme(data.theme || 'dark');
          if (data.state) {
            setState(data.state);
          }
        } else {
          localStorage.removeItem('waqt_user');
          setCurrentUser(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("Firestore Listen Error:", err);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && JSON.stringify(state) !== JSON.stringify(INITIAL_STATE)) {
      const userRef = doc(db, 'users', currentUser.username);
      updateDoc(userRef, { state });
    }
  }, [state, currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    if (currentUser) {
      updateDoc(doc(db, 'users', currentUser.username), { theme });
    }
  }, [theme, currentUser]);

  const addPoints = async (amount: number) => {
    if (currentUser) {
      const newPoints = points + amount;
      await updateDoc(doc(db, 'users', currentUser.username), { points: newPoints });
    }
  };

  useEffect(() => {
    async function fetchInsight() {
      if (!currentUser) return;
      setLoadingAI(true);
      const insight = await getAIInsight(state);
      setAiInsight(insight);
      setLoadingAI(false);
    }
    if (activeSection === 'dashboard') fetchInsight();
  }, [activeSection, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('waqt_user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-faith"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onLogin={(user: any) => {
      localStorage.setItem('waqt_user', user.username);
      setCurrentUser(user);
    }} />;
  }

  const calculateLifeScore = () => {
    if (!state) return 0;
    const healthProgress = Math.min(100, (state.health.steps / 10000) * 100);
    const habitsProgress = state.habits.length > 0 ? (state.habits.filter((h: any) => (h.completedDates || []).includes(new Date().toISOString().split('T')[0])).length / state.habits.length) * 100 : 0;
    const faithProgress = Object.keys(state.faith.prayers).length > 0 ? 50 : 20;
    return Math.round((healthProgress + habitsProgress + faithProgress) / 3);
  };
  const lifeScore = calculateLifeScore();

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard state={state} aiInsight={aiInsight} lifeScore={lifeScore} setActiveSection={setActiveSection} setState={setState} />;
      case 'health': return <HealthSection state={state} setState={setState} addPoints={addPoints} />;
      case 'food': return <FoodSection state={state} setState={setState} addPoints={addPoints} />;
      case 'money': return <MoneySection state={state} setState={setState} addPoints={addPoints} />;
      case 'faith': return <FaithSection state={state} setState={setState} points={points} addPoints={addPoints} />;
      case 'habits': return <HabitsSection state={state} setState={setState} addPoints={addPoints} />;
      case 'goals': return <GoalsSection state={state} setState={setState} addPoints={addPoints} />;
      case 'travel': return <TravelSection state={state} setState={setState} addPoints={addPoints} />;
      case 'emergency': return <EmergencySection setActiveSection={setActiveSection} state={state} setState={setState} />;
      case 'medical': return <MedicalSection state={state} setState={setState} />;
      case 'home': return <HomeSection state={state} setState={setState} addPoints={addPoints} />;
      case 'features': return <FeaturesSection setActiveSection={setActiveSection} />;
      case 'focus': return <FocusSection state={state} setState={setState} addPoints={addPoints} />;
      case 'store': return <StoreSection points={points} addPoints={addPoints} />;
      case 'personality': return <PersonalitySection aiInsight={aiInsight} state={state} />;
      case 'sleep': return <SleepSection state={state} setState={setState} addPoints={addPoints} />;
      case 'analytics': return <QuranSection />;
      case 'productivity': return <ComingSoon section="الإنتاجية المتقدم" />;
      default: return <Dashboard state={state} aiInsight={aiInsight} lifeScore={lifeScore} setActiveSection={setActiveSection} setState={setState} />;
    }
  };

  return (
    <div className={cn("flex flex-col h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl transition-colors duration-300", 
      theme === 'dark' ? "bg-bg text-slate-50" : "bg-white text-slate-900"
    )} dir="rtl">
      <header className={cn("px-6 py-5 flex justify-between items-center border-b shrink-0", 
        theme === 'dark' ? "geometric-gradient border-white/10" : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black tracking-widest uppercase">
            وَقْت <span className="text-faith">WAQT</span>
          </div>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-white/5 rounded-lg">
            {theme === 'dark' ? <Sun size={18} className="text-faith" /> : <Moon size={18} className="text-prod" />}
          </button>
        </div>
        <div className="text-left flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-xs opacity-70">الاثنين، {new Date().toLocaleDateString('ar-SA')}</div>
            <div className="text-sm font-bold">{currentUser.displayName}</div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-danger/10 text-danger rounded-lg">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 space-y-4 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className={cn("absolute bottom-0 left-0 right-0 border-t px-4 py-3 flex justify-around items-center shrink-0 z-50", 
        theme === 'dark' ? "bg-bg border-white/10" : "bg-white border-slate-200"
      )}>
        <NavItem active={activeSection === 'dashboard'} icon={LayoutDashboard} label="الرئيسية" onClick={() => setActiveSection('dashboard')} />
        <NavItem active={activeSection === 'health'} icon={Heart} label="الصحة" onClick={() => setActiveSection('health')} />
        <NavItem active={activeSection === 'analytics'} icon={BookOpen} label="القرآن" onClick={() => setActiveSection('analytics')} />
        <NavItem active={activeSection === 'faith'} icon={Sparkles} label="الدين" onClick={() => setActiveSection('faith')} />
        <NavItem active={activeSection === 'habits'} icon={CheckSquare} label="العادات" onClick={() => setActiveSection('habits')} />
      </nav>

      <div className="fixed bottom-24 left-6 z-50">
        <button 
          className="w-14 h-14 bg-danger text-white rounded-full flex items-center justify-center animate-pulse shadow-xl shadow-danger/30"
          onClick={() => setActiveSection('emergency')}
        >
          <AlertCircle size={28} />
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل');
      return;
    }

    setLoading(true);
    setError('');
    
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const userRef = doc(db, 'users', cleanUsername);

    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.password === password) {
          onLogin(userData);
        } else {
          setError('هذا المستخدم موجود مسبقاً. أدخل كلمة المرور الصحيحة أو اختر اسماً آخر.');
        }
      } else {
        const newUser = {
          username: cleanUsername,
          displayName: username.trim(),
          password: password,
          points: 100,
          theme: 'dark',
          state: INITIAL_STATE,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newUser);
        onLogin(newUser);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      setError('حدث خطأ أثناء محاولة الدخول. تأكد من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg p-6" dir="rtl">
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-faith/10 rounded-3xl mx-auto flex items-center justify-center border border-faith/20"
          >
            <Sparkles size={48} className="text-faith" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter text-white">وَقْت <span className="text-faith">WAQT</span></h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[250px] mx-auto font-sans">
            أهلاً بك. أنشئ حسابك الفريد بكلمة مرور خاصة أو سجل دخولك.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4 text-right">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 mr-1 uppercase tracking-widest">اسم المستخدم</label>
              <input 
                type="text" 
                placeholder="أحمد، ريان، خالد..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-faith transition-all"
                value={username} onChange={e => setUsername(e.target.value)} required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 mr-1 uppercase tracking-widest">كلمة المرور</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base outline-none focus:border-faith transition-all text-left font-mono"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
            </div>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-danger/10 border border-danger/20 p-3 rounded-xl text-danger text-xs text-center font-bold"
            >
              {error}
            </motion.div>
          )}

          <button 
            disabled={loading}
            className="w-full bg-faith text-bg font-black py-5 rounded-2xl shadow-xl shadow-faith/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg uppercase tracking-widest"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-bg"></div>
            ) : (
              <>
                دخول / تسجيل <ArrowRight size={20} className="rotate-180" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 text-center">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">بأمان تام • جميع بياناتك محفوظة</p>
        </div>
      </div>
    </div>
  );
}

function QuranSection() {
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurah, setSelectedSurah] = useState<any | null>(null);

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(data => {
        setSurahs(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse">جاري تحميل المصحف...</div>;
  if (selectedSurah) return <SurahView surahId={selectedSurah.number} onBack={() => setSelectedSurah(null)} title={selectedSurah.name} />;

  return (
    <div className="space-y-4 pb-10">
      <SectionHeader title="المصحف الإلكتروني" icon={BookOpen} />
      <div className="grid grid-cols-1 gap-3">
        {surahs.map(surah => (
          <button 
            key={surah.number} 
            onClick={() => setSelectedSurah(surah)}
            className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center active:bg-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-faith/10 text-faith flex items-center justify-center font-bold">
                {surah.number}
              </div>
              <div className="text-right">
                <div className="text-sm font-bold">{surah.name}</div>
                <div className="text-[10px] opacity-40">{surah.englishName} • {surah.numberOfAyahs} آية</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SurahView({ surahId, onBack, title }: any) {
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.alquran.cloud/v1/surah/${surahId}`)
      .then(res => res.json())
      .then(data => {
        setAyahs(data.data.ayahs);
        setLoading(false);
      });
  }, [surahId]);

  return (
    <div className="space-y-4 pb-10">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-lg"><ChevronRight /></button>
        <h2 className="text-xl font-black text-faith">{title}</h2>
      </div>

      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-8 leading-loose text-center">
        {loading ? <div className="animate-pulse">جاري التحميل...</div> : ayahs.map(ayah => (
          <div key={ayah.number} className="text-xl font-medium leading-[2.5]">
            {ayah.text} <span className="text-faith text-sm font-bold">({ayah.numberInSurah})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ color, title, value, sub, icon: Icon }: any) {
  const accentColor = `var(--color-${color})`;
  return (
    <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 flex flex-col justify-between h-40 transition-all hover:bg-white/10 active:scale-95 cursor-pointer">
      <div className="flex justify-between items-start">
        <div className={cn("p-2 rounded-xl", `bg-${color}/10 text-${color}`)}>
           <Icon size={18} />
        </div>
      </div>
      <div className="text-right">
        <div className="text-2xl font-black leading-none mb-1">{value}</div>
        <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest">{title}</div>
      </div>
    </div>
  );
}

function Dashboard({ state, aiInsight, lifeScore, setActiveSection, setState }: any) {
  const modes = [
    { id: 'standard', label: 'الوضع العادي', icon: HomeIcon },
    { id: 'student', label: 'وضع الطالب', icon: BookOpen },
    { id: 'employee', label: 'وضع الموظف', icon: User },
    { id: 'athlete', label: 'وضع الرياضي', icon: Zap },
    { id: 'traveler', label: 'وضع السفر', icon: Plane },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 pb-24" dir="rtl">
      <section className="col-span-2 bg-gradient-to-br from-faith/20 to-money/20 p-8 rounded-[45px] border border-white/10 flex flex-col justify-between h-52 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-faith/20 blur-[80px] -mr-16 -mt-16 group-hover:bg-faith/40 transition-colors" />
        <div className="flex justify-between items-start z-10">
          <div className="text-right">
            <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">مؤشر الحياة اليومي</div>
            <div className="text-5xl font-black mt-2 text-white">{lifeScore}%</div>
          </div>
          <div className="p-4 bg-white/10 rounded-3xl backdrop-blur-md">
            <Brain size={32} className="text-faith" />
          </div>
        </div>
        <div className="w-full bg-white/5 h-2.5 rounded-full mt-auto relative z-10">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${lifeScore}%` }}
            className="bg-faith h-full shadow-[0_0_25px_rgba(139,92,246,0.9)] rounded-full"
          />
        </div>
      </section>

      <div className="col-span-2 flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {modes.map((mode) => (
          <button 
            key={mode.id}
            onClick={() => setState((prev: any) => ({ ...prev, lifeMode: mode.id }))}
            className={cn(
              "flex-none px-6 py-4 rounded-3xl border text-xs font-black transition-all flex items-center gap-3 whitespace-nowrap",
              state.lifeMode === mode.id ? "bg-white text-bg border-white shadow-xl" : "bg-white/5 border-white/10 opacity-40 hover:opacity-100"
            )}
          >
            <mode.icon size={18} />
            {mode.label}
          </button>
        ))}
      </div>

      <section className="col-span-2 bg-white/5 border border-white/5 p-6 rounded-[40px] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-faith to-transparent opacity-10" />
        <div className="flex justify-between items-center w-full mb-4">
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest text-right">نظرة وقت اليومية</div>
          <div className="p-2 bg-faith/10 rounded-xl">
            <Sparkles size={16} className="text-faith" />
          </div>
        </div>
        <div className="text-right space-y-3">
          <p className="text-sm font-bold opacity-80 leading-relaxed italic text-white/90">"{aiInsight}"</p>
          <div className="flex justify-start gap-4 mt-2">
            <div className="text-[9px] font-black opacity-40 py-1 px-3 bg-white/10 rounded-full">هدف اليوم: ٥٠ صفحة قرآن</div>
            <div className="text-[9px] font-black opacity-40 py-1 px-3 bg-white/10 rounded-full">عادة: شرب ٣ لتر ماء</div>
          </div>
        </div>
      </section>

      <div className="col-span-1" onClick={() => setActiveSection('health')}>
        <StatCard color="health" title="النشاط" value={state.health.steps.toLocaleString()} sub="خطوة" icon={Activity} />
      </div>
      <div className="col-span-1" onClick={() => setActiveSection('money')}>
        <StatCard color="money" title="المالية" value={`${state.money.budget - state.money.transactions.reduce((a:any, b:any)=>a+b.amount,0)}`} sub="ر.س" icon={Wallet} />
      </div>
      <div className="col-span-1" onClick={() => setActiveSection('focus')}>
        <StatCard color="prod" title="التركيز" value={`${state.productivity.focusTimeToday}د`} sub="وقت عميق" icon={Clock} />
      </div>
      <div className="col-span-1" onClick={() => setActiveSection('faith')}>
        <StatCard color="faith" title="الإيمان" value={`ص ${state.faith.lastQuranPage}`} sub="آخر قراءة" icon={Zap} />
      </div>

      <section className="col-span-2 bg-slate-900/80 border border-white/10 rounded-[45px] p-8 space-y-6 relative group overflow-hidden"
               onClick={() => setActiveSection('analytics')}>
        <div className="absolute inset-0 bg-gradient-to-br from-faith/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-center relative z-10">
          <div className="text-[10px] font-black text-faith uppercase tracking-[0.2em] bg-faith/10 px-4 py-1.5 rounded-full">محرك التنبؤ العميق</div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
            <Zap size={20} className="text-faith opacity-50" />
          </motion.div>
        </div>
        <div className="text-right relative z-10">
          <h4 className="text-lg font-black mb-2">توقعات حياتك القريبة</h4>
          <p className="text-xs opacity-50 leading-relaxed max-w-xs ml-auto">
            نتوقع إرهاقاً بحلول يوم الثلاثاء بناءً على النمط الحالي. ننصح بزيادة وقت النوم.
          </p>
        </div>
      </section>

      <button 
        onClick={() => setActiveSection('features')}
        className="col-span-2 py-7 bg-white/5 border border-white/10 rounded-[45px] flex items-center justify-center gap-6 group hover:bg-white transition-all active:scale-95"
      >
        <Menu size={24} className="group-hover:text-bg transition-colors" />
        <span className="text-sm font-black uppercase tracking-[0.3em] group-hover:text-bg transition-colors">جميع مميزات وقت</span>
      </button>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-3 px-1 mb-6">
      <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
        <Icon size={20} className="text-white" />
      </div>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}

function HealthSection({ state, setState, addPoints }: any) {
  const [stepsInput, setStepsInput] = useState('');
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="الصحة والنشاط" icon={Heart} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 flex flex-col items-center">
        <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-4">الخطوات اليومية</div>
        <div className="text-6xl font-black text-white">{state.health.steps.toLocaleString()}</div>
        <div className="w-full h-2.5 bg-white/5 rounded-full mt-10 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (state.health.steps / 10000) * 100)}%` }}
            className="h-full bg-health shadow-[0_0_20px_rgba(34,197,94,0.3)]"
          />
        </div>
        <div className="text-[10px] opacity-40 mt-4 font-bold">الهدف: 10,000 خطوة</div>
      </div>
      <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 flex gap-2">
        <input 
          type="number" placeholder="أدخل عدد الخطوات..." 
          className="flex-1 bg-transparent border-none outline-none text-right px-4 font-black"
          value={stepsInput} onChange={e => setStepsInput(e.target.value)}
        />
        <button 
          onClick={() => { setState((p:any)=>({...p, health:{...p.health, steps: parseInt(stepsInput)}})); addPoints(5); setStepsInput(''); }}
          className="bg-health text-bg px-6 py-3 rounded-2xl font-black text-xs uppercase"
        >
          تحديث
        </button>
      </div>
    </div>
  );
}

function FoodSection({ state, setState, addPoints }: any) {
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const total = state.food.reduce((s:any, f:any)=>s+f.calories, 0);

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="التغذية والسعرات" icon={Utensils} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 space-y-6">
        <div className="text-center">
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-2">إجمالي السعرات اليوم</div>
          <div className="text-5xl font-black">{total}</div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2">
            <Scan size={20} className="text-health" />
            <span className="text-[10px] font-black">ماسح الباركود</span>
          </button>
          <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-2">
            <Search size={20} className="text-health" />
            <span className="text-[10px] font-black">البحث عن وجبة</span>
          </button>
        </div>
      </div>
      <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 space-y-4">
        <input 
          type="text" placeholder="اسم الوجبة..." 
          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-right font-bold"
          value={foodName} onChange={e => setFoodName(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            type="number" placeholder="السعرات" 
            className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-right font-bold"
            value={calories} onChange={e => setCalories(e.target.value)}
          />
          <button 
            onClick={() => { setState((p:any)=>({...p, food: [...p.food, {id: Date.now(), name: foodName, calories: parseInt(calories)} ]})); addPoints(5); setFoodName(''); setCalories(''); }}
            className="bg-health text-bg px-8 rounded-2xl font-black text-xs"
          >
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

function MoneySection({ state, setState, addPoints }: any) {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const balance = state.money.budget - state.money.transactions.reduce((s:any, t:any)=>s+t.amount, 0);

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="المالية والمصروفات" icon={Wallet} />
      <div className="bg-money/20 p-8 rounded-[45px] border border-money/20 text-center space-y-2">
        <div className="text-[10px] font-black opacity-30 uppercase tracking-widest text-money">الميزانية المتبقية</div>
        <div className="text-5xl font-black">{balance} ر.س</div>
      </div>
      <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 space-y-4">
        <input 
          type="text" placeholder="ماذا صرفت؟" 
          className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-right font-bold"
          value={desc} onChange={e => setDesc(e.target.value)}
        />
        <div className="flex gap-2">
          <input 
            type="number" placeholder="المبلغ" 
            className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-right font-bold"
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          <button 
            onClick={() => { setState((p:any)=>({...p, money:{...p.money, transactions: [{id: Date.now(), title: desc, amount: parseInt(amount)}, ...p.money.transactions] }})); addPoints(10); setDesc(''); setAmount(''); }}
            className="bg-money text-bg px-8 rounded-2xl font-black text-xs"
          >
            حفظ
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3">
          <Globe size={16} className="text-money" />
          <span className="text-[10px] font-black">محول العملات</span>
        </button>
        <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3">
          <Target size={16} className="text-money" />
          <span className="text-[10px] font-black">أهداف الادخار</span>
        </button>
      </div>
    </div>
  );
}

function FaithSection({ state, setState, addPoints }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="الورد الإيماني" icon={Sparkles} />
      <div className="bg-faith p-8 rounded-[45px] text-bg flex justify-between items-center overflow-hidden relative">
        <div className="relative z-10 text-right">
          <div className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">الوضع الروحي</div>
          <div className="text-3xl font-black">{state.faith.ramadanMode ? 'وضع رمضان' : 'الورد اليومي'}</div>
        </div>
        <button 
          onClick={() => setState((p:any)=>({...p, faith: {...p.faith, ramadanMode: !p.faith.ramadanMode}}))}
          className={cn("px-6 py-3 rounded-2xl font-black text-xs relative z-10", state.faith.ramadanMode ? "bg-bg text-white" : "bg-white/20")}
        >
          {state.faith.ramadanMode ? 'تعطيل' : 'تفعيل'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button className="p-6 bg-white/5 border border-white/10 rounded-[35px] flex flex-col items-center gap-3">
          <BookOpen size={24} className="text-faith" />
          <span className="text-xs font-black">ورد الأذكار</span>
        </button>
        <button className="p-6 bg-white/5 border border-white/10 rounded-[35px] flex flex-col items-center gap-3">
          <Target size={24} className="text-faith" />
          <span className="text-xs font-black">ختمة القرآن</span>
        </button>
      </div>
    </div>
  );
}

function HabitsSection({ state, setState, addPoints }: any) {
  const [newHabit, setNewHabit] = useState('');
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="تتبع العادات" icon={CheckSquare} />
      <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 flex gap-2">
        <input 
          type="text" placeholder="أضف عادة جديدة..." 
          className="flex-1 bg-transparent border-none outline-none text-right px-4 font-bold"
          value={newHabit} onChange={e => setNewHabit(e.target.value)}
        />
        <button 
          onClick={() => { setState((p:any)=>({...p, habits: [...p.habits, {id: Date.now(), title: newHabit, completedDates: []}] })); addPoints(20); setNewHabit(''); }}
          className="bg-health text-bg p-3 rounded-2xl"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="space-y-2">
        {state.habits.map((h: any) => (
          <div key={h.id} className="bg-white/5 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
            <div className="text-right">
              <div className="text-sm font-black">{h.title}</div>
              <div className="text-[10px] opacity-40 font-bold">بدأت منذ يومين</div>
            </div>
            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Check size={20} className="text-health" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsSection({ state, setState, addPoints }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="الأهداف الشخصية" icon={TrendingUp} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 flex flex-col items-center justify-center space-y-4">
        <div className="w-20 h-20 bg-prod/10 rounded-[30px] flex items-center justify-center">
          <Target size={40} className="text-prod" />
        </div>
        <div className="text-lg font-black text-center">لم تضف أهدافاً لمستقبلك اليوم.</div>
        <button className="px-8 py-3 bg-prod text-white rounded-2xl font-black text-xs uppercase tracking-widest">إضافة هدف جديد</button>
      </div>
    </div>
  );
}

function TravelSection({ state, setState, addPoints }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="إدارة السفر" icon={Plane} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">مخطط الرحلات</div>
          <button className="text-money text-xs font-black">+ وجهة جديدة</button>
        </div>
        <div className="p-8 bg-white/5 rounded-[30px] border border-white/5 text-center space-y-2">
          <Globe size={32} className="mx-auto opacity-10 mb-2" />
          <div className="text-sm font-black opacity-40">لا توجد رحلات قادمة</div>
        </div>
      </div>
    </div>
  );
}

function HomeSection({ state, setState, addPoints }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="المتطلبات المنزلية" icon={HomeIcon} />
      <div className="grid grid-cols-2 gap-4">
        <button className="p-6 bg-white/5 border border-white/10 rounded-[35px] flex flex-col items-center gap-3">
          <ShoppingBag size={24} className="text-faith" />
          <span className="text-xs font-black">سجل التسوق</span>
        </button>
        <button className="p-6 bg-white/5 border border-white/10 rounded-[35px] flex flex-col items-center gap-3">
          <Settings size={24} className="text-faith" />
          <span className="text-xs font-black">سجل الصيانة</span>
        </button>
      </div>
    </div>
  );
}

function EmergencySection({ setActiveSection, state, setState }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="مركز الطوارئ" icon={AlertCircle} />
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-danger p-6 rounded-[35px] text-white flex flex-col items-center gap-2 shadow-xl shadow-danger/20 active:scale-95 transition-all">
          <Phone size={32} />
          <span className="text-xs font-black">اتصال بالإسعاف</span>
        </button>
        <button className="bg-slate-800 p-6 rounded-[35px] text-white flex flex-col items-center gap-2 border border-white/5 active:scale-95 transition-all">
          <Shield size={32} />
          <span className="text-xs font-black">اتصال بالشرطة</span>
        </button>
      </div>
      <button 
        onClick={() => setActiveSection('medical')}
        className="w-full bg-white/5 border border-white/10 p-6 rounded-[35px] flex items-center justify-between group hover:bg-white/10 transition-all"
      >
        <ChevronLeft size={18} className="opacity-30" />
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-sm font-black">الملف الطبي للطوارئ</div>
            <div className="text-[10px] opacity-40 font-bold">فصيلة الدم، الحساسية، الأدوية</div>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl text-white"><User size={20} /></div>
        </div>
      </button>
    </div>
  );
}

function MedicalSection({ state, setState }: any) {
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="الملف الطبي" icon={User} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 space-y-8 text-right">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-[10px] font-black opacity-30 tracking-widest uppercase mb-2">فصيلة الدم</div>
            <div className="text-3xl font-black text-danger">O+</div>
          </div>
          <div>
            <div className="text-[10px] font-black opacity-30 tracking-widest uppercase mb-2">الطول والوزن</div>
            <div className="text-xl font-black">{state.health.weight}كغ / ١٧٥سم</div>
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="text-xs font-black opacity-60 uppercase tracking-widest">جهات اتصال الطوارئ</div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
            <button className="p-2 bg-success/20 text-success rounded-lg"><Phone size={16} /></button>
            <div className="text-right">
              <div className="text-xs font-black">الوالد (المنزل)</div>
              <div className="text-[10px] opacity-40">٠٥٠ XXXXXXX</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusSection({ state, setState, addPoints }: any) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); 

  useEffect(() => {
    let interval: any;
    if (active && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t: number) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setActive(false);
      addPoints(10);
      setTimeLeft(1500); 
    }
    return () => clearInterval(interval);
  }, [active, timeLeft, addPoints]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-8 text-center pb-10" dir="rtl">
      <SectionHeader title="التركيز العميق" icon={Clock} />
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle cx="128" cy="128" r="120" fill="transparent" stroke="white" strokeWidth="4" className="opacity-5" />
          <motion.circle 
            cx="128" cy="128" r="120" fill="transparent" stroke="var(--color-prod)" strokeWidth="8" 
            strokeDasharray={120 * 2 * Math.PI}
            animate={{ strokeDashoffset: 120 * 2 * Math.PI * (1 - (active ? (1500 - timeLeft) / 1500 : 0)) }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-black text-white">{formatTime(timeLeft)}</span>
          <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-2">{active ? 'جارِ التركيز...' : 'جاهز؟'}</span>
        </div>
      </div>
      <button 
        onClick={() => setActive(!active)}
        className={cn("px-12 py-5 rounded-[30px] font-black text-sm transition-all active:scale-95", active ? "bg-white/5 border border-white/10 text-white" : "bg-prod text-white shadow-xl shadow-prod/20")}
      >
        {active ? 'إيقاف مؤقت' : 'ابدأ الجلسة'}
      </button>
    </div>
  );
}

function StoreSection({ points, addPoints }: any) {
  const items = [
    { title: 'ثيم الذهب الملكي', price: 500, icon: Sparkles, color: 'money' },
    { title: 'أيقونات النيون', price: 300, icon: Zap, color: 'prod' },
    { title: 'خلفيات طبيعية', price: 200, icon: Activity, color: 'health' },
  ];

  return (
    <div className="space-y-8 pb-10" dir="rtl">
      <SectionHeader title="متجر وقت" icon={ShoppingBag} />
      <div className="bg-money p-8 rounded-[45px] text-bg flex justify-between items-center shadow-xl shadow-money/20">
        <Trophy size={48} className="opacity-20" />
        <div className="text-right">
          <div className="text-[10px] font-black opacity-40 mb-1 uppercase tracking-widest">نقاطك القابلة للصرف</div>
          <div className="text-5xl font-black">{points}</div>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white/5 p-6 rounded-[35px] border border-white/10 flex justify-between items-center">
             <button 
               disabled={points < item.price} 
               onClick={() => addPoints(-item.price)}
               className={cn("px-6 py-3 rounded-2xl font-black text-xs transition-all", points >= item.price ? "bg-money text-bg" : "bg-white/10 opacity-30")}
             >
               {item.price} ن
             </button>
             <div className="text-right">
               <div className="text-sm font-black">{item.title}</div>
               <div className="text-[10px] opacity-40 font-bold leading-none">تخصيص كامل للواجهة</div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalitySection({ aiInsight, state }: any) {
  return (
    <div className="space-y-8 pb-10" dir="rtl">
      <SectionHeader title="تحليل الشخصية" icon={Brain} />
      <div className="bg-white/5 p-8 rounded-[45px] border border-white/10 space-y-8">
        <div className="text-center">
          <div className="text-[10px] font-black text-prod uppercase tracking-[0.3em] mb-2">نمطك السلوكي الحالي</div>
          <h2 className="text-3xl font-black">المنجز الطموح</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: 'الالتزام', p: 85, color: 'faith' },
            { label: 'النشاط', p: 60, color: 'health' },
            { label: 'الانضباط المالي', p: 40, color: 'money' },
            { label: 'التركيز', p: 90, color: 'prod' },
          ].map((stat, i) => (
            <div key={i} className="space-y-2 text-right">
              <div className="flex justify-between text-[10px] font-black opacity-30 uppercase">
                <span>{stat.p}%</span>
                <span>{stat.label}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={cn("h-full", `bg-${stat.color}`)} style={{ width: `${stat.p}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 bg-white/5 rounded-3xl text-sm font-medium leading-relaxed italic opacity-70 text-right">
          "{aiInsight}"
        </div>
      </div>
    </div>
  );
}

function SleepSection({ state, setState, addPoints }: any) {
  const last = state.sleep[state.sleep.length - 1]?.duration || 0;
  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <SectionHeader title="تحليل النوم" icon={Moon} />
      <div className="bg-slate-900 p-10 rounded-[45px] border border-white/10 text-center space-y-4">
        <Moon size={48} className="mx-auto text-money animate-pulse" />
        <div className="text-5xl font-black text-white">{last}س</div>
        <div className="text-xs font-bold opacity-30 uppercase tracking-widest">نوم الليلة الماضية</div>
      </div>
      <div className="bg-white/5 p-6 rounded-[35px] border border-white/10 text-right">
        <div className="text-sm font-black mb-4">سجل ساعات نومك</div>
        <div className="flex gap-2">
          <input type="number" placeholder="كم ساعة نمت؟" className="flex-1 bg-transparent border-none outline-none text-right font-black" />
          <button onClick={()=>addPoints(5)} className="bg-money text-bg px-8 py-3 rounded-2xl font-black text-xs uppercase">حفظ</button>
        </div>
      </div>
    </div>
  );
}

function FeaturesSection({ setActiveSection }: { setActiveSection: (s: Section) => void }) {
  const categories = [
    { title: 'الصحة والبدن', items: [
      { id: 'health', icon: Heart, label: 'النشاط والخطوات', color: 'health' },
      { id: 'food', icon: Utensils, label: 'التغذية والسعرات', color: 'health' },
      { id: 'sleep', icon: Moon, label: 'تحليل النوم والسكون', color: 'money' },
      { id: 'medical', icon: User, label: 'الملف الطبي للطوارئ', color: 'danger' },
    ]},
    { title: 'الروح والذكاء', items: [
      { id: 'faith', icon: Sparkles, label: 'الورد الإيماني', color: 'faith' },
      { id: 'analytics', icon: BookOpen, label: 'المصحف الكريم', color: 'faith' },
      { id: 'personality', icon: Brain, label: 'تحليل الشخصية AI', color: 'prod' },
    ]},
    { title: 'المال والإنتاجية', items: [
      { id: 'money', icon: Wallet, label: 'الميزانية والمالية', color: 'money' },
      { id: 'productivity', icon: Clock, label: 'التركيز العميق (وقت)', color: 'prod' },
      { id: 'focus', icon: Activity, label: 'جلسات العمل المركزة', color: 'prod' },
      { id: 'store', icon: ShoppingBag, label: 'متجر المكافآت', color: 'money' },
    ]},
    { title: 'الحياة والمنزل', items: [
      { id: 'travel', icon: Plane, label: 'إدارة السفر والرحلات', color: 'money' },
      { id: 'home', icon: HomeIcon, label: 'المتطلبات والمنزل', color: 'faith' },
      { id: 'emergency', icon: AlertCircle, label: 'مركز الطوارئ SOS', color: 'danger' },
      { id: 'goals', icon: Target, label: 'الأهداف الشخصية', color: 'prod' },
      { id: 'habits', icon: CheckSquare, label: 'تتبع العادات اليومية', color: 'health' },
    ]}
  ];

  return (
    <div className="space-y-8 pb-10">
      <SectionHeader title="خريطة مميزات وقت" icon={Menu} />
      <div className="space-y-8 px-1">
        {categories.map((cat, i) => (
          <div key={i} className="space-y-4 text-right">
            <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em]">{cat.title}</h3>
            <div className="grid grid-cols-1 gap-2">
              {cat.items.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveSection(item.id as Section)}
                  className="bg-white/5 p-5 rounded-[28px] border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <div className={cn("p-2.5 rounded-xl border shadow-lg", `bg-${item.color}/10 border-${item.color}/20 text-${item.color}`)}>
                    <item.icon size={20} />
                  </div>
                  <div className="text-right flex-1 font-black text-sm">{item.label}</div>
                  <ChevronLeft size={16} className="opacity-20" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavItem({ active, icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-all", active ? "text-money" : "text-white opacity-40")}>
      <Icon size={20} />
      <span className="text-[9px] font-black opacity-60 uppercase">{label}</span>
    </button>
  );
}

function ComingSoon({ section }: { section: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <Sparkles size={48} className="text-money opacity-20" />
      <h2 className="text-xl font-bold opacity-50">قسم {section}</h2>
      <p className="text-xs opacity-40 max-w-[200px]">هذه الميزة ستكون متاحة في التحديث القادم.</p>
    </div>
  );
}
