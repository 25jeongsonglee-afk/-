import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserRole } from '../types';
import { 
  googleSignIn, 
  userLogout, 
  isFirebaseActive, 
  saveCustomFirebaseConfig, 
  getCustomFirebaseConfig,
  customUserLogin
} from '../firebase';
import { LogIn, LogOut, Check, X, ShieldAlert, Settings, RefreshCw, Mail, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import meisterLogo from '../assets/images/meister_logo_1781278274851.jpg';

interface AuthModalProps {
  onAuthChange: (user: User | null) => void;
  currentUser: User | null;
}

export default function AuthModal({ onAuthChange, currentUser }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState<UserRole>('student');
  
  const [showConfig, setShowConfig] = useState(false);
  const [configText, setConfigText] = useState('');
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  // Password state for representative admin (25jeongsonglee@dgmeister.hs.kr)
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Progressive logging states as requested
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [teacherSecret, setTeacherSecret] = useState('');
  const [googleTeacherSecret, setGoogleTeacherSecret] = useState('');

  useEffect(() => {
    const saved = getCustomFirebaseConfig();
    if (saved) {
      setConfigText(JSON.stringify(saved, null, 2));
    }
  }, []);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim()) {
      setErrorMsg('로그인 이메일 주소를 정확히 기입하여 주세요.');
      return;
    }
    
    const emailLower = emailInput.trim().toLowerCase();

    // Step 1: If submitting at Step 1, switch to entering Name etc.
    if (formStep === 1) {
      setFormStep(2);
      setErrorMsg('');
      return;
    }

    // Step 2 submissions
    const isAdminEmail = emailLower === '25jeongsonglee@dgmeister.hs.kr';

    if (isAdminEmail) {
      if (adminPasswordInput !== 'kaidou634@') {
        setErrorMsg('대표관리자 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
        return;
      }
    } else {
      if (!nameInput.trim()) {
        setErrorMsg('성함(이름)을 기입하여 주세요.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Determine role based on secret input
      let finalRole: UserRole = 'student';
      let finalName = nameInput.trim();

      if (isAdminEmail) {
        finalRole = 'admin';
        finalName = '정송이 (2학년)';
      } else {
        const secretClean = teacherSecret.trim().toLowerCase();
        if (secretClean === 'meister') {
          finalRole = 'teacher';
          finalName = `${nameInput.trim()}선생님`;
        } else {
          finalRole = 'student';
          finalName = nameInput.trim();
        }
      }

      const user = await customUserLogin(
        emailInput.trim(), 
        finalRole, 
        undefined, 
        finalName
      );
      onAuthChange(user);
      setSuccessMsg(`성공적으로 로그인되었습니다.`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setAdminPasswordInput('');
        setTeacherSecret('');
        setFormStep(1);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('로그인 처리 중 오류 발생: 로그인 연동에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    // 15-second safety timeout to escape infinite loading under iframe/sandbox/popup blocker constraints
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setErrorMsg('구글 로그인 응답이 지연되고 있습니다. 브라우저의 [팝업 차단해제]를 클릭하여 팝업창을 허용해주시거나, 하단의 [이메일 정보로 임시 로그인] 버튼을 이용하여 접속해주세요.');
    }, 15000);

    try {
      const user = await googleSignIn(googleTeacherSecret);
      clearTimeout(timeoutId);
      onAuthChange(user);
      setSuccessMsg('구글 계정으로 성공적으로 로그인되었습니다.');
      // Auto-reload to refresh headers and states nicely after successful login
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setGoogleTeacherSecret('');
      }, 1000);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error(err);
      setErrorMsg('구글 로그인 시도 실패. 팝업이 차단되었는지 확인해주시거나, 구글 Firebase 콘솔의 Authentication 메뉴에서 Google Provider(제공업체)가 활성화되어 있는지 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!configText.trim()) {
        saveCustomFirebaseConfig(null);
        return;
      }
      const parsed = JSON.parse(configText);
      saveCustomFirebaseConfig(parsed);
    } catch (err) {
      setErrorMsg('올바른 JSON 형식이 아닙니다. Firebase 웹 앱 프로젝트 사본을 정확히 기입하여 주세요.');
    }
  };

  const resetConfig = () => {
    saveCustomFirebaseConfig(null);
  };

  const handleLogout = async () => {
    await userLogout();
    onAuthChange(null);
  };

  const isFBActive = isFirebaseActive();

  return (
    <div className="relative">
      {currentUser ? (
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] text-[#D9A441] font-mono tracking-wider uppercase font-bold">
              {currentUser.role === 'admin' ? '편집장 (EDITOR-IN-CHIEF)' : currentUser.role === 'teacher' ? '지도교사 (ADVISOR)' : '학생기자단 / 독자'}
            </span>
            <span className="text-[9.5px] font-semibold text-slate-400 font-mono">
              {currentUser.email}
            </span>
            <span className="text-sm font-bold text-slate-800">
              {currentUser.name} 님
            </span>
          </div>
          <button
            onClick={handleLogout}
            id="btn-logout"
            className="flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl border border-[rgba(217,164,65,0.3)] shadow-md transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-[#D9A441]" />
            <span>로그아웃</span>
          </button>
        </div>
      ) : (
        <button
          onClick={() => {
            setIsOpen(true);
            setErrorMsg('');
            setSuccessMsg('');
            setFormStep(1);
            setTeacherSecret('');
            setGoogleTeacherSecret('');
            setNameInput('');
            setEmailInput('');
            setAdminPasswordInput('');
          }}
          id="btn-login-open"
          className="flex items-center gap-2 bg-[#1E3A5F] text-white hover:bg-[#162c4a] text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md border border-[#D9A441]/30 transition-all cursor-pointer"
        >
          <LogIn className="h-4 w-4 text-[#D9A441]" animate-pulse="true" />
          <span>구글 로그인 / 독자 참여</span>
        </button>
      )}

      {/* Modal Backdrop and Box */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-8 max-w-md w-full relative max-h-[92vh] overflow-y-auto custom-scrollbar"
                id="auth-modal-content"
              >
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  id="btn-close-modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="text-center mb-6 flex flex-col items-center">
                  <div className="h-14 w-14 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center p-1 mb-3">
                    <img 
                      id="img-auth-logo"
                      src={meisterLogo} 
                      alt="대구일마이스터고 로고" 
                      className="h-full w-full object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                  <span className="text-[10px] text-[#D9A441] font-mono tracking-widest uppercase font-black font-semibold">DAEGU IL MEISTER</span>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">월간 사람책 로그인</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    구글(Google) 계정 혹은 본인의 이메일을 이용하여 간편하게 로그인하세요.
                  </p>
                  <div className="mt-3 text-[10.5px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg py-1.5 px-3 inline-block font-semibold">
                    🗝️ 이메일 간편 연동 및 역할 맞춤형 로그인
                  </div>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-xs rounded-r-lg flex items-start gap-2 text-left">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 text-xs rounded-r-lg flex items-start gap-2 text-left">
                    <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <span className="font-medium">{successMsg}</span>
                  </div>
                )}

                <div className="space-y-4 py-2">
                  {isFBActive && !useLocalFallback ? (
                    <div className="space-y-3.5">
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          🗝️ 선택비밀번호 (교직원 구글 로그인 전용)
                        </label>
                        <input
                          type="password"
                          value={googleTeacherSecret}
                          onChange={(e) => setGoogleTeacherSecret(e.target.value)}
                          placeholder="구글 로그인 예정인 선생님이신 경우 기입하세요"
                          className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F] transition-all font-mono"
                        />
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          💡 비밀번호를 적지 않거나 건너뛰면 기본 <strong>학생 / 독자 권한</strong>으로 로그인됩니다.
                          <br />
                          💡 <strong>&apos;meister&apos;</strong>를 적으시면 <strong className="text-orange-600 font-bold">교직원 권한</strong> 및 <strong className="text-orange-600 font-bold">&apos;***선생님&apos;</strong> 호칭으로 자동 변환됩니다.
                        </p>
                      </div>

                      <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer disabled:opacity-50 border border-slate-700 font-sans"
                        id="btn-google-auth"
                      >
                        <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                          <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.01 0 12 0 7.35 0 3.32 2.67 1.33 6.56l3.86 3C6.12 7.02 8.85 5.04 12 5.04z" />
                          <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.48c-.28 1.47-1.11 2.71-2.35 3.55l3.64 2.83c2.13-1.97 3.72-4.87 3.72-8.54z" />
                          <path fill="#FBBC05" d="M5.19 14.56c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.33 6.94C.48 8.62 0 10.5 0 12.5s.48 3.88 1.33 5.56l3.86-3z" />
                          <path fill="#34A853" d="M12 18.96c-3.15 0-5.88-1.98-6.81-4.92l-3.86 3C3.32 21.13 7.35 24 12 24c3.24 0 5.95-1.08 7.93-2.91l-3.64-2.83c-1.11.75-2.52 1.3-4.29 1.3z" />
                        </svg>
                        <span>{loading ? '인증 처리하는 중...' : 'Google 계정으로 로그인'}</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUseLocalFallback(true);
                            setErrorMsg('');
                          }}
                          className="text-[11px] text-indigo-650 hover:text-indigo-800 hover:underline font-bold bg-indigo-50 border border-indigo-100 py-2 px-4 rounded-xl cursor-pointer w-full transition-all"
                        >
                          🔑 구글 로그인이 안 되시나요? (이메일 정보로 우회 로그인)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCustomLogin} className="space-y-4 text-left">
                      <div className="bg-[#1E3A5F]/5 border border-[#1E3A5F]/10 p-3 rounded-xl text-[11px] text-[#1E3A5F] leading-relaxed font-semibold">
                        ℹ️ {isFBActive ? '구글 팝업 인증 오류 시 사용하는 임시 로그인 양식입니다. 본인의 이메일 주소와 실명을 입력해주세요.' : '현재 체험용 빌드 환경입니다. 본인의 이메일을 입력하시고 다음 단계로 이동해주세요.'}
                      </div>

                      {formStep === 1 ? (
                        /* Step 1: Email Input Only */
                        <div className="space-y-4 animate-fade-in">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              로그인 이메일 주소
                            </label>
                            <input
                              type="email"
                              required
                              value={emailInput}
                              onChange={(e) => {
                                setEmailInput(e.target.value);
                                const val = e.target.value.trim().toLowerCase();
                                if (val !== '25jeongsonglee@dgmeister.hs.kr') {
                                  setAdminPasswordInput('');
                                }
                              }}
                              placeholder="본인의 이메일 주소를 입력해 주세요"
                              className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3.5 px-4 bg-[#1E3A5F] hover:bg-[#152e4f] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer border border-[#1E3A5F]/30"
                          >
                            <span>다음 단계로 이동 (성함 입력) →</span>
                          </button>
                        </div>
                      ) : (
                        /* Step 2: Name Input & Optional Secret Password Input */
                        <div className="space-y-4 animate-fade-in">
                          <button
                            type="button"
                            onClick={() => {
                              setFormStep(1);
                              setErrorMsg('');
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 mb-2 underline cursor-pointer"
                          >
                            ← 이메일 재설정 ({emailInput})
                          </button>

                          {emailInput.trim().toLowerCase() === '25jeongsonglee@dgmeister.hs.kr' ? (
                            /* Admin Password Area */
                            <div className="space-y-3 p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-left">
                              <label className="block text-[11px] font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                                🔒 대표관리자 비밀번호 입력
                              </label>
                              <input
                                type="password"
                                required
                                value={adminPasswordInput}
                                onChange={(e) => setAdminPasswordInput(e.target.value)}
                                placeholder="관리자 비밀번호 입력"
                                className="w-full text-xs py-2.5 px-3 bg-white border border-emerald-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-mono tracking-wide"
                              />
                              <p className="text-[10px] text-emerald-800 leading-relaxed font-sans">
                                💡 대표관리자 계정은 전용 관리자 비밀번호를 정확히 입력하셔야 안전하게 로그인이 활성화됩니다.
                              </p>
                            </div>
                          ) : (
                            /* Custom User Name & Teacher Secret Input */
                            <div className="space-y-4">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                                  <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                  본인 성함 (실명)
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={nameInput}
                                  onChange={(e) => setNameInput(e.target.value)}
                                  placeholder="본인의 실제 성명을 적어주세요"
                                  className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] transition-all"
                                />
                              </div>

                              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2">
                                <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                  🗝️ 선택비밀번호 (교직원 전용)
                                </label>
                                <input
                                  type="password"
                                  value={teacherSecret}
                                  onChange={(e) => setTeacherSecret(e.target.value)}
                                  placeholder="선생님이신 경우 여기에 비밀번호를 기입하세요"
                                  className="w-full text-xs py-2 px-3 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F] transition-all font-mono"
                                />
                                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                  💡 비밀번호를 적지 않거나 건너뛰면 <strong className="text-[#1E3A5F]">일반 학생 권한</strong>으로 로그인됩니다.
                                  <br />
                                  💡 <strong>&apos;meister&apos;</strong>를 입력하시는 경우 <strong className="text-orange-600 font-bold">교직원 권한</strong> 및 <strong className="text-orange-600 font-bold">&apos;***선생님&apos;</strong>으로 호칭이 설정됩니다.
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 pt-2">
                            <button
                              type="submit"
                              disabled={loading}
                              className="w-full py-3.5 px-4 bg-[#1E3A5F] hover:bg-[#152e4f] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 shadow-md cursor-pointer disabled:opacity-50 border border-[#1E3A5F]/30"
                            >
                              <span>{loading ? '인증 연동하는 중...' : '입력 완료 및 이메일 로그인'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {isFBActive && (
                        <div className="flex flex-col gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setUseLocalFallback(false);
                              setErrorMsg('');
                            }}
                            className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition-all text-center cursor-pointer border border-slate-200"
                          >
                            ← 진짜 Google 로그인 화면으로 돌아가기
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  <p className="text-[10.5px] text-center text-slate-500 mt-2 leading-relaxed">
                    {isFBActive && !useLocalFallback 
                      ? '✓ 대구일마이스터고 구글 워크스페이스 계정 자동 연동' 
                      : '✓ 입력하신 본인의 구글 이메일 정보를 통해 본인 아이디로 로그인 처리됩니다.'}
                  </p>
                </div>

                {/* Developer Firebase Section */}
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className="text-[10px] text-slate-400 hover:text-[#1E3A5F] flex items-center gap-1 mx-auto transition-colors focus:outline-none cursor-pointer"
                  >
                    <Settings className="h-3 w-3 animate-spin-slow" />
                    <span>{showConfig ? "설정 닫기" : "개발 및 라이브 Firebase 연동 세팅"}</span>
                  </button>

                  <AnimatePresence>
                    {showConfig && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleConfigSave}
                        className="mt-3 space-y-2.5 overflow-hidden text-left bg-slate-50 p-3.5 rounded-xl border border-slate-150"
                      >
                        <label className="block text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">
                          Firebase 콘솔 웹 구성 JSON
                        </label>
                        <textarea
                          rows={4}
                          value={configText}
                          onChange={(e) => setConfigText(e.target.value)}
                          placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "..."\n}`}
                          className="w-full text-[10px] font-mono p-2 bg-white rounded border border-slate-200 focus:outline-[#1E3A5F] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] rounded transition-all cursor-pointer text-center"
                          >
                            설정 등록 및 재실행
                          </button>
                          {getCustomFirebaseConfig() && (
                            <button
                              type="button"
                              onClick={resetConfig}
                              className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] rounded border border-rose-200 transition-all cursor-pointer flex items-center justify-center"
                              title="설정 초기화"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          * 본인 소유의 Firebase 프로젝트에서 받은 Web App Key를 붙여넣으시면, 실제 구글 Google Popup Auth 및 클라우드 실시간 파이어스토어 데이터베이스를 완벽하게 사용하실 수 있게 됩니다.
                        </p>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-5 text-center">
                  <span className="text-[9px] text-slate-400 font-mono tracking-wide">DAEGU IL MEISTER HIGH SCHOOL PORTAL</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
