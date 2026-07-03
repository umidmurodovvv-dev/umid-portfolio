import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, Palette, Headphones, Sparkles, ShieldCheck, Info, Save, 
  Smartphone, Eye, HelpCircle, Monitor, Globe, RefreshCw, Check, AlertTriangle, Copy, ExternalLink
} from "lucide-react";
import WallpaperSystem from "./WallpaperSystem";
import { User } from "../types";

interface SettingsPanelProps {
  user: User;
  onUpdateUser: (updated: User) => void;
  activeWallpaper: { type: "color" | "image" | "video"; value: string };
  onWallpaperChange: (wp: { type: "color" | "image" | "video"; value: string }) => void;
  wallpaperGlassMode: boolean;
  onToggleGlassMode: () => void;
  onClose: () => void;
}

export default function SettingsPanel({ 
  user, onUpdateUser, activeWallpaper, onWallpaperChange, wallpaperGlassMode, onToggleGlassMode, onClose 
}: SettingsPanelProps) {
  
  const [userName, setUserName] = useState(user.name);
  const [accentColor, setAccentColor] = useState("amber"); // default
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [dnsStatus, setDnsStatus] = useState<{
    domain: string;
    wwwDomain: string;
    configured: boolean;
    aRecords: string[];
    cnameRecords: string[];
    error: string | null;
    checkedAt: string | null;
  } | null>(null);
  const [isCheckingDns, setIsCheckingDns] = useState(false);
  const [simulatedDomain, setSimulatedDomain] = useState(() => {
    return localStorage.getItem("simulated_domain_active") === "true";
  });
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const checkDomainDns = async () => {
    setIsCheckingDns(true);
    try {
      const res = await fetch("/api/domain/check");
      const data = await res.json();
      setDnsStatus(data);
    } catch (err) {
      console.error("DNS check failed", err);
    } finally {
      setIsCheckingDns(false);
    }
  };

  useEffect(() => {
    checkDomainDns();
  }, []);

  const toggleSimulation = () => {
    const newVal = !simulatedDomain;
    setSimulatedDomain(newVal);
    localStorage.setItem("simulated_domain_active", String(newVal));
    
    // Dispatch a custom event to notify App header title changes if needed
    window.dispatchEvent(new Event("domain_sim_changed"));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleSaveGeneral = () => {
    const updated: User = {
      ...user,
      name: userName
    };
    onUpdateUser(updated);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    // Track event
    fetch("/api/telemetry/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        userName: userName,
        action: "Update settings",
        details: "Tizim sozlamalarini va foydalanuvchi profilini yangiladi.",
        deviceInfo: user.deviceInfo
      })
    }).catch(e => console.error(e));
  };

  return (
    <div id="settings-panel-root" className="w-full max-w-4xl mx-auto space-y-6 relative z-10 p-2 sm:p-4 transition-all duration-300">
      
      {/* Header section */}
      <div className="flex items-center justify-between glass-panel-dark p-5 rounded-2xl border border-slate-800">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Shaxsiy sozlamalar</span>
          <h2 className="text-base font-bold font-display text-white">Ilova Sozlamalari (Settings)</h2>
        </div>
        <button
          onClick={onClose}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all"
        >
          Yopish (Save & Exit)
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold flex items-center gap-1.5 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          Sozlamalar muvaffaqiyatli saqlandi!
        </div>
      )}

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: General + Voice (2/3 size) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* General & Profile Section */}
          <div className="glass-panel-dark p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserIcon className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-200">Profil Sozlamalari</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-1.5">
                  Ismingiz
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-1.5">
                  Sizning hisobingiz
                </label>
                <input
                  type="text"
                  disabled
                  value={user.username || "Guest Account"}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2.5 px-3.5 text-xs text-slate-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Wallpaper integration */}
          <div className="glass-panel-dark p-6 rounded-3xl border border-slate-800">
            <WallpaperSystem 
              activeWallpaper={activeWallpaper} 
              onWallpaperChange={onWallpaperChange} 
              wallpaperGlassMode={wallpaperGlassMode}
              onToggleGlassMode={onToggleGlassMode}
            />
          </div>

          {/* Domain integration */}
          <div id="domain-settings-card" className="glass-panel-dark p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-200">Domen Sozlamalari (ultimate.ai.uz)</h3>
              </div>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                (dnsStatus?.configured || simulatedDomain) ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
              }`}>
                {(dnsStatus?.configured || simulatedDomain) ? "Ulandi (Active)" : "Kutilmoqda (Pending)"}
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Ushbu dasturni dunyodagi istalgan brauzer orqali <strong className="text-white">ultimate.ai.uz</strong> manzili orqali ochish uchun quyidagi DNS sozlamalarini domeningiz boshqaruv paneliga (Cloudflare, GoDaddy, Reg.ru, Namecheap yoki Uzinfocom) kiritishingiz lozim.
            </p>

            {/* DNS Records Table */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kerakli DNS Yozuvlari (Required Records)</span>
              
              <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/60 text-[11px] font-mono">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 text-[10px]">
                      <th className="p-2 sm:p-3 font-semibold">Turi (Type)</th>
                      <th className="p-2 sm:p-3 font-semibold">Xost (Host)</th>
                      <th className="p-2 sm:p-3 font-semibold">Qiymati (Value)</th>
                      <th className="p-2 sm:p-3 text-right">Nusxa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {/* A Record */}
                    <tr>
                      <td className="p-2 sm:p-3 text-amber-500 font-bold">A</td>
                      <td className="p-2 sm:p-3">@</td>
                      <td className="p-2 sm:p-3 break-all">216.239.32.21</td>
                      <td className="p-2 sm:p-3 text-right">
                        <button type="button" onClick={() => handleCopy("216.239.32.21")} className="hover:text-white p-1 text-slate-500 hover:bg-slate-900 rounded-lg">
                          {copiedText === "216.239.32.21" ? <span className="text-[10px] text-emerald-400">Ok!</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {/* A Record 2 */}
                    <tr>
                      <td className="p-2 sm:p-3 text-amber-500 font-bold">A</td>
                      <td className="p-2 sm:p-3">@</td>
                      <td className="p-2 sm:p-3 break-all">216.239.34.21</td>
                      <td className="p-2 sm:p-3 text-right">
                        <button type="button" onClick={() => handleCopy("216.239.34.21")} className="hover:text-white p-1 text-slate-500 hover:bg-slate-900 rounded-lg">
                          {copiedText === "216.239.34.21" ? <span className="text-[10px] text-emerald-400">Ok!</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                    {/* CNAME Record */}
                    <tr className="bg-slate-900/10">
                      <td className="p-2 sm:p-3 text-purple-400 font-bold">CNAME</td>
                      <td className="p-2 sm:p-3">www</td>
                      <td className="p-2 sm:p-3 break-all">ghs.googlehosted.com.</td>
                      <td className="p-2 sm:p-3 text-right">
                        <button type="button" onClick={() => handleCopy("ghs.googlehosted.com.")} className="hover:text-white p-1 text-slate-500 hover:bg-slate-900 rounded-lg">
                          {copiedText === "ghs.googlehosted.com." ? <span className="text-[10px] text-emerald-400">Ok!</span> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Check live / Simulation controls */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 items-stretch sm:items-center justify-between border-t border-slate-800">
              {/* Check button */}
              <button
                type="button"
                onClick={checkDomainDns}
                disabled={isCheckingDns}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded-xl font-bold transition-all border border-slate-800 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDns ? "animate-spin text-amber-500" : ""}`} />
                {isCheckingDns ? "Tekshirilmoqda..." : "DNSni tekshirish"}
              </button>

              {/* Simulation switch */}
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950/40 border border-slate-900 p-2 rounded-xl px-3">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-300">Simulyatsiya rejimi</span>
                  <span className="text-[9px] text-slate-500">Ulashni simulyatsiya qilish</span>
                </div>
                <button
                  type="button"
                  onClick={toggleSimulation}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    simulatedDomain ? "bg-amber-500" : "bg-slate-800"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      simulatedDomain ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* DNS Check Status Feedback */}
            {dnsStatus && (
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-3 ${
                (dnsStatus.configured || simulatedDomain) 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {(dnsStatus.configured || simulatedDomain) ? (
                    <>
                      <Check className="w-5 h-5 shrink-0 text-emerald-400" />
                      Tabriklaymiz! Domen muvaffaqiyatli bog'landi
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 animate-bounce" />
                      Domen hozircha bog'lanmagan (NXDOMAIN xatosi)
                    </>
                  )}
                </div>
                
                <p className="text-slate-300">
                  Sizning brauzeringizda ko'rsatilgan <strong className="text-white">NXDOMAIN (Не удается открыть эту страницу)</strong> xatosi — bu <strong>ultimate.ai.uz</strong> domeningiz hali internetda faollashtirilmaganini va hech qayerga yo'naltirilmaganini bildiradi. 
                </p>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-900 space-y-2.5 text-slate-300">
                  <span className="text-xs font-bold text-amber-400 block border-b border-slate-900 pb-1.5">🚀 Domenni ishga tushirish uchun 3 ta oson qadam:</span>
                  
                  <ol className="list-decimal list-inside space-y-2 text-[11px] font-medium leading-relaxed">
                    <li>
                      <strong className="text-white">Domenni ro'yxatdan o'tkazish:</strong> Agar domenni hali sotib olmagan bo'lsangiz, uni <span className="text-amber-400">cctld.uz</span>, <span className="text-amber-400">uzinfocom</span>, yoki <span className="text-amber-400">billur.com</span> kabi registratorlardan sotib oling.
                    </li>
                    <li>
                      <strong className="text-white">Cloudflare yoki DNS panelga kirish:</strong> Domeningizning DNS boshqaruv paneliga kiring va quyidagi A va CNAME yozuvlarini qo'shing.
                    </li>
                    <li>
                      <strong className="text-white">Yo'naltirish (Redirection) sozlamasi:</strong> Domeningiz boshqaruv panelida <strong className="text-amber-400">URL Forwarding / Redirect</strong> bo'limiga kiring va <strong className="text-white">ultimate.ai.uz</strong> manzilini ushbu jonli SaaS ilovangiz manziliga yo'naltiring:
                      <div className="flex items-center gap-2 mt-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-mono select-all break-all flex-1">https://ais-pre-2ogr33xp3jzxyakfj4gd3h-390182720229.asia-east1.run.app</span>
                        <button 
                          type="button" 
                          onClick={() => handleCopy("https://ais-pre-2ogr33xp3jzxyakfj4gd3h-390182720229.asia-east1.run.app")}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-white rounded font-bold transition-all shrink-0"
                        >
                          {copiedText === "https://ais-pre-2ogr33xp3jzxyakfj4gd3h-390182720229.asia-east1.run.app" ? "Nusxalandi!" : "Nusxa olish"}
                        </button>
                      </div>
                    </li>
                  </ol>
                </div>

                <p className="text-[11px] text-slate-400">
                  💡 <strong>Maslahat:</strong> DNS sozlamalari kiritilgach, ularning butun dunyo bo'ylab faollashishi uchun 15 daqiqadan 24 soatgacha vaqt ketishi mumkin. Ungacha tizimni tekshirish uchun <strong className="text-amber-400">Simulyatsiya rejimi</strong>ni yoqib qo'yishingiz mumkin.
                </p>

                {dnsStatus.aRecords && dnsStatus.aRecords.length > 0 && (
                  <div className="font-mono text-[9px] pt-1 text-slate-400">
                    Hozirgi A yozuvlari: {dnsStatus.aRecords.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Account Specs + System Info (1/3 size) */}
        <div className="space-y-6">
          
          {/* Account status details */}
          <div className="glass-panel-dark p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-200">Hisob Ma'lumotlari</h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Roli:</span>
                <span className="text-white font-semibold uppercase font-mono tracking-wider">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Holati:</span>
                <span className="text-emerald-400 font-bold">Muvaffaqiyatli Faol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platforma:</span>
                <span className="text-slate-300 font-mono">{user.deviceInfo.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Kirish vaqti:</span>
                <span className="text-slate-300">{new Date(user.deviceInfo.loginTime).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* About the SaaS Platform & Engineering Standard */}
          <div className="glass-panel-dark p-6 rounded-3xl border border-slate-800 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 text-amber-500/5 pointer-events-none">
              <Info className="w-20 h-20" />
            </div>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-200">Ilova Haqida</h3>
            </div>

            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>Ultimate AI Learning Platform</strong> — bu jahon andozalari talablari darajasida, eng so'nggi full-stack texnologiyalar yordamida yaratilgan ta'lim va tahlil platformasidir.
            </p>

            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <p>Platforma versiyasi: v1.0.4-Beta</p>
              <p>Tuzuvchi: Elite Software Engineers Team</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleSaveGeneral}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 stroke-[2.5]" />
            Sozlamalarni saqlash
          </button>

        </div>
      </div>

    </div>
  );
}

// Simple fallback helper component
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}
