import React, { useState, useEffect } from "react";
import { User as UserIcon, Lock, ShieldAlert, ArrowRight, Eye, EyeOff, UserPlus, Shield, Sparkles } from "lucide-react";
import { User } from "../types";

interface AuthSystemProps {
  onLoginSuccess: (user: User) => void;
  onAdminLoginSuccess?: () => void;
}

export default function AuthSystem({ onLoginSuccess }: AuthSystemProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "admin">("login");
  
  // Standard User form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Admin-only login states
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  // General UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Client fingerprint logic to prevent duplicate registration spam (maximum 3 creations per device)
  const [clientFingerprint, setClientFingerprint] = useState("");
  const [creationCount, setCreationCount] = useState(0);

  useEffect(() => {
    // Retrieve or initialize unique client fingerprint
    let fp = localStorage.getItem("user_client_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      localStorage.setItem("user_client_fingerprint", fp);
    }
    setClientFingerprint(fp);

    // Get current local creation count
    const count = parseInt(localStorage.getItem("created_accounts_count") || "0", 10);
    setCreationCount(count);
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    return {
      browser: userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : userAgent.includes("Firefox") ? "Firefox" : "Browser",
      os: navigator.platform,
      deviceType: window.innerWidth < 768 ? "Mobile" : "Desktop"
    };
  };

  // 1. Standard User Login Handler
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Iltimos, foydalanuvchi nomi va parolni to'liq kiriting.");
      triggerShake();
      return;
    }

    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          deviceInfo: getDeviceInfo()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("current_user_session", JSON.stringify(data.user));
        if (data.user.role === "admin") {
          localStorage.setItem("is_admin_session", "true");
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Foydalanuvchi nomi yoki parol noto'g'ri.");
        triggerShake();
      }
    } catch (err) {
      setError("Tarmoq ulanishida yoki serverda xatolik yuz berdi.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Standard User Self-Registration Handler
  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double check local count protection
    if (creationCount >= 3) {
      setError("Ushbu qurilmadan ko'p hisob ochish taqiqlangan! Maksimal limit: 3 ta hisob.");
      triggerShake();
      return;
    }

    if (!username.trim() || !password || !name.trim()) {
      setError("Barcha maydonlarni to'ldirishingiz shart.");
      triggerShake();
      return;
    }

    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim(),
          clientFingerprint,
          deviceInfo: getDeviceInfo()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Increment and save registration count
        const nextCount = creationCount + 1;
        setCreationCount(nextCount);
        localStorage.setItem("created_accounts_count", String(nextCount));

        // Directly log the user in for flawless instant entry!
        localStorage.setItem("current_user_session", JSON.stringify(data.user));
        if (data.user.role === "admin") {
          localStorage.setItem("is_admin_session", "true");
        }
        
        setSuccessMsg("Hisobingiz muvaffaqiyatli yaratildi va kirildi!");
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Hisob yaratishda xatolik yuz berdi.");
        triggerShake();
      }
    } catch (err) {
      setError("Tarmoq ulanishida xatolik yuz berdi.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Admin-Only Password Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) {
      setError("Administrator parolini kiriting.");
      triggerShake();
      return;
    }

    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          deviceInfo: getDeviceInfo()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("current_user_session", JSON.stringify(data.user));
        localStorage.setItem("is_admin_session", "true");
        onLoginSuccess(data.user);
      } else {
        setError(data.error || "Xato administrator paroli! Kirish qat'iyan man etiladi.");
        triggerShake();
      }
    } catch (err) {
      setError("Administrator tizimiga ulanishda xatolik yuz berdi.");
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-container" className="w-full max-w-md mx-auto relative z-10">
      <div className={`glass-panel-dark text-white rounded-3xl p-8 shadow-2xl border border-slate-800/80 relative overflow-hidden backdrop-blur-xl transition-all duration-500 ${isShaking ? "animate-shake border-red-500/50" : ""}`}>
        
        {/* Neon decorative background glow */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 bg-amber-500/10 rounded-2xl mb-3 border border-amber-500/20 shadow-lg shadow-amber-500/5">
            {activeTab === "admin" ? (
              <Shield className="w-7 h-7 text-amber-500 animate-pulse" />
            ) : (
              <Sparkles className="w-7 h-7 text-amber-500" />
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {activeTab === "admin" ? "Admin Tizimi" : "Kognitiv Ta'lim Tizimi"}
          </h1>
          <p className="text-slate-400 text-xs mt-1.5 max-w-xs mx-auto">
            {activeTab === "admin" 
              ? "Tizim ma'lumotlarini boshqarish va foydalanuvchilar nazorati."
              : "Mavzularni oddiy va oson tushunish, testlar yordamida o'zlashtirish platformasi."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-900 mb-5 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setError("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeTab === "login" 
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setError("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeTab === "register" 
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Ro'yxatdan o'tish
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError("");
              setSuccessMsg("");
            }}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === "admin" 
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>

        {/* Action Error message banner */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs leading-relaxed font-semibold">{error}</p>
          </div>
        )}

        {/* Success message banner */}
        {successMsg && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 animate-fadeIn">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-emerald-400 text-[10px] font-black">✓</span>
            </div>
            <p className="text-emerald-400 text-xs leading-relaxed font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === "login" && (
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foydalanuvchi nomi</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  placeholder="Login nomingizni kiriting"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tizim paroli</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  placeholder="Maxfiy parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Tizimga kirish
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Self-Registration Form */}
        {activeTab === "register" && (
          <form onSubmit={handleUserRegister} className="space-y-4">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-900 mb-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Yaratilgan hisoblar limit:</span>
              <span className="text-xs font-bold text-amber-500">{creationCount} / 3</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ism / Familiya</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={isLoading || creationCount >= 3}
                  placeholder="Ismingizni kiriting"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanlang: Foydalanuvchi nomi (Login)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  disabled={isLoading || creationCount >= 3}
                  placeholder="Masalan: umid_student"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yangi parol yarating</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading || creationCount >= 3}
                  placeholder="Yangi maxfiy parolingizni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || creationCount >= 3}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Hisob yaratish
                  <UserPlus className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 3: Dedicated Admin Login Form */}
        {activeTab === "admin" && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-amber-300 text-[11px] leading-relaxed">
                Tizim administratori uchun maxsus himoyalangan portal. Davom etish uchun maxfiy parolni kiriting.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Paroli</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4 text-amber-500/40" />
                </span>
                <input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  placeholder="Administrator parolini kiriting"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-amber-500 rounded-xl py-3 pl-10 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/15 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Tizimni Boshqarish (Admin)
                  <Shield className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center border-t border-slate-850 pt-5">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Platform Secure Engine v3.0 • SSL Protected
          </p>
        </div>

      </div>
    </div>
  );
}
