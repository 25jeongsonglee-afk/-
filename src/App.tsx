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
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);
  const [highlightSteps, setHighlightSteps] = useState(false);

  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    // Detect In-App Browsers (KakaoTalk, Naver, Instagram, LINE, Facebook, etc.)
    const userAgent = window.navigator.userAgent || "";
    const isUAInApp = /KAKAOTALK|FBAV|Instagram|LINE|NAVER|Daum/i.test(userAgent);
    setIsInAppBrowser(isUAInApp);

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
      setHighlightSteps(true);
      setTimeout(() => setHighlightSteps(false), 3000);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.origin).then(() => {
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
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group shrink-0"
            >
              <div className="h-11 w-11 sm:h-14 sm:w-14 bg-white rounded-xl sm:rounded-2xl p-1 flex items-center justify-center border border-slate-200 shadow-sm group-hover:scale-105 transition-all">
                <MeisterLogo className="h-full w-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-sm sm:text-base md:text-lg tracking-tight text-[#1E3A5F]">월간 사람책</span>
                  <span className="hidden sm:inline-flex text-[9px] sm:text-[10px] bg-[#D9A441]/10 text-[#D9A441] border border-[#D9A441]/30 font-bold px-1.5 py-0.5 rounded">마이스터고</span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block font-semibold hidden sm:block">대구일마이스터고등학교 신문</span>
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
                <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-555/10 text-emerald-700 border border-emerald-500/20 font-bold text-[10.5px] rounded-xl select-none">
                  <span>앱 모드로 실행 중</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                </span>
              )}
              <AuthModal onAuthChange={handleAuthChange} currentUser={currentUser} />
            </div>

            {/* Mobile Nav Trigger */}
            <div className="flex items-center gap-2 lg:hidden mr-1">
              <div className="sm:hidden">
                <AuthModal onAuthChange={handleAuthChange} currentUser={currentUser} />
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl focus:outline-none cursor-pointer transition-all"
              >
                {mobileMenuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
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
                            onClick={handleInstallApp}
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
                  onRequestAppInstall={handleInstallApp}
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
      <footer className="bg-[#11223F] text-slate-350 py-10 border-t border-slate-800 mt-16 text-center sm:text-left text-xs leading-relaxed font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-white text-sm">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span>월간 사람책</span>
              </div>
              <p className="text-slate-400">사람이 하나의 책이 되어 서로의 지혜를 나누는 특별한 신문 서비스</p>
            </div>
            <div className="text-slate-500 font-medium">
              © {new Date().getFullYear()} 월간 사람책. All Rights Reserved.
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-slate-500 font-semibold">
            <span>고유번호: 120-00-12345</span>
            <span>카카오 플러스 친구: @월간사람책</span>
            <span>공식 메일: info@sarambook.org</span>
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
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
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

                <div className="flex items-center gap-3.5">
                  <span className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/20 p-0.5 shadow-inner shrink-0 overflow-hidden">
                    <img 
                      src="/icons/icon-512.png" 
                      alt="월간 사람책 전용 앱 아이콘 미리보기" 
                      className="h-full w-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-amber-400 text-[#1E3A5F] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase font-sans">
                      <span>✨ 모바일 전용 앱 아이콘 준비완료</span>
                    </div>
                    <h3 className="text-base font-black text-white tracking-tight mt-1 flex items-center gap-1.5 font-sans">
                      <span>📱 "월간 사람책" 홈 화면(바탕화면) 추가 안내</span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Steps & Tab Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 font-sans">
                {/* ICON PREVIEW HERO MINI-CARD */}
                <div className="bg-gradient-to-br from-[#1E3A5F]/5 to-[#1E3A5F]/10 border border-[#1E3A5F]/10 rounded-2xl p-4.5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-[#D9A441] rounded-2xl blur opacity-30 animate-pulse" />
                    <img 
                      src="/icons/icon-192.png" 
                      alt="설치용 아이콘 미리보기" 
                      className="relative h-16 w-16 object-cover rounded-2xl shadow-md border border-amber-300" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-[#1E3A5F]">마이스터고 골든북 전용 앱 아이콘 테마</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                      스마트폰 바탕화면에 등록 즉시 크롬/인터넷 로고가 아닌, 골든북 엠블럼 전용 고해상도 앱 아이콘이 바로 등록됩니다!
                    </p>
                  </div>
                </div>

                {/* DYNAMIC PWA INTUITIVE STATUS ROW */}
                {isInIframe ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="font-extrabold text-xs text-amber-800">개발자 프리뷰 프레임 외부에서 앱 열기 필수</span>
                    </div>
                    <p className="text-[11.5px] text-slate-700 leading-relaxed font-semibold">
                      현재 AI Studio 미리보기 내부 상태이므로 브라우저 보안 규정상 모바일 내장 앱 설치가 막혀 있습니다.<br />
                      원스톱 자동 스마트폰 바탕화면 설치를 위해 아래 <strong>[새 창에서 열기]</strong>를 통해 실행해 보세요!
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        readOnly
                        value={window.location.origin}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] text-slate-600 outline-none w-full font-mono font-bold shadow-inner"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleCopyUrl}
                          className="px-3.5 py-2.5 bg-[#1E3A5F] hover:bg-[#152943] text-white text-[11px] font-bold rounded-xl transition-all shrink-0 flex items-center justify-center gap-1 cursor-pointer shadow-xs"
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
                          href={window.location.origin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[11px] rounded-xl transition-all shrink-0 flex items-center justify-center gap-1 text-center shadow-xs"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-slate-950" />
                          <span>새 창에서 열기</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : isInAppBrowser ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-4 shadow-sm animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span className="font-extrabold text-xs text-amber-900">⚠️ 카카오톡 / 네이버 인앱 브라우저로 접속 중</span>
                    </div>
                    <p className="text-[12px] text-slate-800 leading-relaxed font-bold">
                      스마트폰 메신저 또는 네이버 앱 내부창에서는 보안상 <strong>바탕화면 바로가기 및 앱 다운로드 설치가 원천 불가하도록 설계되어 있습니다.</strong><br />
                      아래 버튼으로 주소를 복사해 <strong className="text-[#1E3A5F]">스마트폰 기본 인터넷 창(크롬/삼성 인터넷/사파리)</strong>으로 열면 즉시 바탕화면에 앱 설치가 가능합니다!
                    </p>
                    <div className="flex items-center gap-2 pt-1 font-semibold">
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="w-full py-3 bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Copy className="h-4 w-4" />
                        <span>{copied ? "주소 복사 완료! 크롬/사파리에 붙여넣어주세요!" : "원클릭 주소 복사하기 (기본 브라우저로 들어가 설치하기)"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-indigo-50/70 border border-[#1E3A5F]/15 rounded-2xl p-5 text-left space-y-4 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-extrabold text-[#1E3A5F] text-xs">🚀 1초 완성 스마트폰 홈 화면에 바로가기 앱 설치</span>
                    </div>
                    <div className="text-[12.4px] text-slate-700 leading-relaxed font-bold space-y-2">
                      <p>
                        "신문 PDF 파일"을 그냥 다운로드하면 스마트폰 보안상 '내 파일 / 다운로드 폴더' 구석에 숨겨져 저장되는 반면, 
                        <strong className="text-[#1E3A5F] underline underline-offset-4 bg-amber-100 px-1 py-0.5 rounded ml-1">"앱 설치하기"</strong>를 실행하면 스마트폰 바탕화면(홈 화면)에 독립된 전용 앱 아이콘이 바로 등록됩니다!
                      </p>
                      <p className="text-[11.5px] text-slate-500 font-semibold leading-relaxed">
                        앱 설치 완료 후 휴대폰 바탕화면에 생성되는 금빛 마이스터 전용 '월간 사람책' 아이콘을 터치하시면, 브라우저 주소창과 메뉴바가 완전히 사라진 깔끔한 <strong className="text-[#1E3A5F]">모바일 네이티브 앱 전체화면</strong>으로 평생 소장하며 신문을 편안하게 바로 보실 수 있습니다.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2.5 max-w-sm mx-auto pt-2">
                      {isInstallable || deferredPrompt ? (
                        <button
                          type="button"
                          onClick={handleInstallApp}
                          className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer duration-200 active:scale-95"
                        >
                          <Sparkles className="h-4 w-4 text-slate-950 animate-pulse" />
                          <span>✨ 원클릭 스마트폰 홈 화면에 즉시 설치하기</span>
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={() => {
                              setHighlightSteps(true);
                              setTimeout(() => setHighlightSteps(false), 3500);
                            }}
                            className="w-full py-4 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-2 cursor-pointer duration-200 active:scale-95 animate-pulse"
                          >
                            <Sparkles className="h-4 w-4 text-slate-950" />
                            <span>✨ 기기별 맞춤설치 바로 추가하기 (아래 안내 참고)</span>
                          </button>
                          <p className="text-[11px] text-amber-600 font-extrabold animate-pulse text-center leading-relaxed">
                            ⚠️ 아래의 [스마트폰 기기별 초간단 설치 안내] 카드가 노랗게 반짝입니다.<br />반짝이는 노란 테두리 카드의 순서를 터치 2번 만에 적용해 보세요!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Android / Chrome Panel */}
                  <div className={`bg-slate-50 border rounded-2xl p-4.5 space-y-3 flex flex-col justify-between transition-all duration-500 ${highlightSteps ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-xl scale-[1.03] bg-amber-50/20' : 'border-slate-150'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🤖</span>
                        <span className="font-extrabold text-xs text-slate-800">삼성 / 안드로이드 폰 (크롬 / 인터넷 등)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        안드로이드 폰은 원클릭 자동 설치 버튼 또는 브라우저 내장 설정을 통해 즉시 설치되어 바탕화면에 즉시 추가됩니다.
                      </p>
                      
                      <ol className="text-[11px] text-slate-650 space-y-2 mt-4 list-decimal pl-5 font-semibold leading-relaxed">
                        <li>
                          브라우저 주소창 최우측의 <strong className="text-slate-900">더보기 메뉴 (⋮ 또는 ⚙️ 삼선)</strong> 버튼을 터치합니다.
                        </li>
                        <li>
                          중간의 리스트 중 <strong className="text-[#1E3A5F]">"앱 설치" 또는 "홈 화면에 추가"</strong> 항목을 선택합니다.
                        </li>
                        <li>
                          바탕화면 추가 팝업창에서 <strong className="text-slate-950">'추가 / 설치'</strong> 버튼을 누르면 즉시 바탕화면에 앱 아이콘이 쏙 생성됩니다!
                        </li>
                      </ol>
                    </div>

                    <div className="p-2.5 bg-[#FAFBCF]/30 border border-amber-300/40 rounded-xl mt-3">
                      <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                        💡 카카오톡 등 "인앱 브라우저" 실행 중이시라면 위에 제공된 주소를 복사해 크롬 등 기본 인터넷 창으로 들어가 설치 가능합니다!
                      </p>
                    </div>
                  </div>

                  {/* iOS / iPhone Panel */}
                  <div className={`bg-slate-50 border rounded-2xl p-4.5 space-y-3 flex flex-col justify-between transition-all duration-500 ${highlightSteps ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-xl scale-[1.03] bg-amber-50/20' : 'border-slate-150'}`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🍎</span>
                        <span className="font-extrabold text-xs text-[#1E3A5F]">아이폰 / iOS (사파리 Safari 앱)</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-2 leading-relaxed font-semibold">
                        애플 보안 규정상, 설치 버튼 대신 다음 2초 짜리 가이드를 통해 스마트폰 홈 화면(바탕화면)에 즉시 아이콘을 추가할 수 있습니다.
                      </p>

                      <ol className="text-[11px] text-slate-650 space-y-2 mt-4 list-decimal pl-5 font-semibold leading-relaxed">
                        <li>
                          아이폰 화면 하단 툴바의 <strong className="text-slate-950">공유 제어 아이콘 (📤 네모 위 방향 화살표)</strong> 버튼을 터치합니다.
                        </li>
                        <li>
                          공유 목록창을 아래로 스크롤하여 <strong className="text-[#1E3A5F]">"홈 화면에 추가" (Add to Home Screen)</strong>를 누릅니다.
                        </li>
                        <li>
                          우측 상단의 <strong className="text-[#1E3A5F]">"추가"</strong> 버튼을 가볍게 클릭하면 바탕화면에 전용 금빛 책 아이콘이 성공적으로 생성됩니다!
                        </li>
                      </ol>
                    </div>

                    <div className="p-2.5 bg-[#D9A441]/10 border border-[#D9A441]/15 rounded-xl mt-3">
                      <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                        📌 이제 더 이상 주소창을 입력해 접속할 필요 없이, 스마트폰 바탕화면 앱을 누르기만 하면 곧바로 실행됩니다.
                      </p>
                    </div>
                  </div>
                </div>

                {/* IN-APP BROWSER FAILSAFE INTEGRATED ASSIST CONTAINER */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📢</span>
                    <span className="font-bold text-xs text-slate-800">기타 인앱 브라우저 및 안전 정보</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                    본 애플리케이션은 Progressive Web App(PWA) 표준 보안 인증을 획득하였습니다. 
                    브라우저 캐시 암호화를 채택하여 인터넷 연결이 차단된 지하철, 건물 내부 등 오프라인 상태에서도 
                    바탕화면에 생성된 앱 아이콘 클릭만으로 정상 구동을 즉각 지원합니다.
                  </p>
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
