import React, { useState, useEffect } from "react";
import { Sparkles, Upload, Video, Image, Check, Trash2, Eye, EyeOff } from "lucide-react";

interface WallpaperSystemProps {
  activeWallpaper: { type: "color" | "image" | "video"; value: string };
  onWallpaperChange: (wp: { type: "color" | "image" | "video"; value: string }) => void;
  wallpaperGlassMode: boolean;
  onToggleGlassMode: () => void;
}

export const PRESET_WALLPAPERS: { id: string; name: string; type: "color" | "image" | "video"; value: string }[] = [
  { id: "wp_slate", name: "Slate Dark", type: "color", value: "bg-slate-950" },
  { id: "wp_rain_moving", name: "Yomg'ir Tomchilari (Moving)", type: "video", value: "https://assets.mixkit.co/videos/preview/mixkit-raindrops-falling-on-a-window-pane-14187-large.mp4" },
  { id: "wp_tree_moving", name: "Tebranayotgan Daraxt (Moving)", type: "video", value: "https://assets.mixkit.co/videos/preview/mixkit-dense-green-forest-trees-swaying-in-the-wind-39906-large.mp4" },
  { id: "wp_code_moving", name: "IT Dasturchi Matritsa (Moving)", type: "video", value: "https://assets.mixkit.co/videos/preview/mixkit-glowing-digital-binary-code-background-48766-large.mp4" },
  { id: "wp_cosmic", name: "Cosmic Glow", type: "image", value: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_amber_silk", name: "Minimalist Amber Wave", type: "image", value: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_neural", name: "Global Neural Network", type: "image", value: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_cyber_tech", name: "Cyber Tech Grid", type: "image", value: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_starry_peak", name: "Starry Mountain Peaks", type: "image", value: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_fluid_gradient", name: "Premium Fluid Dark", type: "image", value: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1920&q=80" },
  { id: "wp_abstract_acrylic", name: "Abstract Fluid Acrylic", type: "image", value: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=80" }
];

export default function WallpaperSystem({ 
  activeWallpaper, onWallpaperChange, wallpaperGlassMode, onToggleGlassMode 
}: WallpaperSystemProps) {
  const [customWallpapers, setCustomWallpapers] = useState<{ id: string; name: string; type: "image" | "video"; value: string }[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("custom_wallpapers");
    if (saved) {
      try {
        setCustomWallpapers(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result as string;
      const newWp = {
        id: `custom_${Date.now()}`,
        name: file.name.slice(0, 15) + "...",
        type: isVideo ? ("video" as const) : ("image" as const),
        value
      };
      const updated = [newWp, ...customWallpapers];
      setCustomWallpapers(updated);
      localStorage.setItem("custom_wallpapers", JSON.stringify(updated));
      onWallpaperChange({ type: newWp.type, value: newWp.value });
    };
    reader.readAsDataURL(file);
  };

  const deleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customWallpapers.filter(w => w.id !== id);
    setCustomWallpapers(updated);
    localStorage.setItem("custom_wallpapers", JSON.stringify(updated));
  };

  return (
    <div id="wallpaper-manager" className="space-y-4">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-200">Fon va Fon rasmlari</h3>
        </div>
        
        {/* Toggle Mirror/Glass mode */}
        <button
          type="button"
          onClick={onToggleGlassMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
            wallpaperGlassMode
              ? "bg-amber-500/15 text-amber-400 border-amber-500/35"
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
          }`}
          title="Oyna (Glass Mirror) effekti orqali orqa fonni tiniq qilish"
        >
          {wallpaperGlassMode ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5" />}
          {wallpaperGlassMode ? "Oyna: Yoqilgan" : "Oyna: O'chirilgan"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Presets */}
        {PRESET_WALLPAPERS.map((wp) => {
          const isActive = activeWallpaper.value === wp.value;
          return (
            <button
              key={wp.id}
              onClick={() => onWallpaperChange({ type: wp.type, value: wp.value })}
              className={`relative h-20 rounded-xl overflow-hidden group border transition-all text-left flex flex-col justify-end p-2 ${
                isActive ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {wp.type === "color" ? (
                <div className={`absolute inset-0 ${wp.value}`} />
              ) : wp.type === "video" ? (
                <div className="absolute inset-0 bg-slate-900">
                  <video src={wp.value} muted loop className="w-full h-full object-cover opacity-60" />
                </div>
              ) : (
                <img src={wp.value} className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="relative text-[11px] font-medium text-slate-100 z-10 truncate flex items-center gap-1">
                {wp.type === "video" ? <Video className="w-3 h-3 text-amber-400" /> : <Image className="w-3 h-3 text-cyan-400" />}
                {wp.name}
              </span>
              {isActive && (
                <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-0.5 z-10">
                  <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}

        {/* Custom Uploads */}
        {customWallpapers.map((wp) => {
          const isActive = activeWallpaper.value === wp.value;
          return (
            <div
              key={wp.id}
              onClick={() => onWallpaperChange({ type: wp.type, value: wp.value })}
              className={`relative h-20 rounded-xl overflow-hidden group border cursor-pointer transition-all flex flex-col justify-end p-2 ${
                isActive ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {wp.type === "video" ? (
                <video src={wp.value} muted loop className="absolute inset-0 w-full h-full object-cover opacity-50" />
              ) : (
                <img src={wp.value} className="absolute inset-0 w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <span className="relative text-[11px] font-medium text-slate-100 z-10 truncate pr-4">
                {wp.name}
              </span>
              <button
                onClick={(e) => deleteCustom(wp.id, e)}
                className="absolute top-2 left-2 bg-red-500/80 hover:bg-red-500 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
              {isActive && (
                <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-0.5 z-10">
                  <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Upload Button */}
        <label className="relative h-20 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 hover:bg-slate-900/30 transition-all flex flex-col items-center justify-center p-2 cursor-pointer group text-slate-400 hover:text-slate-200">
          <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
          <Upload className="w-5 h-5 mb-1 text-slate-400 group-hover:text-amber-400 transition-colors" />
          <span className="text-[10px] font-medium">Yangi yuklash</span>
        </label>
      </div>
    </div>
  );
}
