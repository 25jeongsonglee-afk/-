import React, { useState, useEffect } from 'react';
import { User, Newspaper, InterviewReservation, Inquiry, Notice } from './types';
import { 
  getNewspapers, getReservations, getInquiries, getNotices, 
  currentSimulatedUser 
} from './firebase';
import AuthModal from './components/AuthModal';
import Calendar from './components/Calendar';
import NewspaperView from './components/NewspaperView';
import InterviewRequest from './components/InterviewRequest';
import InquiryView from './components/InquiryView';
import AdminPanel from './components/AdminPanel';

import { 
  BookOpen, Calendar as CalendarIcon, MessageSquare, Shield, HelpCircle, 
  Menu, X, ChevronRight, Download, GraduationCap, Users, Camera, Info, 
  FileText, Award, MapPin, Sparkles, Radio, Newspaper as NewsIcon
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
  const [activeTab, setActiveTab] = useState<'home' | 'intro' | 'newspapers' | 'interviews' | 'inquiries' | 'admin'>('home');

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
              <div className="h-11 w-11 bg-[#1E3A5F] rounded-xl flex items-center justify-center border border-[#D9A441] shadow-md group-hover:scale-105 transition-all">
                <BookOpen className="h-6 w-6 text-[#D9A441]" />
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
                { id: 'inquiries', label: '문의하기' }
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
              {currentUser?.role === 'admin' && (
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

            {/* Account Controls */}
            <div className="hidden sm:flex items-center gap-3">
              <AuthModal onAuthChange={handleAuthChange} currentUser={currentUser} />
            </div>

            {/* Mobile Nav Trigger */}
            <div className="flex items-center gap-2 lg:hidden">
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
                  { id: 'inquiries', label: '문의하기' }
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
                
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }}
                    className={`block w-full text-left text-xs font-bold px-4 py-3 rounded-lg text-rose-650 ${
                      activeTab === 'admin' ? 'bg-[#D9A441] text-white' : 'hover:bg-slate-50'
                    }`}
                  >
                    💡 [관리자] 시스템 예약/문의 통합관리
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
                          src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" 
                          alt="Meister campus study"
                          className="rounded-xl w-full h-64 object-cover filter brightness-95"
                        />
                        <div className="absolute bottom-5 left-5 right-5 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
                          <span className="text-[10px] text-[#D9A441] font-bold block uppercase tracking-wider">LATEST STORIES</span>
                          <span className="text-xs font-bold block text-white mt-1">글로벌 해외 인턴십 현장의 생생한 극복담 취재 진행중</span>
                        </div>
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
                            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div className="h-28 bg-slate-50 relative overflow-hidden">
                              {paper.fileDataUrl ? (
                                <img src={paper.fileDataUrl} alt={paper.title} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <BookOpen className="h-8 w-8" />
                                </div>
                              )}
                              <span className="absolute top-2 left-2 bg-[#1E3A5F] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                {paper.year}년 {paper.month}월호
                              </span>
                            </div>
                            <div className="p-3 flex-1 flex flex-col justify-between">
                              <h4 className="text-[11.5px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#1E3A5F] transition-colors">{paper.title}</h4>
                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                                <span className="text-[9px] text-slate-400 font-mono">Size/Type: PDF</span>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = paper.fileDataUrl || '#';
                                    link.download = paper.fileName || 'meister_newspaper.pdf';
                                    link.click();
                                  }}
                                  className="text-[10px] text-indigo-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
                        <h4 className="text-xs font-bold text-[#1E3A5F]">📢 공지사항 및 교내 소식</h4>
                        <span className="text-[9px] font-mono text-slate-400">Total: 0</span>
                      </div>

                      <div className="space-y-3.5 h-40 overflow-y-auto custom-scrollbar">
                        {/* 빈칸 */}
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
                      { roleName: '인터뷰 학생', name: '김민준 (2학년), 남희준, 서정재 (1학년)', desc: '학우 동아리 활동, 대회 현장 취재 및 실시간 제보문 작성', img: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=300', icon: Users },
                      { roleName: '사진/촬영 전담', name: '구대근 (2학년), 박민유 (1학년)', desc: '인터뷰 사진, 교내 행사사진 등 촬영 담당', img: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&q=80&w=300', icon: Camera },
                      { roleName: '지도교사 및 관리자', name: '전은경 선생님 (도서관 사서 선생님)', desc: '사람책 플랫폼 관리 및 인프라 신규 공지 조율 총책', img: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&q=80&w=300', icon: Shield }
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
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="h-2 w-2 rounded-full bg-[#D9A441]" />
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

    </div>
  );
}
