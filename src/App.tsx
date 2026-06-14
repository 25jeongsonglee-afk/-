import React, { useState, useEffect } from 'react';
import { User, Newspaper, InterviewReservation, Inquiry, Notice } from './types';
import { 
  getNewspapers, getReservations, getInquiries, getNotices, 
  currentSimulatedUser, deleteNotice
} from './firebase';
import AuthModal from './components/AuthModal';
import Calendar from './components/Calendar';
import NewspaperView from './components/NewspaperView';
import InterviewRequest from './components/InterviewRequest';
import InquiryView from './components/InquiryView';
import NoticeWriteView from './components/NoticeWriteView';
import AdminPanel from './components/AdminPanel';
import meisterLogo from './assets/images/meister_logo_1781278274851.jpg';
import blueFlowers from './assets/images/blue_flowers_1781416121351.jpg';
import MeisterLogo from './components/MeisterLogo';

import { 
  BookOpen, Calendar as CalendarIcon, MessageSquare, Shield, HelpCircle, 
  Menu, X, ChevronRight, Download, GraduationCap, Users, Camera, Info, 
  FileText, Award, MapPin, Sparkles, Radio, Newspaper as NewsIcon, Trash2,
  Copy, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newspapers, setNewspapers] = useState<Newspaper[]>([]);
  const [reservations, setReservations] = useState<InterviewReservation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'intro' | 'newspapers' | 'interviews' | 'inquiries' | 'notices' | 'admin'>('home');
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  // PWA (Progressive Web App) Installation States & Trigger Hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent standard browser direct minibar banner
      e.preventDefault();
      // Store the event so it can be manually called
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      setShowInstallModal(false);
      console.log("월간 사람책 PWA 앱이 정상적으로 설치되었습니다.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check on launch if the app already runs inside standalone (iOS / Android Home Screen)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User install request choice outcome: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // If there's no deferredPrompt (such as iOS Safari or nested app browser or inside iframe), always prompt our custom visual install dialog
      setShowInstallModal(true);
    }
  };

  const handleDownloadApp = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>월간 사람책 대구일마이스터고 앱 실행기</title>
  <style>
    body {
      margin: 0; padding: 0;
      background-color: #0f172a;
      color: #cbd5e1;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 100vh; text-align: center;
    }
    .card {
      max-width: 400px; width: 85%; padding: 32px; background: #1e293b; border: 1px solid #334155; border-radius: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
    }
    .logo {
      width: 96px; height: 96px; border-radius: 24px; margin-bottom: 24px; background: white; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
      display: inline-flex; align-items: center; justify-content: center; margin-left: auto; margin-right: auto;
    }
    h1 { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-sizing: border-box;
      padding: 14px 28px; background: #FBBF24; color: #020617; font-weight: 800; font-size: 14px;
      text-decoration: none; border-radius: 14px; transition: all 0.2s;
    }
    .btn:hover { background: #F59E0B; transform: scale(1.02); }
  </style>
  <script>
    // Automating redirect
    setTimeout(() => {
      window.location.href = "https://ais-pre-zo56alaym5tjyzhu4dalh6-572787846781.asia-northeast1.run.app";
    }, 1500);
  </script>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="20" fill="#1E3A5F"/>
        <path d="M25,35 Q50,25 75,35 V75 Q50,65 25,75 Z" fill="none" stroke="#FBBF24" stroke-width="6" stroke-linecap="round"/>
        <path d="M50,30 V70" stroke="#FBBF24" stroke-width="4"/>
        <circle cx="50" cy="50" r="4" fill="#FBBF24"/>
      </svg>
    </div>
    <h1>월간 사람책</h1>
    <p>대구일마이스터고 사람책 신문 플랫폼<br>전용 모바일/PC 로컬 실행기를 기동하고 있습니다...</p>
    <a href="https://ais-pre-zo56alaym5tjyzhu4dalh6-572787846781.asia-northeast1.run.app" class="btn">
      <span>지금 수동 입장하기 ➡</span>
    </a>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "월간_사람책_바로가기_앱.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("https://ais-pre-zo56alaym5tjyzhu4dalh6-572787846781.asia-northeast1.run.app").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Load all data on mount
  const loadAllData = async () => {
    try {
      const [papersData, resData, inqData, noticesData] = await Promise.all([
        getNewspapers(),
        getReservations(),
        getInquiries(),
        getNotices()
      ]);
      setNewspapers(papersData);
      setReservations(resData);
      setInquiries(inqData);
      setNotices(noticesData);
    } catch (e) {
      console.error("Could not load database records:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check simulated auth session
    if (currentSimulatedUser) {
      setCurrentUser(currentSimulatedUser as User);
    }
    loadAllData();
  }, []);

  const handleAuthChange = (user: User | null) => {
    setCurrentUser(user);
    loadAllData();
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) return;
    try {
      await deleteNotice(id);
      const updated = await getNotices();
      setNotices(updated);
    } catch (e) {
      console.error("공지사항 삭제 실패:", e);
    }
  };

  const handleOpenLogin = () => {
    // Easy click to auto-open login modal trigger
    const loginBtn = document.getElementById('btn-login-open');
    if (loginBtn) {
      loginBtn.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBCF]/10 text-slate-800">
      
      {/* 1. MAIN NAVIGATION HEADER */}
      <header className="sticky top-0 z-45 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo / Brand Details */}
            <div 
              onClick={() => setActiveTab('home')} 
              className="flex items-center gap-3 cursor-pointer group shrink-0"
            >
              <div className="h-16 w-16 bg-white rounded-2xl p-1 flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-105 transition-all">
                <MeisterLogo className="h-full w-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-lg tracking-tight text-[#1E3A5F]">월간 사람책</span>
                  <span className="text-[10px] bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30 font-bold px-1.5 py-0.5 rounded">마이스터고</span>
                </div>
                <span className="text-[10px] text-slate-400 block font-semibold">대구일마이스터고등학교 신문</span>
              </div>
            </div>

            {/* Desktop Nav Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { id: 'home', label: '홈' },
                { id: 'intro', label: '사람책 소개' },
                { id: 'newspapers', label: '대구일마이스터고 신문' },
                { id: 'interviews', label: '인터뷰 신청 및 일정' },
                { id: 'inquiries', label: '문의하기' },
                ...(currentUser?.role === 'admin' || currentUser?.role === 'librarian' ? [{ id: 'notices', label: '소식/공지 등록 📢' }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-[#1E3A5F] text-white shadow-sm' 
                      : 'text-slate-600 hover:text-[#1E3A5F] hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              {/* Secret Admin panel access tab */}
              {(currentUser?.role === 'admin' || currentUser?.role === 'librarian') && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'admin' 
                      ? 'bg-[#D9A441] text-white shadow-sm' 
                      : 'text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>관리센터</span>
                </button>
              )}
            </nav>

            {/* Account Controls & PWA Install */}
            <div className="hidden sm:flex items-center gap-3">
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer border border-amber-500 animate-pulse"
                  title="로그인 없이 홈 화면에 바로 설치"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>앱 설치하기</span>
                </button>
              )}
              {isInstalled && (
                <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-550/10 text-emerald-700 border border-emerald-500/20 font-bold text-[10.5px] rounded-xl select-none">
                  <span>앱 모드로 실행 중</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </span>
              )}
              <AuthModal onAuthChange={handleAuthChange} currentUser={currentUser} />
            </div>

            {/* Mobile Nav Trigger */}
            <div className="flex items-center gap-2 lg:hidden">
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="flex items-center gap-1 p-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-[10px] font-bold shadow-xs transition-all animate-pulse"
                  title="월간 사람책 앱 설치"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>설치</span>
                </button>
              )}
              <div className="sm:hidden">
                <AuthModal onAuthChange={handleAuthChange} currentUser={currentUser} />
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-100 bg-white"
            >
              <div className="px-4 py-3 space-y-1">
                {[
                  { id: 'home', label: '홈' },
                  { id: 'intro', label: '사람책 소개' },
                  { id: 'newspapers', label: '대구일마이스터고 신문' },
                  { id: 'interviews', label: '인터뷰 신청 및 일정' },
                  { id: 'inquiries', label: '문의하기' },
                  ...(currentUser?.role === 'admin' || currentUser?.role === 'librarian' ? [{ id: 'notices', label: '소식/공지 등록 📢' }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
                    className={`block w-full text-left text-xs font-bold px-4 py-3 rounded-lg ${
                      activeTab === tab.id ? 'bg-[#1E3A5F] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
                
                {(currentUser?.role === 'admin' || currentUser?.role === 'librarian') && (
                  <button
                    onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                    className={`block w-full text-left text-xs font-bold px-4 py-3 rounded-lg text-rose-650 ${
                      activeTab === 'admin' ? 'bg-[#D9A441] text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    💡 [관리자] 시스템 예약/문의 통합관리
                  </button>
                )}

                {!isInstalled && (
                  <button
                    type="button"
                    onClick={() => { handleInstallApp(); setMobileMenuOpen(false); }}
                    className="block w-full text-left text-xs font-extrabold px-4 py-3 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg shadow-xs flex items-center justify-between border border-amber-500 cursor-pointer transition-all animate-pulse"
                  >
                    <span>✨ 홈 화면에 "월간 사람책" 앱 설치 (로그인 불필요)</span>
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MAIN HUB CANVAS CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-10 w-10 border-4 border-[#1E3A5F] border-t-[#D9A441] rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-semibold mt-4">데이터 동기화 및 보안 규칙 로딩 중...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* VIEW A: HOME DASHBOARD */}
            {activeTab === 'home' && (
              <motion.div
                key="home-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                
                {/* HERO BANNER SECTION (Structured visual showcase) */}
                <section className="bg-gradient-to-br from-[#1E3A5F] via-[#1a3455] to-[#12243d] text-white rounded-3xl overflow-hidden shadow-2xl relative border-b-4 border-[#D9A441]">
                  
                  {/* Grid Layout decoration */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200 via-sky-300 to-slate-900 pointer-events-none" />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 md:p-12 relative z-10 items-center">
                    
                    {/* Left Column Text details */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold tracking-wider text-[#D9A441]">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>대구일마이스터고 대표 인터뷰 플랫폼</span>
                      </div>
                      
                      <div className="space-y-3">
                        <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-sans">
                          사람책 <br />
                          <span className="text-[#D9A441] font-serif italic font-medium">대구일마이스터고의 이야기를 담다</span>
                        </h1>
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <button
                          onClick={() => setActiveTab('newspapers')}
                          className="px-5 py-3 bg-[#D9A441] hover:bg-[#c49234] text-white font-bold text-xs rounded-xl shadow-lg shadow-black/10 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="h-4.5 w-4.5" />
                          <span>최신 발행 신문 보기</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column visual preview card */}
                    <div className="lg:col-span-5 hidden lg:block">
                      <div className="relative p-2 bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xs">
                        <img 
                          src={blueFlowers} 
                          alt="Blue Delphinium Flowers"
                          referrerPolicy="no-referrer"
                          className="rounded-xl w-full h-64 object-cover filter brightness-95"
                        />
                      </div>
                    </div>

                  </div>
                </section>

                {/* QUICK NAV PANELS CARD (Bento grid style) */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: '인터뷰 신청', desc: '의제를 신문에 제보하고 신청해보세요', icon: Radio, target: 'interviews', bg: 'bg-[#1E3A5F]/5 border-[#1E3A5F]/10 text-[#1E3A5F]' },
                    { title: '인터뷰 일정표', desc: '이번달 예약 스케줄을 확인해보세요', icon: CalendarIcon, target: 'interviews', bg: 'bg-[#D9A441]/5 border-[#D9A441]/10 text-amber-800' },
                    { title: '신문 보존회', desc: '월간 마이스터고 신문 데이터 모음', icon: NewsIcon, target: 'newspapers', bg: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
                    { title: '건의 접수실', desc: '언제든 문의사항을 남겨주세요', icon: MessageSquare, target: 'inquiries', bg: 'bg-indigo-50 border-indigo-150 text-indigo-800' }
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveTab(p.target as any)}
                      className={`p-4 border rounded-2xl cursor-pointer hover:shadow-md transition-all flex flex-col justify-between h-32 ${p.bg}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 bg-white rounded-lg shadow-xs">
                          <p.icon className="h-5 w-5" />
                        </div>
                        <ChevronRight className="h-4.5 w-4.5 opacity-60" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold">{p.title}</h4>
                        <p className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </section>

                {/* PWA INSTALLATION CORNER ACTION BOARD */}
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-[#1E3A5F]/40 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2 bg-amber-500/15 text-amber-400 text-[10px] font-bold py-0.5 rounded-full border border-amber-500/30">
                        <Sparkles className="h-3 w-3" />
                        <span>Progressive Web App (PWA) 지원</span>
                      </div>
                      <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                        <span>📱 "월간 사람책" 전용 모바일 앱으로 더 편리하게!</span>
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        브라우저 주소창이나 군더더기 없이 전체화면으로 볼 수 있으며, 홈 화면 아이콘을 통해 원본 신문지면 크게 보기 및 최신 교내 지향 아카이브를 네이티브처럼 원활하게 이용할 수 있습니다.
                      </p>
                    </div>

                    <div className="flex border-t border-slate-800 md:border-t-0 pt-4 md:pt-0 shrink-0 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {!isInstalled ? (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <button
                            onClick={handleDownloadApp}
                            className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 animate-bounce hover:scale-105"
                          >
                            <Download className="h-4 w-4 text-slate-950 animate-bounce" />
                            <span>1초 만에 앱 다운로드 (로그인 불필요)</span>
                          </button>
                          
                          <button
                            onClick={handleInstallApp}
                            className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-xs rounded-2xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>기기별 자동설치 가이드</span>
                          </button>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl flex items-center gap-2.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-emerald-400 text-xs font-bold">월간 사람책 전용 앱 모드 기동 완료</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* PRIMARY RECENT SECTIONS GRID */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Recent News / Newspapers & Interviews (Col-span 8) */}
                  <div className="lg:col-span-8 space-y-8">
                    
                    {/* Latest 3 Newspapers Block */}
                    <div>
                      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                        <h3 className="text-sm font-bold text-[#1E3A5F] flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-[#D9A441]" />
                          <span>최신 교내 신문 아카이브</span>
                        </h3>
                        <button onClick={() => setActiveTab('newspapers')} className="text-[11px] text-[#D9A441] font-bold hover:underline flex items-center gap-1 cursor-pointer">
                          <span>전체 보기</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {newspapers.slice(0, 3).map((paper) => (
                          <div 
                            key={paper.id} 
                            onClick={() => {
                              setSelectedPaperId(paper.id);
                              setActiveTab('newspapers');
                            }}
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                            title="클릭하여 지면 크게 보기 & 댓글 달기"
                          >
                            <div className="h-28 bg-slate-50 relative overflow-hidden">
                              {paper.fileDataUrl ? (
                                <img src={paper.fileDataUrl} alt={paper.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <BookOpen className="h-8 w-8" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-[#1E3A5F]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="bg-white/90 text-[#1E3A5F] px-2 py-1 rounded-lg text-[9px] font-bold shadow-xs flex items-center gap-1">
                                  <span>🔍 지면 크게 보기</span>
                                </span>
                              </div>
                              <span className="absolute top-2 left-2 bg-[#1E3A5F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                                {paper.year}년 {paper.month}월호
                              </span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <h4 className="text-[11.5px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#1E3A5F] transition-colors">{paper.title}</h4>
                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                                <span className="text-[10px] text-[#D9A441] font-bold group-hover:underline">지면 보러 가기 →</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent opening the detail view
                                    const link = document.createElement('a');
                                    link.href = paper.fileDataUrl || '#';
                                    link.download = paper.fileName || 'meister_newspaper.pdf';
                                    link.click();
                                  }}
                                  className="text-[10px] text-indigo-700 font-bold hover:underline flex items-center gap-1 cursor-pointer p-1 rounded-md hover:bg-slate-50"
                                  title="다운로드"
                                >
                                  <Download className="h-3 w-3" />
                                  <span>다운로드</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Notices Lists & Quick Form Status (Col-span 4) */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Announcement Board Section */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold text-[#1E3A5F] flex items-center gap-1">
                          📢 공지사항 및 교내 소식
                        </h4>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                          {notices.length}개
                        </span>
                      </div>

                      <div className="space-y-3 h-[240px] overflow-y-auto custom-scrollbar pr-1">
                        {notices.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8 text-center space-y-2">
                            <NewsIcon className="h-7 w-7 text-slate-300 animate-pulse" />
                            <p className="text-[11px]">등록된 공지사항이나 교내 소식이 없습니다.</p>
                          </div>
                        ) : (
                          notices.map((notice) => (
                            <div key={notice.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 hover:bg-slate-100/50 transition-colors relative group">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="text-[11.5px] font-bold text-slate-805 leading-snug">{notice.title}</h5>
                                {(currentUser?.role === 'admin' || currentUser?.role === 'teacher') && (
                                  <button
                                    onClick={() => handleDeleteNotice(notice.id)}
                                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                                    title="공지 삭제"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[10.5px] text-slate-600 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                              <div className="text-[9px] text-slate-400 font-mono text-right">
                                {new Date(notice.createdAt || Date.now()).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </section>

              </motion.div>
            )}

            {/* VIEW B: SCHOOL DESCRIPTION INTRO */}
            {activeTab === 'intro' && (
              <motion.div
                key="intro-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Intro Title */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                  <span className="text-[10px] font-bold text-[#D9A441] tracking-widest block uppercase font-mono">EDITORIAL STATEMENT</span>
                  <h3 className="text-lg font-bold text-slate-900 border-b border-indigo-50 pb-2 font-sans flex items-center gap-2">
                    <BookOpen className="h-5.5 w-5.5 text-[#1E3A5F]" />
                    <span>월간 사람책 소개</span>
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-650 font-semibold md:text-sm">
                    사람책은 대구일마이스터고 학생과 교사의 다양한 경험과 이야기를 인터뷰를 통해 기록하고 공유하는 교내 신문 플랫폼입니다.
                    우리는 단순한 정보 전달을 넘어 대구일마이스터고등학교 구성원 한 명 한 명의 가치와 성장의 역사에 메이저를 두고 그 배움의 길을 지면으로 가꾸어 나갑니다.
                  </p>
                </div>

                {/* Editorial Crew list section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider block">✍ 사람책을 만드는 사람들 (편집/기자 기획진)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { roleName: '대표학생', name: '정송이 (2학년)', desc: '월간 사람책 총괄', img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=300', icon: GraduationCap },
                      { roleName: '인터뷰 담당 학생', name: '김민준 (2학년), 남희준, 서정재 (1학년)', desc: '학우 동아리 활동, 대회 현장 취재 및 실시간 제보문 작성', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=300', icon: Users },
                      { roleName: '사진/촬영 담당 학생', name: '구대근 (2학년), 박민유 (1학년)', desc: '인터뷰 사진, 교내 행사사진 등 촬영 담당', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=300', icon: Camera },
                      { roleName: '지도교사', name: '전은경 선생님 (도서관 사서 선생님)', desc: '사람책 플랫폼 관리 및 인프라 신규 공지 조율 총책', img: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&q=80&w=300', icon: Shield }
                    ].map((crew, id) => (
                      <div key={id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                        <div className="h-40 relative">
                          <img src={crew.img} alt={crew.name} referrerPolicy="no-referrer" className="w-full h-full object-cover grayscale opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                            <span className="text-[10px] text-white bg-[#1E3A5F] px-2 py-0.5 rounded font-bold">{crew.roleName}</span>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                          <div className="space-y-1">
                            <crew.icon className="h-4.5 w-4.5 text-[#D9A441] inline-block align-sub mr-1.5" />
                            <span className="text-xs font-bold text-slate-800 inline-block">{crew.name}</span>
                            <p className="text-[10.5px] text-slate-500 leading-normal">{crew.desc}</p>
                          </div>
                          <span className="text-[9px] text-[#D9A441] font-bold block bg-[#D9A441]/5 p-1 border border-[#D9A441]/10 rounded-lg text-center">
                            대구일마 편집국 승인원
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Library Values banner card */}
                <div className="pt-2">
                  <div className="bg-indigo-50 rounded-2xl p-6 flex flex-col justify-between border border-indigo-100">
                    <div>
                      <MapPin className="h-6 w-6 text-[#1E3A5F] mb-2" />
                      <h5 className="text-sm font-bold text-[#1E3A5F]">대구일마이스터고 월간 사람책 기획및 편집 장소</h5>
                      <p className="text-[11.5px] text-indigo-700 mt-1 leading-relaxed font-semibold">
                        대구일마이스터고 본관 2층 도서관
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-4 tracking-wider">주관: 대구일마이스터고 편집국</span>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW C: NEWSPAPER MONTHLY ARCHIVE SCREEN */}
            {activeTab === 'newspapers' && (
              <motion.div
                key="newspapers-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-indigo-50 pb-2 mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <NewsIcon className="h-5 w-5 text-[#1E3A5F]" />
                    <span>월별 신문 보관소</span>
                  </h2>
                </div>
                <NewspaperView 
                  newspapers={newspapers} 
                  onRefresh={loadAllData} 
                  currentUser={currentUser} 
                  initialSelectedId={selectedPaperId}
                  onClearInitialId={() => setSelectedPaperId(null)}
                />
              </motion.div>
            )}

            {/* VIEW D: INTERVIEWS SCHEDULER & APPLICATION FORM */}
            {activeTab === 'interviews' && (
              <motion.div
                key="interviews-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-12"
              >
                {/* 1. Schedular Calendar Board */}
                <Calendar reservations={reservations} />

                {/* 2. Interview Request Forms */}
                <div className="border-t border-slate-200 pt-10">
                  <InterviewRequest 
                    currentUser={currentUser} 
                    reservations={reservations} 
                    onRefresh={loadAllData} 
                    onOpenLogin={handleOpenLogin}
                  />
                </div>
              </motion.div>
            )}

            {/* VIEW E: INQUIRIES SUBMISSIONS VIEW */}
            {activeTab === 'inquiries' && (
              <motion.div
                key="inquiries-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <InquiryView 
                  currentUser={currentUser} 
                  inquiries={inquiries} 
                  onRefresh={loadAllData} 
                />
              </motion.div>
            )}

            {/* VIEW E-2: NOTICE WRITE VIEW FOR ADMINS ONLY */}
            {activeTab === 'notices' && (
              <motion.div
                key="notices-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <NoticeWriteView 
                  currentUser={currentUser} 
                  onRefresh={loadAllData} 
                />
              </motion.div>
            )}

            {/* VIEW F: FULL ADMIN CONTROL DASHBOARD */}
            {activeTab === 'admin' && (
              <motion.div
                key="admin-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="border-b border-rose-100 pb-2 mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                    <Shield className="h-5 w-5 text-rose-600 animate-pulse" />
                    <span>월간 사람책 관리시스템</span>
                  </h2>
                  <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full font-bold">
                    등급 권한: 마이스터 총괄자(ADMIN)
                  </span>
                </div>
                <AdminPanel 
                  currentUser={currentUser} 
                  reservations={reservations} 
                  inquiries={inquiries} 
                  notices={notices} 
                  onRefresh={loadAllData} 
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* 3. CORE FOOTER INFO BLOCK */}
      <footer className="bg-[#11223F] text-slate-300 py-10 border-t border-slate-850 mt-16 text-center sm:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="h-11 w-11 rounded-xl bg-white p-1 flex items-center justify-center border border-slate-700 shadow-sm">
                  <MeisterLogo className="h-full w-full" />
                </div>
                <span className="font-serif font-bold text-lg text-white">월간 사람책</span>
              </div>
              <p className="text-[11px] text-slate-400">대구일마이스터고 학생들과 선생님들의 이야기</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400">
              <span onClick={() => setActiveTab('home')} className="hover:text-white cursor-pointer select-none">홈 바로가기</span>
              <span>•</span>
              <span onClick={() => setActiveTab('intro')} className="hover:text-white cursor-pointer select-none">사람책 소속위원</span>
              <span>•</span>
              <span onClick={() => setActiveTab('newspapers')} className="hover:text-white cursor-pointer select-none">지면 신문고</span>
              <span>•</span>
              <span onClick={() => setActiveTab('inquiries')} className="hover:text-white cursor-pointer select-none">개발문의 피드백</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10.5px] text-slate-400 font-medium leading-relaxed">
            <div className="space-y-1 text-center md:text-left">
              <p>대구일마이스터고등학교</p>
              <p>Copyright © DAEGU IL MEISTER HIGH SCHOOL. All rights reserved.</p>
            </div>
            <div className="flex items-center gap-2 text-[#D9A441] font-bold select-none text-[10px] bg-white/5 py-1.5 px-3 rounded-lg border border-white/10">
              <span>"사람을 읽고, 이야기를 기록하다."</span>
            </div>
          </div>
        </div>
      </footer>

      {/* PWA CUSTOM INSTALLATION SERVICE ASSIST MODAL */}
      <AnimatePresence>
        {showInstallModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstallModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#1E3A5F] text-white p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-amber-400/10 rounded-full blur-xl" />
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center border border-white/20 p-2 shadow-inner shrink-0">
                    <MeisterLogo className="h-full w-full" />
                  </span>
                  <div>
                    <div className="inline-flex items-center gap-1 bg-amber-400 hover:bg-amber-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs uppercase">
                      <span>로그인 필요 없음</span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-1.5">
                      <span>📱 "월간 사람책" 모바일 앱 설치</span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Steps & Tab Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
                {/* DYNAMIC PWA INTUITIVE STATUS ROW */}
                {isInIframe ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-amber-800">현재 개발용 프리뷰 모드로 시청 중</span>
                    </div>
                    <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                      구글 AI 스튜디오의 프리뷰(아이프레임 프레임) 내부에서는 브라우저 보안 규정상 <strong>1초 간편 자동 설치</strong>가 제공되지 못합니다.
                      <br />아래 단추를 눌러 <strong>전용 로컬 앱 실행기</strong>를 즉시 받으시거나, 새 창을 열어서 실행해 주세요. (가입은 필요 없습니다.)
                    </p>

                    <div className="flex flex-col gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={handleDownloadApp}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="h-4 w-4 text-slate-950 animate-bounce" />
                        <span>📥 1초 만에 앱 바로가기 파일 다운로드 받기</span>
                      </button>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
                        <input
                          type="text"
                          readOnly
                          value="https://ais-pre-zo56alaym5tjyzhu4dalh6-572787846781.asia-northeast1.run.app"
                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-600 outline-none w-full font-mono font-bold shadow-inner"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleCopyUrl}
                            className="px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-white text-[10.5px] font-bold rounded-xl transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                          >
                            {copied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                                <span>복사완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" />
                                <span>주소 복사</span>
                              </>
                            )}
                          </button>
                          <a
                            href="https://ais-pre-zo56alaym5tjyzhu4dalh6-572787846781.asia-northeast1.run.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 text-[10.5px] font-bold rounded-xl transition-all shrink-0 flex items-center justify-center gap-1 text-center shadow-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>새 창 열기</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/70 border border-[#1E3A5F]/15 rounded-2xl p-4.5 text-center space-y-3 shadow-xs font-sans">
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-extrabold text-[#1E3A5F] text-xs">초고속 원클릭 안전 다운로드</span>
                    </div>
                    <p className="text-[11px] text-slate-650 leading-relaxed font-semibold max-w-sm mx-auto">
                      아래 설치 파일 다운로드 단추를 누르면, 바탕화면이나 홈 화면 어디서든 더블클릭으로 바로 접근 가능한 <strong>초경량 로컬 실행기 파일</strong>이 다운로드됩니다!
                    </p>

                    <div className="flex flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadApp}
                        className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2 animate-bounce hover:scale-[1.01] cursor-pointer"
                      >
                        <Download className="h-5 w-5 text-slate-950 animate-bounce" />
                        <span>📥 1초 만에 앱 바로가기 파일 다운로드 (추천)</span>
                      </button>

                      {isInstallable || deferredPrompt ? (
                        <button
                          type="button"
                          onClick={handleInstallApp}
                          className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Sparkles className="h-4 w-4 text-[#1E3A5F]" />
                          <span>✨ 브라우저 내장 앱 연동 시스템 실행</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (deferredPrompt) {
                              handleInstallApp();
                            } else {
                              alert("현재 기기 맞춤형 인터페이스를 초기화하는 중입니다. 앱이 활성화되지 않는 경우 최상단 노란색 [앱 바로가기 파일 다운로드]를 통해 기기에 설치해 주시면 감사하겠습니다!");
                            }
                          }}
                          className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <span>⚙️ 브라우저 내장 앱 수동 강제 기동</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  기기별 설치 안내 가이드
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Android / Chrome Panel */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <span className="font-extrabold text-xs text-slate-800">삼성 / 안드로이드 (크롬)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed">
                        구글 크롬, 웨일, 네이버 등의 브라우저에서 편리하게 자동 설치가 지원됩니다.
                      </p>
                      
                      <ol className="text-[11px] text-slate-650 space-y-2 mt-4 list-decimal pl-4.5 font-medium">
                        <li>
                          브라우저 주소창 우측의 <strong>더보기 (⋮) 오버플로우 버튼</strong>을 터치합니다.
                        </li>
                        <li>
                          메뉴 목록 중 <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 누릅니다.
                        </li>
                        <li>
                          설치 팝업이 나타나면 <strong>'설치'</strong>를 최종 선택해주세요.
                        </li>
                      </ol>
                    </div>

                    <div className="p-2.5 bg-[#FAFBCF]/30 border border-amber-300/40 rounded-xl mt-3">
                      <p className="text-[10px] text-slate-555 leading-relaxed font-semibold">
                        💡 설치 후 휴대폰 바탕화면에 생성되는 <strong>"월간 사람책" 아이콘</strong>을 누르면 곧바로 네이티브 앱처럼 실행됩니다.
                      </p>
                    </div>
                  </div>

                  {/* iOS / iPhone Panel */}
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🍎</span>
                        <span className="font-extrabold text-xs text-slate-800">아이폰 / iOS (사파리)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed">
                        애플 정책에 따라 Safari 브라우저에서 아주 간편하게 추가 가능합니다.
                      </p>

                      <ol className="text-[11px] text-slate-650 space-y-2 mt-4 list-decimal pl-4.5 font-medium">
                        <li>
                          아이폰 화면 하단 툴바의 <strong>공유 버튼 (📤 네모 위 화살표 아이콘)</strong>을 터치합니다.
                        </li>
                        <li>
                          스마트 제어창 아래로 스크롤하여 <strong>'홈 화면에 추가'</strong> 항목을 선택합니다.
                        </li>
                        <li>
                          우측 상단의 <strong>'추가'</strong> 버튼을 눌러 확정하면 완료됩니다!
                        </li>
                      </ol>
                    </div>

                    <div className="p-2.5 bg-[#D9A441]/10 border border-[#D9A441]/15 rounded-xl mt-3">
                      <p className="text-[10px] text-amber-805 leading-relaxed font-semibold">
                        📌 주소 표시줄이나 방해 요소가 사라져 오직 꽉 찬 전체화면으로 원활히 지면 신문을 감상할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom control */}
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <span className="text-[10.5px] text-slate-400 font-semibold">
                  로그인하지 않고 설치해도 자유롭게 전체 서비스가 제공됩니다.
                </span>
                <button
                  type="button"
                  onClick={() => setShowInstallModal(false)}
                  className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#152943] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer w-full sm:w-auto text-center"
                >
                  가이드 확인 완료
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
