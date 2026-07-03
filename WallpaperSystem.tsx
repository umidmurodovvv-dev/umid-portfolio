import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, FileText, Compass, Settings, Shield, BookOpen, 
  HelpCircle, AlertTriangle, Key, LogOut, ArrowRight, Layers, FileUp, 
  RefreshCw, Cpu, CheckCircle, Smartphone, Flame, ShieldAlert, HeartHandshake,
  Sun, Moon, Volume2, VolumeX, Home
} from "lucide-react";

import { User, DocumentUpload, QuizQuestion, ExplanationSection } from "./types";
import AuthSystem from "./components/AuthSystem";
import AdminPanel from "./components/AdminPanel";
import AIExplanationView from "./components/AIExplanationView";
import SmartQuizView from "./components/SmartQuizView";
import SettingsPanel from "./components/SettingsPanel";

const telegramQr = new URL("./assets/images/telegram_qr_1782889966382.jpg", import.meta.url).href;

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("current_user_session");
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return localStorage.getItem("is_admin_session") === "true";
    } catch (err) {
      return false;
    }
  });
  const [currentView, setCurrentView] = useState<"welcome" | "explanation" | "quiz" | "settings" | "admin">(
    localStorage.getItem("is_admin_session") === "true" ? "admin" : "welcome"
  );

  // Bypass blocked passcode states
  const [bypassPasscode, setBypassPasscode] = useState("");
  const [bypassError, setBypassError] = useState("");
  const [isUnblocking, setIsUnblocking] = useState(false);

  // Theme control: dark vs light ("Tun" / "Kun")
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Custom Domain Integration Status (ultimate.ai.uz)
  const [domainActive, setDomainActive] = useState(() => {
    return localStorage.getItem("simulated_domain_active") === "true";
  });

  useEffect(() => {
    const handleDomainChange = () => {
      setDomainActive(localStorage.getItem("simulated_domain_active") === "true");
    };
    window.addEventListener("domain_sim_changed", handleDomainChange);
    return () => {
      window.removeEventListener("domain_sim_changed", handleDomainChange);
    };
  }, []);

  // Learning Core States
  const [inputText, setInputText] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [documentUpload, setDocumentUpload] = useState<DocumentUpload | null>(null);

  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Wallpaper Core State
  const [activeWallpaper, setActiveWallpaper] = useState<{ type: "color" | "image" | "video"; value: string }>({
    type: "color",
    value: "bg-slate-950"
  });

  const [wallpaperGlassMode, setWallpaperGlassMode] = useState<boolean>(() => {
    return localStorage.getItem("wallpaper_glass_mode") === "true";
  });

  // Load wallpaper and theme from localStorage on start
  useEffect(() => {
    const savedWp = localStorage.getItem("active_wallpaper");
    if (savedWp) {
      try {
        setActiveWallpaper(JSON.parse(savedWp));
      } catch (e) {
        console.error(e);
      }
    }

    const savedTheme = localStorage.getItem("theme_preference") || "dark";
    setTheme(savedTheme as "dark" | "light");
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  }, []);

  const handleToggleGlassMode = () => {
    const nextVal = !wallpaperGlassMode;
    setWallpaperGlassMode(nextVal);
    localStorage.setItem("wallpaper_glass_mode", String(nextVal));
  };

  const [themeRipple, setThemeRipple] = useState<{
    active: boolean;
    theme: "dark" | "light";
  } | null>(null);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    
    // 1. Immediately start the circular expand overlay animation with the destination theme
    setThemeRipple({ active: true, theme: nextTheme });
    
    // 2. Immediately update state and classes so text/icon colors transition smoothly on a single surface
    setTheme(nextTheme);
    localStorage.setItem("theme_preference", nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }

    // 3. Clean up and remove the transition overlay when the animation completely finishes (850ms)
    setTimeout(() => {
      setThemeRipple(null);
    }, 850);
  };

  const handleWallpaperChange = (wp: { type: "color" | "image" | "video"; value: string }) => {
    setActiveWallpaper(wp);
    localStorage.setItem("active_wallpaper", JSON.stringify(wp));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    // Record log on server before logout
    if (user) {
      fetch("/api/telemetry/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          action: "Logout",
          details: "Tizimdan muvaffaqiyatli chiqdi.",
          deviceInfo: user.deviceInfo
        })
      }).catch(e => console.error(e));
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("current_user_session");
    localStorage.removeItem("is_admin_session");
    setCurrentView("welcome");
    setDocumentUpload(null);
    setQuizQuestions([]);
  };

  // Preset Text Templates for quick testing
  const presetTemplates = [
    {
      title: "Kvant Fizikasi",
      text: "Kvant fizikasi - tabiatning eng kichik zarralari (atomlar, elektronlar va fotonlar) darajasidagi qonuniyatlarini o'rganadigan fan bo'limidir. Klassik fizikadan farqli o'laroq, kvant olamida zarralar bir vaqtning o'zida ham to'lqin, ham zarracha xususiyatlarini namoyon qiladi (korpuskulyar-to'lqin dualizmi). Nobel mukofoti sovrindori Nils Bor aytganidek: 'Kim kvant fizikasini eshitib hayratlanmagan bo'lsa, u hali hech narsani tushunmabdi'. Kvant olamida eng muhim tushunchalardan biri - superpozitsiya bo'lib, zarracha kuzatilmaguncha bir vaqtning o'zida barcha mumkin bo'lgan holatlarda bo'ladi. Ikkinchi muhim qoida - kvant chalkashligi (entanglement) bo'lib, bir-biridan yorug'lik yili masofasidagi chalkashgan ikki zarradan birining holatini o'zgartirish, ikkinchisiga lahzada ta'sir ko'rsatadi.",
      desc: "Zarralar olami, superpozitsiya va chalkashlik tushunchalari."
    },
    {
      title: "Asinxron JavaScript",
      text: "JavaScript tili tabiatan bir oqimli (single-threaded) hisoblanadi, ya'ni u bir vaqtning o'zida faqat bitta vazifani bajara oladi. Biroq, saytlarning qotmasdan tez ishlashini ta'minlash uchun asinxron dasturlash qo'llaniladi. Buning markazida Event Loop (hodisalar aylanmasi) turadi. Event Loop - dastur oqimini kuzatib, barcha sinxron kodlar bajarilib bo'lgandan so'ng, navbatda turgan asinxron vazifalarni (masalan, API so'rovlari yoki taymerlarni) bajarishga yo'naltiruvchi mexanizmdir. Asinxron JavaScript dasturlashda Callbacks, Promises va zamonaviy Async/Await sintaksislaridan keng foydalaniladi. Async/Await sintaksisi asinxron kodlarni sinxron ko'rinishda yozishga imkon berib, xatolarni try/catch bloklari yordamida oson ushlash imkonini yaratadi.",
      desc: "Hodisalar aylanmasi (Event Loop) va Promise ob'ektlari."
    },
    {
      title: "Buyuk Ipak Yo'li",
      text: "Buyuk Ipak yo'li - miloddan avvalgi II asrdan to milodiy XV asrgacha Sharq va G'arbni, ya'ni Xitoy, Markaziy Osiyo, Hindiston, Fors va Rim imperiyalarini bog'lab turgan ulkan quruqlikdagi savdo yo'llari tizimidir. Bu yo'l faqatgina ipak, ziravorlar va qimmatbaho toshlar savdosi bilan cheklanib qolmay, balki madaniyatlar, dinlar, tillar va ilmiy kashfiyotlarning global almashinuviga xizmat qilgan. O'zbekiston hududidagi qadimiy Samarqand, Buxoro va Xiva shaharlari ushbu yo'lning eng muhim chorrahalari va madaniy markazlari bo'lgan. Ipak yo'li orqali qog'oz ishlab chiqarish sirlari, porox va kompas Xitoydan Yevropaga yetib borgan, bu esa jahon sivilizatsiyasi rivojini keskin tezlashtirgan.",
      desc: "Qadimgi savdo yo'li, madaniy chorrahalar va O'zbekiston tarixi."
    }
  ];

  const handleProcessDocument = async (text: string, title?: string) => {
    if (!text.trim()) return;
    setIsProcessingDoc(true);
    setInputText(text);

    try {
      const response = await fetch("/api/learning/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          title: title || "Yuklangan Mavzu",
          userId: user?.id,
          userName: user?.name,
          deviceInfo: user?.deviceInfo
        })
      });
      const data = await response.json();
      if (response.ok) {
        setDocumentUpload(data);
        setDocumentTitle(data.title);
        
        // Directly load the pre-generated quiz from the document upload response for instant access!
        if (data.quiz && data.quiz.length > 0) {
          setQuizQuestions(data.quiz);
          setIsGeneratingQuiz(false);
        } else {
          setQuizQuestions([]); // clear old quiz questions
          // Concurrently kick off quiz generation in the background as a fallback
          setIsGeneratingQuiz(true);
          fetch("/api/learning/generate-quiz", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentTitle: data.title,
              sections: data.sections,
              userId: user?.id,
              userName: user?.name,
              deviceInfo: user?.deviceInfo
            })
          })
          .then(async (res) => {
            const quizData = await res.json();
            if (res.ok && quizData.questions) {
              setQuizQuestions(quizData.questions);
            }
          })
          .catch((err) => {
            console.error("Background quiz generation failed:", err);
          })
          .finally(() => {
            setIsGeneratingQuiz(false);
          });
        }
        
        setCurrentView("explanation");

      } else {
        alert(data.error || "Matnni tahlil qilishda xatolik yuz berdi.");
      }
    } catch (e) {
      alert("Serverga ulanish imkoni bo'lmadi.");
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!documentUpload) return;

    // If quiz is not loaded yet in state, try to read it from documentUpload.quiz directly!
    if (quizQuestions.length === 0 && documentUpload.quiz && documentUpload.quiz.length > 0) {
      setQuizQuestions(documentUpload.quiz);
    }

    // Go to quiz view immediately!
    setCurrentView("quiz");

    // If quiz is still not generated and not currently generating, trigger it manually as a fallback
    if (quizQuestions.length === 0 && !documentUpload.quiz && !isGeneratingQuiz) {
      setIsGeneratingQuiz(true);
      try {
        const response = await fetch("/api/learning/generate-quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentTitle: documentUpload.title,
            sections: documentUpload.sections,
            userId: user?.id,
            userName: user?.name,
            deviceInfo: user?.deviceInfo
          })
        });
        const data = await response.json();
        if (response.ok) {
          setQuizQuestions(data.questions || []);
        } else {
          alert(data.error || "Quiz generatsiya qilinmadi.");
          setCurrentView("explanation");
        }
      } catch (e) {
        alert("Quiz savollarini yuklashda xatolik yuz berdi.");
        setCurrentView("explanation");
      } finally {
        setIsGeneratingQuiz(false);
      }
    }
  };

  // Blocked/Restricted check view (unblock passcode bypass and improved QR contrast)
  const handleBypassUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassPasscode) return;
    setIsUnblocking(true);
    setBypassError("");
    try {
      const res = await fetch("/api/auth/unblock-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, passcode: bypassPasscode })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user); // unblocked user
        setBypassPasscode("");
      } else {
        setBypassError(data.error || "Noto'g'ri blockdan ochish paroli!");
      }
    } catch (err) {
      setBypassError("Tarmoq xatoligi yoki server bilan aloqa uzildi.");
    } finally {
      setIsUnblocking(false);
    }
  };

  if (user && (user.status === "blocked" || user.status === "restricted")) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${theme === "light" ? "bg-slate-50" : "bg-slate-950"}`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel-dark max-w-md w-full p-8 rounded-3xl border border-red-500/25 shadow-2xl relative text-center space-y-6 overflow-hidden"
        >
          
          {/* Crimson glow backdrop */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />

          <div className="inline-flex p-4 bg-red-500/10 rounded-2xl border border-red-500/20 mb-2 animate-pulse">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-white font-display">Siz AI dan foydalandingiz!</h1>
            <p className="text-slate-400 text-xs font-semibold">Tizim anti-cheat xavfsizlik filtri</p>
          </div>

          <div className="p-4 bg-red-500/5 border border-red-500/10 text-red-400 text-xs rounded-2xl leading-relaxed text-left space-y-2">
            <p className="font-bold">Bloklanish sababi:</p>
            <p className="text-slate-300 font-medium">
              "{user.restrictionReason || "Savolga javob berishda Sun'iy Intellekt (AI) yordamidan foydalandingiz! Tizim buni aniqladi va hisobingizni blokladi."}"
            </p>
          </div>

          <div className="pt-4 border-t border-slate-900/80 space-y-4">
            <p className="text-slate-400 text-xs font-medium">
              Blokdan ochish uchun admin bilan bog'laning:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Telegram Link with brand logo */}
              <div className="flex flex-col items-center w-full sm:w-auto space-y-1">
                <a 
                  href="https://t.me/umidmurodov" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-sky-600/10 active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.54 3.65-.52.36-.99.53-1.41.52-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.37-.49 1.03-.75 4.04-1.76 6.74-2.92 8.1-3.48 3.84-1.6 4.63-1.88 5.15-1.89.11 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.13-.03.2z" />
                  </svg>
                  Telegram
                </a>
                <span className="text-slate-300 text-[11px] font-mono tracking-wide font-semibold select-all">@umidmurodov</span>
              </div>

              {/* Instagram Link with brand logo */}
              <div className="flex flex-col items-center w-full sm:w-auto space-y-1">
                <a 
                  href="https://instagram.com/murodovvv_686" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:brightness-110 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-pink-600/10 active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                  Instagram
                </a>
                <span className="text-slate-300 text-[11px] font-mono tracking-wide font-semibold select-all">@murodovvv_686</span>
              </div>
            </div>
          </div>

          {/* Secure Admin Passcode Input Field - Sleek, small, placed at the absolute bottom */}
          <form onSubmit={handleBypassUnblock} className="space-y-1.5 pt-3 border-t border-slate-900/40 text-left max-w-xs mx-auto">
            <label className="block text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">
              Admin unblock paroli:
            </label>
            <div className="flex gap-1.5">
              <input
                type="password"
                placeholder="Parol..."
                value={bypassPasscode}
                onChange={(e) => {
                  setBypassPasscode(e.target.value);
                  setBypassError("");
                }}
                className="flex-1 bg-slate-950/80 border border-slate-900 rounded-lg py-1.5 px-2.5 text-[11px] text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/50 transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isUnblocking || !bypassPasscode}
                className="bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-slate-400 disabled:bg-slate-950 disabled:text-slate-700 border border-slate-800 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all"
              >
                {isUnblocking ? "..." : "Ochish"}
              </button>
            </div>
            {bypassError && (
              <p className="text-[9px] text-red-500 font-semibold">{bypassError}</p>
            )}
          </form>

        </motion.div>
      </div>
    );
  }

  // Render wallpaper layer for a specific theme
  const renderSpecificBackground = (targetTheme: "light" | "dark", isOverlay = false) => {
    const motionProps = {
      key: activeWallpaper.value + "_" + targetTheme,
      initial: { opacity: 0, scale: 1.05 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
    };

    const isLight = targetTheme === "light";

    if (activeWallpaper.type === "image") {
      // Light vs Dark wallpaper visibility styling:
      // Dark mode: Glass Mode has 75% opacity with transparent backdrop blur; Standard has 15% opacity with dark solid overlay
      // Light mode: Glass Mode has 85% opacity with light transparent backdrop blur; Standard has 45% opacity (medium/o'rtancha) with light solid overlay
      const opacityClass = isLight
        ? (wallpaperGlassMode ? "opacity-85" : "opacity-45")
        : (wallpaperGlassMode ? "opacity-75" : "opacity-15");

      const overlayClass = isLight
        ? (wallpaperGlassMode ? "bg-white/30 backdrop-blur-[2px]" : "bg-slate-100/60")
        : (wallpaperGlassMode ? "bg-slate-950/40 backdrop-blur-[2px]" : "bg-slate-950/80");

      return (
        <motion.div {...motionProps} className={`absolute inset-0 transition-all duration-750 ease-out ${isOverlay ? "z-[2]" : "z-0"}`}>
          <img 
            src={activeWallpaper.value} 
            className={`w-full h-full object-cover transition-all duration-750 ease-out ${opacityClass} filter blur-[1px]`} 
            referrerPolicy="no-referrer" 
          />
          <div className={`absolute inset-0 transition-all duration-750 ease-out ${overlayClass}`} />
        </motion.div>
      );
    }
    if (activeWallpaper.type === "video") {
      const opacityClass = isLight
        ? (wallpaperGlassMode ? "opacity-75" : "opacity-35")
        : (wallpaperGlassMode ? "opacity-60" : "opacity-15");

      const overlayClass = isLight
        ? (wallpaperGlassMode ? "bg-white/35 backdrop-blur-[2px]" : "bg-slate-100/65")
        : (wallpaperGlassMode ? "bg-slate-950/45 backdrop-blur-[2px]" : "bg-slate-950/75");

      return (
        <motion.div {...motionProps} className={`absolute inset-0 bg-slate-950 transition-all duration-750 ease-out ${isOverlay ? "z-[2]" : "z-0"}`}>
          <video 
            src={activeWallpaper.value} 
            autoPlay 
            loop 
            muted 
            playsInline
            className={`w-full h-full object-cover transition-all duration-750 ease-out ${opacityClass}`} 
          />
          <div className={`absolute inset-0 transition-all duration-750 ease-out ${overlayClass}`} />
        </motion.div>
      );
    }
    return (
      <motion.div 
        key={"color_" + targetTheme}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`absolute inset-0 transition-all duration-750 ease-out ${isOverlay ? "z-[2]" : "z-0"} ${targetTheme === "light" ? "bg-slate-50" : "bg-slate-950"}`} 
      />
    );
  };

  // Render wallpaper layer
  const renderBackground = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <AnimatePresence mode="popLayout">
          {renderSpecificBackground(theme)}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${theme === "light" ? "text-slate-900 bg-slate-50" : "text-slate-100 bg-slate-950"} antialiased font-sans flex flex-col justify-between relative overflow-hidden transition-colors duration-500`}>
      
      {/* Background layer */}
      {renderBackground()}

      {/* Theme transition circular expand effect starting from top-right in the background layer */}
      {themeRipple && (
        <motion.div
          initial={{ scale: 0, opacity: 1 }}
          animate={{ 
            scale: 180,
            opacity: [1, 1, 0]
          }}
          transition={{ 
            duration: 0.65, 
            times: [0, 0.8, 1],
            ease: "easeOut" 
          }}
          className="fixed w-12 h-12 rounded-full pointer-events-none z-[1] overflow-hidden"
          style={{
            top: "14px",
            right: "84px",
            transformOrigin: "center",
            backgroundColor: themeRipple.theme === "light" ? "#f8fafc" : "#020617"
          }}
        >
          {activeWallpaper.type !== "color" && (
            <div className={`absolute inset-0 ${themeRipple.theme === "light" ? "bg-white/10 backdrop-blur-[1px]" : "bg-slate-950/10 backdrop-blur-[1px]"}`} />
          )}
        </motion.div>
      )}

      {/* Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-sm">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <button 
                onClick={() => { if (user) setCurrentView("settings"); }}
                className="flex flex-col items-start text-left focus:outline-none hover:opacity-90 active:scale-[0.98] transition-all"
                title="Domen sozlamalari va ma'lumotlar"
              >
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-xs sm:text-sm font-display tracking-tight text-white">Ultimate.ai.uz</h1>
                  <span className={`inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                    domainActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25 animate-pulse" 
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${domainActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                    {domainActive ? "Faol (Active)" : "Offline"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">Sun'iy Intellektli Ta'lim Tizimi</p>
              </button>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
              {/* Home/Uycha button to go back to text entry welcome menu */}
              <button
                onClick={() => setCurrentView("welcome")}
                title="Bosh menyu"
                className={`p-1.5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  currentView === "welcome" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <Home className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCurrentView("welcome")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  currentView === "welcome" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Darsliklar
              </button>
              {documentUpload && (
                <button
                  onClick={() => setCurrentView("explanation")}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                    currentView === "explanation" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Mavzu
                </button>
              )}
              {quizQuestions.length > 0 && (
                <button
                  onClick={() => setCurrentView("quiz")}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                    currentView === "quiz" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Quiz Test
                </button>
              )}
              <button
                onClick={() => setCurrentView("settings")}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                  currentView === "settings" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Sozlamalar
              </button>
              {(user.role === "admin" || isAdmin) && (
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all shrink-0 ${
                    currentView === "admin" ? "bg-amber-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Boshqaruv (SaaS)
                </button>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-500 rounded-xl transition-all text-xs font-bold"
              title={theme === "dark" ? "Kun (Day) rejimiga o'tish" : "Tun (Night) rejimiga o'tish"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Kun</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="hidden sm:inline">Tun</span>
                </>
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden md:block">Salom, <strong className="text-white">{user.name}</strong></span>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                  title="Tizimdan chiqish"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-bold px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Gateway Locked
              </span>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 relative z-10 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <AuthSystem 
                onLoginSuccess={(u) => {
                  setUser(u);
                  if (u.role === "admin") {
                    setIsAdmin(true);
                    setCurrentView("admin");
                  } else {
                    setCurrentView("welcome");
                  }
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {/* VIEW: WELCOME / MAIN HOME PORTAL */}
              {currentView === "welcome" && (
                <div id="welcome-portal" className="space-y-8 max-w-4xl mx-auto">
                  
                  {/* Hero greetings header */}
                  <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight leading-tight">
                      Xush kelibsiz, {user.name}!
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      Tahlil qilmoqchi bo'lgan hujjat yoki mavzuni yuklang va AI sizga darslik yaratib bersin.
                    </p>
                  </div>

                  {/* Segmented skeleton loading state */}
                  {isProcessingDoc && (
                    <div className="glass-panel-dark p-8 rounded-3xl border border-slate-800 space-y-6 text-center animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Cpu className="w-6 h-6 text-amber-500 animate-spin" />
                      </div>
                      <div className="space-y-2.5 max-w-md mx-auto">
                        <div className="h-4 bg-slate-800 rounded-md w-3/4 mx-auto" />
                        <div className="h-3 bg-slate-900 rounded-md w-1/2 mx-auto" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Gemini AI hujjat tarkibini bo'limlarga ajratib, tushuntirish va atamalarni generatsiya qilmoqda...</p>
                    </div>
                  )}

                  {!isProcessingDoc && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Main input upload section (2 cols) */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="glass-panel-dark p-6 rounded-3xl border border-slate-800 space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                            <FileUp className="w-5 h-5 text-amber-500" />
                            <h3 className="text-sm font-semibold text-slate-200">Mavzu Matnini Yuklash</h3>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                Darslik Sarlavhasi
                              </label>
                              <input
                                type="text"
                                placeholder="Masalan: Kvant Fizikasi asoslari"
                                value={documentTitle}
                                onChange={(e) => setDocumentTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                Matn tarkibi (Min 100 ta so'z bo'lishi maqsadga muvofiq)
                              </label>
                              <textarea
                                placeholder="Ushbu maydonga o'rganmoqchi bo'lgan har qanday ilmiy, texnik yoki tarixiy maqolani kiriting..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all leading-relaxed"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleProcessDocument(inputText, documentTitle)}
                            disabled={!inputText}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 text-xs font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2"
                          >
                            Tahlil qilishni boshlash
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Right presets template (1 col) */}
                      <div className="space-y-6">
                        <div className="glass-panel-dark p-5 rounded-2xl border border-slate-800 space-y-4">
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-3">
                            <Flame className="w-4 h-4 text-amber-500" />
                            Sinov uchun shablonlar
                          </h3>
                          
                          <div className="space-y-2.5">
                            {presetTemplates.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setDocumentTitle(item.title);
                                  setInputText(item.text);
                                  handleProcessDocument(item.text, item.title);
                                }}
                                className="w-full p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl text-left hover:border-amber-500/30 hover:bg-slate-950 transition-all flex flex-col gap-1 text-xs group"
                              >
                                <span className="font-bold text-slate-200 group-hover:text-amber-400 transition-colors">{item.title}</span>
                                <span className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{item.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* VIEW: EXPLANATION / TOPIC READER */}
              {currentView === "explanation" && documentUpload && (
                <AIExplanationView 
                  sections={documentUpload.sections} 
                  documentTitle={documentTitle}
                  user={user}
                  onStartQuiz={handleStartQuiz}
                />
              )}

              {/* VIEW: SMART QUIZ VIEW */}
              {currentView === "quiz" && (
                <div>
                  {isGeneratingQuiz ? (
                    <div className="glass-panel-dark p-8 rounded-3xl border border-slate-800 max-w-md mx-auto space-y-6 text-center animate-pulse">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                        <Cpu className="w-6 h-6 text-amber-500 animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto" />
                        <div className="h-3 bg-slate-900 rounded w-1/2 mx-auto" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">AI Hujjat asosida mukammal, moslashtirilgan savollar va testlarni shakllantirmoqda...</p>
                    </div>
                  ) : (
                    quizQuestions.length > 0 ? (
                      <SmartQuizView 
                        questions={quizQuestions}
                        documentTitle={documentTitle}
                        user={user}
                        onRestart={() => {
                          setDocumentUpload(null);
                          setQuizQuestions([]);
                          setCurrentView("welcome");
                        }}
                        onUpdateUser={handleUpdateUser}
                      />
                    ) : (
                      <div className="text-center py-12 text-slate-400 text-xs">Savollar yuklanmadi.</div>
                    )
                  )}
                </div>
              )}

              {/* VIEW: SETTINGS */}
              {currentView === "settings" && (
                <SettingsPanel 
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  activeWallpaper={activeWallpaper}
                  onWallpaperChange={handleWallpaperChange}
                  wallpaperGlassMode={wallpaperGlassMode}
                  onToggleGlassMode={handleToggleGlassMode}
                  onClose={() => setCurrentView("welcome")}
                />
              )}

              {/* VIEW: ADMIN PANEL */}
              {currentView === "admin" && (
                <AdminPanel 
                  onLogout={handleLogout}
                />
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Elegant minimalist platform footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/20 py-4 text-center text-[10px] text-slate-500 z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Ultimate AI Learning Platform. Crafted to standard by premium engineers.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition cursor-pointer">SaaS Term of service</span>
            <span className="hover:text-slate-400 transition cursor-pointer">Technical Support</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
