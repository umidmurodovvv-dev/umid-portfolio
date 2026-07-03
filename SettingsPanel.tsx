import React, { useState, useEffect } from "react";
import { 
  Users, Activity, FileText, HelpCircle, Shield, Search, CheckCircle, 
  Slash, Ban, Trash2, Smartphone, Monitor, ShieldAlert, Cpu, Database, Play, LogOut, Clock,
  Lock
} from "lucide-react";
import { User, ActivityLog, AdminReviewFlag, SystemStats } from "../types";

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [flags, setFlags] = useState<AdminReviewFlag[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "blocked" | "restricted" | "online">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "sessions" | "activities" | "flags" | "password">("users");

  // Connection state for real-time SSE stream
  const [isConnected, setIsConnected] = useState(false);

  // Custom modal for restriction reason
  const [showRestrictModal, setShowRestrictModal] = useState(false);
  const [restrictUserId, setRestrictUserId] = useState("");
  const [restrictReason, setRestrictReason] = useState("");

  // Create user modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Edit user modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editError, setEditError] = useState("");

  // Change password modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Admin changing their own password tab states
  const [adminCurrentPass, setAdminCurrentPass] = useState("");
  const [adminNewPass, setAdminNewPass] = useState("");
  const [adminConfirmPass, setAdminConfirmPass] = useState("");
  const [adminPassError, setAdminPassError] = useState("");
  const [adminPassSuccess, setAdminPassSuccess] = useState("");
  const [isAdminPassSaving, setIsAdminPassSaving] = useState(false);

  useEffect(() => {
    // Establish real-time SSE communication channel with Express
    const eventSource = new EventSource("/api/telemetry/stream");

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      // SSE default message handler
    };

    // Listen to custom SSE events
    eventSource.addEventListener("init", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setUsers(data.users || []);
        setActivities(data.activities || []);
        setFlags(data.flags || []);
        setStats(data.stats || null);
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    eventSource.addEventListener("stateUpdate", (e: any) => {
      try {
        const data = JSON.parse(e.data);
        setUsers(data.users || []);
        setActivities(data.activities || []);
        setFlags(data.flags || []);
        setStats(data.stats || null);
        
        // Update currently selected user details to keep view synchronized
        if (selectedUser) {
          const updatedSelected = (data.users || []).find((u: User) => u.id === selectedUser.id);
          if (updatedSelected) setSelectedUser(updatedSelected);
        }
      } catch (err) {
        console.error("SSE update parse error", err);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [selectedUser]);

  // Helper to extract current admin's ID
  const getAdminId = (): string => {
    try {
      const saved = localStorage.getItem("current_user_session");
      if (saved) {
        const u = JSON.parse(saved);
        return u.id;
      }
    } catch (e) {}
    return "admin_session";
  };

  // Execute admin actions on backend
  const handleUserAction = async (userId: string, action: string, reason?: string) => {
    try {
      const response = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason, adminId: getAdminId() })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Amalni bajarishda xatolik yuz berdi.");
      } else {
        if (action === "delete" && selectedUser?.id === userId) {
          setSelectedUser(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveFlag = async (flagId: string, status: string) => {
    try {
      await fetch("/api/admin/resolve-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, status, adminId: getAdminId() })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const openRestrictModal = (userId: string) => {
    setRestrictUserId(userId);
    setRestrictReason("");
    setShowRestrictModal(true);
  };

  const submitRestriction = () => {
    if (!restrictReason) return;
    handleUserAction(restrictUserId, "restrict", restrictReason);
    setShowRestrictModal(false);
  };

  const generateRandomUsername = () => {
    const prefixes = ["talaba", "shogird", "user", "bilimdon", "ziyo", "o_quvchi"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}_${num}`;
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%^*";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!newUsername.trim() || !newPassword) {
      setCreateError("Foydalanuvchi nomi va parol kiritilishi shart.");
      return;
    }

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword,
          name: newName || newUsername.trim(),
          notes: newNotes,
          adminId: getAdminId()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCreateSuccess("Foydalanuvchi muvaffaqiyatli yaratildi!");
        setNewUsername("");
        setNewPassword("");
        setNewName("");
        setNewNotes("");
        setTimeout(() => setShowCreateModal(false), 1200);
      } else {
        setCreateError(data.error || "Foydalanuvchi yaratishda xatolik yuz berdi.");
      }
    } catch (err) {
      setCreateError("Server bilan bog'lanishda xatolik yuz berdi.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!selectedUser) return;
    if (!editUsername.trim()) {
      setEditError("Foydalanuvchi nomi kiritilishi shart.");
      return;
    }

    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          username: editUsername.trim(),
          name: editName || editUsername.trim(),
          notes: editNotes,
          adminId: getAdminId()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setShowEditModal(false);
      } else {
        setEditError(data.error || "Tahrirlashda xatolik yuz berdi.");
      }
    } catch (err) {
      setEditError("Server bilan bog'lanishda xatolik yuz berdi.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!selectedUser) return;
    if (!editPassword) {
      setPasswordError("Yangi parol kiritilishi shart.");
      return;
    }

    try {
      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: editPassword,
          adminId: getAdminId()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPasswordSuccess("Parol muvaffaqiyatli o'zgartirildi!");
        setEditPassword("");
        setTimeout(() => setShowPasswordModal(false), 1200);
      } else {
        setPasswordError(data.error || "Parolni o'zgartirishda xatolik yuz berdi.");
      }
    } catch (err) {
      setPasswordError("Server bilan bog'lanishda xatolik yuz berdi.");
    }
  };

  const handleAdminSelfChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassError("");
    setAdminPassSuccess("");

    if (!adminCurrentPass || !adminNewPass || !adminConfirmPass) {
      setAdminPassError("Barcha maydonlarni to'ldirishingiz shart.");
      return;
    }

    if (adminNewPass !== adminConfirmPass) {
      setAdminPassError("Yangi parollar bir-biriga mos kelmadi!");
      return;
    }

    if (adminNewPass.trim().length < 4) {
      setAdminPassError("Yangi parol kamida 4 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setIsAdminPassSaving(true);
    try {
      const response = await fetch("/api/auth/change-admin-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: adminCurrentPass,
          newPassword: adminNewPass.trim()
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setAdminPassSuccess("Administrator paroli muvaffaqiyatli yangilandi! Endi yangi parolingiz amalda.");
        setAdminCurrentPass("");
        setAdminNewPass("");
        setAdminConfirmPass("");
      } else {
        setAdminPassError(data.error || "Parolni yangilashda xatolik yuz berdi.");
      }
    } catch (err) {
      setAdminPassError("Server bilan bog'lanishda xatolik yuz berdi.");
    } finally {
      setIsAdminPassSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.notes && user.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "blocked") return matchesSearch && user.status === "blocked";
    if (statusFilter === "restricted") return matchesSearch && user.status === "restricted";
    if (statusFilter === "online") return matchesSearch && user.isOnline;
    return matchesSearch;
  });

  const calculateSessionDuration = (loginTime: string) => {
    const login = new Date(loginTime).getTime();
    const now = Date.now();
    const diffMins = Math.floor((now - login) / (1000 * 60));
    if (diffMins < 60) return `${diffMins} min`;
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs}soat ${mins}min`;
  };

  return (
    <div id="admin-panel-root" className="w-full max-w-7xl mx-auto space-y-6 relative z-10 p-4 sm:p-6 transition-all duration-300">
      
      {/* Admin Header with SSE Live connection state indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel-dark p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">SaaS Boshqaruv Paneli</h1>
            <span className={`px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-full flex items-center gap-1.5 ${
              isConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
              {isConnected ? "Real-time bog'langan" : "Bog'lanish kutilmoqda"}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">SaaS platformasi real vaqt rejimida foydalanuvchilar o'rganish tezligi va xavfsizligini nazorat qiladi.</p>
        </div>
      </div>

      {/* Grid of Telemetry Statistics Widgets */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel-dark p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Foydalanuvchilar</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white">{stats.onlineUsers + stats.offlineUsers}</span>
                <span className="text-[10px] text-emerald-400 font-medium">({stats.onlineUsers} faol)</span>
              </div>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Sessions</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white">{stats.activeSessions}</span>
                <span className="text-[10px] text-cyan-400 font-mono">Live events</span>
              </div>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Yuklangan Matnlar</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white">{stats.uploadedTexts}</span>
                <span className="text-[10px] text-purple-400 font-mono">AI segmented</span>
              </div>
            </div>
          </div>

          <div className="glass-panel-dark p-5 rounded-2xl border border-slate-800/80 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quiz Savollari</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white">{stats.totalQuestionsAnswered}</span>
                <span className="text-[10px] text-emerald-400 font-medium">({stats.correctAnswersCount} to'g'ri)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main dashboard work grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - tabbed console & lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel-dark rounded-2xl border border-slate-800 overflow-hidden">
            {/* Tabs switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 p-2 gap-1">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === "users" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="w-4 h-4" />
                Foydalanuvchilar
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === "sessions" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Clock className="w-4 h-4" />
                Sessiyalar
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === "activities" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Activity className="w-4 h-4" />
                Loglar
              </button>
              <button
                onClick={() => setActiveTab("flags")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all relative ${
                  activeTab === "flags" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Ko'rik (Flags)
                {flags.filter(f => f.status === "pending").length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full border border-slate-950 animate-bounce">
                    {flags.filter(f => f.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === "password" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="w-4 h-4" />
                Parol
              </button>
            </div>

            {/* TAB CONTENT: USERS LIST */}
            {activeTab === "users" && (
              <div className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Ism, foydalanuvchi nomi yoki eslatma orqali qidirish..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setNewUsername("");
                        setNewPassword("");
                        setNewName("");
                        setNewNotes("");
                        setCreateError("");
                        setCreateSuccess("");
                        setShowCreateModal(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center gap-1.5 shrink-0"
                    >
                      <Users className="w-4 h-4" />
                      Qo'shish
                    </button>
                  </div>

                  {/* Real-time status filters */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        statusFilter === "all" 
                          ? "bg-slate-800 text-white border-slate-700" 
                          : "bg-slate-950/40 text-slate-400 border-slate-900 hover:text-slate-200"
                      }`}
                    >
                      Barchasi ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("blocked")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                        statusFilter === "blocked" 
                          ? "bg-red-500/15 text-red-400 border-red-500/30" 
                          : "bg-slate-950/40 text-slate-400 border-slate-900 hover:text-red-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      Bloklanganlar ({users.filter(u => u.status === "blocked").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("restricted")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                        statusFilter === "restricted" 
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30" 
                          : "bg-slate-950/40 text-slate-400 border-slate-900 hover:text-amber-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Cheklanganlar ({users.filter(u => u.status === "restricted").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("online")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                        statusFilter === "online" 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-slate-950/40 text-slate-400 border-slate-900 hover:text-emerald-400"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Faol onlayn ({users.filter(u => u.isOnline).length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-semibold bg-slate-950/20">
                        <th className="p-3">Foydalanuvchi</th>
                        <th className="p-3">Foydalanuvchi nomi</th>
                        <th className="p-3">Holati</th>
                        <th className="p-3">Ro'yxatdan o'tdi</th>
                        <th className="p-3 text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                            Hech qanday foydalanuvchi topilmadi.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map(u => (
                          <tr 
                            key={u.id} 
                            onClick={() => setSelectedUser(u)}
                            className={`hover:bg-slate-900/30 cursor-pointer transition-colors ${selectedUser?.id === u.id ? "bg-amber-500/5" : ""}`}
                          >
                            <td className="p-3 font-medium text-white">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${u.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                                {u.name}
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 font-mono text-[11px]">@{u.username}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                u.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                u.status === "restricted" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                              }`}>
                                {u.status === "active" ? "Faol" : u.status === "restricted" ? "Cheklangan" : "Bloklangan"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              {u.status !== "active" && (
                                <button
                                  type="button"
                                  onClick={() => handleUserAction(u.id, "unblock")}
                                  className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 px-2.5 py-1 rounded-lg transition-all"
                                  title="Blokdan tezkor ochish"
                                >
                                  Blokdan ochish
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                className="text-amber-500 hover:text-amber-400 font-semibold text-[11px] bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg transition-all"
                              >
                                Ko'rish
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SESSIONS TELEMETRY */}
            {activeTab === "sessions" && (
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-semibold bg-slate-950/20">
                        <th className="p-3">Mijoz</th>
                        <th className="p-3">Device / Platform</th>
                        <th className="p-3">Browser</th>
                        <th className="p-3">Kirgan vaqti</th>
                        <th className="p-3 text-right">Session Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/10">
                          <td className="p-3 font-medium text-white flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${u.isOnline ? "bg-emerald-400" : "bg-slate-600"}`} />
                            {u.name}
                          </td>
                          <td className="p-3 text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                            {u.deviceInfo.deviceType === "Mobile" ? <Smartphone className="w-3.5 h-3.5 text-slate-400" /> : <Monitor className="w-3.5 h-3.5 text-slate-400" />}
                            {u.deviceInfo.os}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">{u.deviceInfo.browser}</td>
                          <td className="p-3 text-slate-400 text-[11px]">{new Date(u.deviceInfo.loginTime).toLocaleTimeString()}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold font-mono text-[11px]">
                            {u.isOnline ? calculateSessionDuration(u.deviceInfo.loginTime) : "Offline"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SYSTEM ACTIVITIES LOGS */}
            {activeTab === "activities" && (
              <div className="p-4 space-y-4">
                <div className="max-h-[400px] overflow-y-auto space-y-2.5 pr-2">
                  {activities.map((act) => (
                    <div key={act.id} className="p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 rounded-xl flex items-start justify-between gap-4 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white">{act.userName}</span>
                          <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded-full border border-slate-700/50">
                            {act.action}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{act.details}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(act.timestamp).toLocaleTimeString()}</span>
                        <span className="text-[8px] text-slate-500 font-mono uppercase bg-slate-900 px-1 py-0.5 rounded">{act.os}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI REVIEW SUSPICIOUS FLAGS */}
            {activeTab === "flags" && (
              <div className="p-4 space-y-4">
                {flags.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">Ayni vaqtda xavfsizlik shubhalari aniqlanmadi.</div>
                ) : (
                  <div className="space-y-3">
                    {flags.map((flag) => (
                      <div key={flag.id} className={`p-4 rounded-xl border flex flex-col md:flex-row items-start justify-between gap-4 transition-all ${
                        flag.status === "pending" ? "bg-red-500/5 border-red-500/20" : "bg-slate-900/30 border-slate-800"
                      }`}>
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white flex items-center gap-1">
                              <ShieldAlert className="w-4 h-4 text-red-500" />
                              {flag.userName}
                            </span>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full ${
                              flag.status === "pending" ? "bg-red-500/15 text-red-400" : "bg-slate-800 text-slate-400"
                            }`}>
                              {flag.status === "pending" ? "Pending Admin" : "Hal qilindi"}
                            </span>
                          </div>
                          <p className="text-slate-300 text-xs font-semibold">{flag.reason}</p>
                          <p className="text-slate-400 text-[11px]">{flag.details}</p>
                          <span className="block text-[10px] text-slate-500 font-mono mt-1">Sodir bo'lgan vaqt: {new Date(flag.timestamp).toLocaleString()}</span>
                        </div>

                        {flag.status === "pending" && (
                          <div className="flex items-center gap-2 self-end md:self-start">
                            <button
                              onClick={() => handleResolveFlag(flag.id, "resolved_cleared")}
                              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                            >
                              Tuhmat (Clear)
                            </button>
                            <button
                              onClick={() => openRestrictModal(flag.userId)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                            >
                              Cheklash
                            </button>
                            <button
                              onClick={() => handleUserAction(flag.userId, "block")}
                              className="bg-red-500 hover:bg-red-400 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all"
                            >
                              Bloklash
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CHANGE ADMINISTRATOR PASSWORD */}
            {activeTab === "password" && (
              <div className="p-6 space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-amber-500" />
                    Administrator parolini o'zgartirish
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Bu bo'lim faqat siz (administrator) uchun. Bu yerda o'z shaxsiy adminlik parolingizni yangilashingiz mumkin.
                  </p>
                </div>

                {adminPassError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                    {adminPassError}
                  </div>
                )}

                {adminPassSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                    {adminPassSuccess}
                  </div>
                )}

                <form onSubmit={handleAdminSelfChangePassword} className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amaldagi parol *</label>
                    <input
                      type="password"
                      placeholder="Hozirgi parolni kiriting"
                      value={adminCurrentPass}
                      onChange={(e) => setAdminCurrentPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Yangi parol *</label>
                    <input
                      type="password"
                      placeholder="Kamida 4 ta belgi bo'lsin"
                      value={adminNewPass}
                      onChange={(e) => setAdminNewPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Yangi parolni takrorlang *</label>
                    <input
                      type="password"
                      placeholder="Yangi parolni qayta kiriting"
                      value={adminConfirmPass}
                      onChange={(e) => setAdminConfirmPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAdminPassSaving}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-50 text-slate-950 font-extrabold text-xs py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
                  >
                    {isAdminPassSaving ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Parolni Yangilash
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Right column - user details panel */}
        <div id="user-profile-drawer" className="space-y-6">
          <div className="glass-panel-dark p-6 rounded-2xl border border-slate-800 min-h-[300px] flex flex-col justify-between">
            {selectedUser ? (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white tracking-tight">{selectedUser.name}</h2>
                    <span className={`w-2.5 h-2.5 rounded-full ${selectedUser.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                  </div>
                  <p className="text-slate-400 text-xs mt-1 font-mono">@{selectedUser.username}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Holati:</span>
                    <span className={`font-semibold ${
                      selectedUser.status === "active" ? "text-emerald-400" : selectedUser.status === "restricted" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {selectedUser.status === "active" ? "Faol" : selectedUser.status === "restricted" ? "Cheklangan" : "Bloklangan"}
                    </span>
                  </div>
                  {selectedUser.restrictionReason && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] leading-relaxed">
                      <strong>Cheklov sababi:</strong> {selectedUser.restrictionReason}
                    </div>
                  )}
                  {selectedUser.notes && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 text-slate-300 rounded-xl text-[10px] leading-relaxed">
                      <strong>Eslatma:</strong> {selectedUser.notes}
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Yaratilgan:</span>
                    <span className="text-slate-200">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Oxirgi faollik:</span>
                    <span className="text-slate-200">{new Date(selectedUser.lastActive).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Oxirgi kirish:</span>
                    <span className="text-slate-200">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : "Mavjud emas"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Device Platform:</span>
                    <span className="text-slate-200">{selectedUser.deviceInfo.os}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Yuklanganlar:</span>
                    <span className="text-slate-200 font-bold">
                      {activities.filter(a => a.userId === selectedUser.id && a.action === "Upload text").length} darslik
                    </span>
                  </div>
                </div>

                {/* Operations Commands */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Boshqaruv buyruqlari</h3>
                  
                  {/* Account detail edits */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setEditUsername(selectedUser.username);
                        setEditName(selectedUser.name);
                        setEditNotes(selectedUser.notes || "");
                        setEditError("");
                        setShowEditModal(true);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-2.5 rounded-lg transition-all text-center"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => {
                        setEditPassword("");
                        setPasswordError("");
                        setPasswordSuccess("");
                        setShowPasswordModal(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-bold text-xs py-2 px-2.5 rounded-lg transition-all text-center"
                    >
                      Parol o'zgartirish
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {selectedUser.status !== "active" ? (
                      <button
                        onClick={() => handleUserAction(selectedUser.id, "unblock")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1 col-span-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Aktivlashtirish
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openRestrictModal(selectedUser.id)}
                          className="bg-amber-500/15 hover:bg-amber-500/35 border border-amber-500/20 text-amber-400 font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Slash className="w-3.5 h-3.5" />
                          Cheklash
                        </button>
                        <button
                          onClick={() => handleUserAction(selectedUser.id, "block")}
                          className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/20 text-red-400 font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Bloklash
                        </button>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Haqiqatan ham ushbu foydalanuvchini butunlay o'chirib tashlamoqchimisiz?")) {
                        handleUserAction(selectedUser.id, "delete");
                      }
                    }}
                    className="w-full bg-slate-900 hover:bg-red-500 hover:text-white border border-slate-800 text-slate-400 font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hisobni o'chirish (Delete)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs py-12">
                <Shield className="w-12 h-12 text-slate-700 mb-3" />
                <p className="font-semibold text-slate-400">Boshqarish uchun foydalanuvchini tanlang</p>
                <p className="text-[10px] text-slate-600 mt-1">Foydalanuvchilar jadvalidan istalgan qatorni bosing.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RESTRICTION MODAL */}
      {showRestrictModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-dark max-w-sm w-full p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Foydalanishni vaqtincha cheklash
            </h3>
            <p className="text-slate-400 text-xs">Ushbu foydalanuvchining hisobi uchun tushunarli cheklov sababini ko'rsating:</p>
            <textarea
              placeholder="Masalan: AI tizimlaridan juda tez foydalanish aniqlandi..."
              value={restrictReason}
              onChange={(e) => setRestrictReason(e.target.value)}
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRestrictModal(false)}
                className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
              >
                Bekor qilish
              </button>
              <button
                onClick={submitRestriction}
                disabled={!restrictReason}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:cursor-not-allowed text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-dark max-w-md w-full p-6 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Yangi foydalanuvchi hisobini yaratish
            </h3>
            
            {createError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {createError}
              </div>
            )}
            {createSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {createSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Foydalanuvchi nomi *</label>
                  <button
                    type="button"
                    onClick={() => setNewUsername(generateRandomUsername())}
                    className="text-[10px] text-amber-500 hover:underline font-semibold"
                  >
                    Tasodifiy yaratish
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Masalan: umid_90"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Parol *</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[10px] text-amber-500 hover:underline font-semibold"
                  >
                    Tasodifiy yaratish
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Xavfsiz parol kiriting"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Foydalanuvchining To'liq ismi (Ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Masalan: Umidjon Nematov"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Eslatma (Ixtiyoriy)</label>
                <textarea
                  placeholder="Foydalanuvchi haqida izohlar..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full h-16 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER DETAILS MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-dark max-w-sm w-full p-6 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Foydalanuvchini tahrirlash
            </h3>

            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Foydalanuvchi nomi *</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">To'liq ismi</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Eslatma</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel-dark max-w-sm w-full p-6 rounded-2xl border border-slate-800 space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Parolni o'zgartirish
            </h3>

            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Yangi xavfsiz parol *</label>
                  <button
                    type="button"
                    onClick={() => setEditPassword(generateRandomPassword())}
                    className="text-[10px] text-amber-500 hover:underline font-semibold"
                  >
                    Tasodifiy yaratish
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Yangi parol kiriting"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-all"
                >
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
