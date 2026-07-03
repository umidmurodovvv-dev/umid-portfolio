import React, { useState, useEffect } from "react";
import { 
  BookOpen, Volume2, VolumeX, Sparkles, Headphones, CheckCircle, HelpCircle, ArrowRight
} from "lucide-react";
import { ExplanationSection, User } from "../types";
import { speakText as speakTtsText, stopTts } from "../lib/tts";

interface AIExplanationViewProps {
  sections: ExplanationSection[];
  documentTitle: string;
  user: User;
  onStartQuiz: () => void;
}

export default function AIExplanationView({ sections, documentTitle, user, onStartQuiz }: AIExplanationViewProps) {
  // Voice playback states
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const voiceType: "male" | "female" = "female";
  const [ttsErrorMessage, setTtsErrorMessage] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("tts_speed");
    return saved ? parseFloat(saved) : 1.0;
  });

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
    const currentIndex = speeds.indexOf(speechSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setSpeechSpeed(nextSpeed);
    localStorage.setItem("tts_speed", nextSpeed.toString());
    logTelemetryAction("Change voice speed", `Ovoz tezligini "${nextSpeed}x" qilib o'zgartirdi.`);
  };

  useEffect(() => {
    // Record learning activity
    logTelemetryAction("Start explanation reading", `"${documentTitle}" tushuntirish matnini to'liq o'qishni boshladi.`);
    return () => {
      stopVoice();
    };
  }, [documentTitle]);

  const logTelemetryAction = async (action: string, details: string) => {
    try {
      await fetch("/api/telemetry/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          action,
          details,
          deviceInfo: {
            browser: "Chrome",
            os: navigator.platform,
            deviceType: window.innerWidth < 768 ? "Mobile" : "Desktop"
          }
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const speakEntireDocument = async () => {
    if (isPlayingVoice) {
      stopVoice();
      return;
    }

    // Combine all sections for a single continuous reading experience
    const textParts: string[] = [];
    textParts.push(`Mavzu: ${documentTitle}.`);
    
    sections.forEach((sec, idx) => {
      textParts.push(`Bo'lim: ${sec.title}.`);
      textParts.push(`${sec.summary}.`);
      textParts.push(`${sec.content}.`);
      if (sec.example) {
        textParts.push(`Misol uchun: ${sec.example}.`);
      }
    });

    const textToSpeak = textParts.join(" ");
    setIsPlayingVoice(true);
    setTtsErrorMessage("");

    speakTtsText(
      textToSpeak,
      voiceType,
      () => {
        setIsPlayingVoice(true);
        setTtsErrorMessage("");
      },
      () => {
        setIsPlayingVoice(false);
      },
      (err) => {
        setTtsErrorMessage(err);
      }
    );
  };

  const stopVoice = () => {
    setIsPlayingVoice(false);
    stopTts();
  };

  return (
    <div id="explanation-view-root" className="w-full max-w-3xl mx-auto space-y-6 relative z-10 p-2 sm:p-4">
      
      {/* Top sticky-like reader control toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">Mavzu darsligi</span>
            <h2 className="text-sm font-bold text-slate-100 font-display truncate max-w-[250px] sm:max-w-[350px]">
              {documentTitle}
            </h2>
          </div>
        </div>

        {/* Audio control panel */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Speed selector button with downward-pointing triangle */}
          <button
            onClick={handleCycleSpeed}
            title="Gapirish tezligini oshirish"
            className="px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
          >
            <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 24 24">
              <path d="M21 6H3L12 18L21 6Z" />
            </svg>
            <span className="font-mono">{speechSpeed.toFixed(2)}x</span>
          </button>

          <button
            onClick={speakEntireDocument}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isPlayingVoice 
                ? "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse hover:bg-red-500/25" 
                : "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg"
            }`}
          >
            {isPlayingVoice ? (
              <>
                <VolumeX className="w-4 h-4 stroke-[2.5]" />
                Ovozni O'chirish
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 stroke-[2.5]" />
                Matnni Ovozli Eshitish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive spectrum shown when audio is playing */}
      {isPlayingVoice && (
        <div className="flex items-center justify-center gap-1.5 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <div className="w-1.5 h-3.5 bg-amber-500 rounded animate-bounce [animation-delay:0.1s]" />
          <div className="w-1.5 h-5.5 bg-amber-500 rounded animate-bounce [animation-delay:0.2s]" />
          <div className="w-1.5 h-7 bg-amber-500 rounded animate-bounce [animation-delay:0.3s]" />
          <div className="w-1.5 h-4.5 bg-amber-500 rounded animate-bounce [animation-delay:0.4s]" />
          <div className="w-1.5 h-6 bg-amber-500 rounded animate-bounce [animation-delay:0.5s]" />
          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider ml-2 font-mono">
            AI o'qituvchi matnni ovozli o'qimoqda...
          </span>
        </div>
      )}

      {ttsErrorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-xl text-center">
          {ttsErrorMessage}
        </div>
      )}

      {/* Unified Book/Dictation Sheet Canvas */}
      <div className="bg-slate-950/50 backdrop-blur-sm border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-10 relative overflow-hidden">
        
        {/* Aesthetic header details simulating a notebook sheet */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-cyan-500 to-amber-500 opacity-60" />
        
        <div className="text-center space-y-2 border-b border-slate-800/60 pb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            {documentTitle}
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Tizim tomonidan tayyorlangan diktant va o'quv darsligi
          </p>
        </div>

        {/* Continuous Linear Text Flow */}
        <div className="space-y-12">
          {sections.map((sec, idx) => (
            <div key={sec.id || idx} className="space-y-5 animate-fade-in">
              {/* Section Sub-title */}
              <h3 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2 pb-1 border-b border-slate-800/40">
                <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg">
                  {idx + 1}
                </span>
                {sec.title}
              </h3>

              {/* Summary Accent Box inline */}
              <p className="text-sm sm:text-base leading-relaxed text-slate-300 font-medium pl-4 border-l-2 border-amber-500/50 bg-amber-500/[0.02] py-2 rounded-r-lg">
                {sec.summary}
              </p>

              {/* Detailed Explanation Paragraphs */}
              <div className="text-slate-100 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
                <p className="whitespace-pre-line text-slate-200/95 tracking-wide">
                  {sec.content}
                </p>
              </div>

              {/* Case Study Example if provided */}
              {sec.example && (
                <div className="p-4 bg-cyan-500/[0.03] border border-cyan-500/10 rounded-2xl space-y-1.5">
                  <h4 className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Hayotiy Misol:
                  </h4>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    "{sec.example}"
                  </p>
                </div>
              )}

              {/* Integrated Concept Terms if provided */}
              {sec.concepts && sec.concepts.length > 0 && (
                <div className="mt-4 p-4 bg-slate-900/40 border border-slate-800/60 rounded-2xl space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    Asosiy Atamalar:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sec.concepts.map((concept, cIdx) => (
                      <div key={cIdx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-0.5">
                        <span className="text-xs font-bold text-cyan-400">{concept.term}</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{concept.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Big Glowy bottom action button triggering the quiz */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-200">Mavzuni to'liq o'qib bo'ldingizmi?</h3>
            <p className="text-xs text-slate-500">Endi AI sizni sinab ko'rish uchun maxsus savollar tayyorladi!</p>
          </div>
          
          <button
            onClick={onStartQuiz}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm px-8 py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2 group"
          >
            Mavzu Yuzasidan Bilimni Sinash (Quiz boshlash)
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

      </div>

    </div>
  );
}
