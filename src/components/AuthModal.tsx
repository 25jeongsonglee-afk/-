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
import MeisterLogo from './MeisterLogo';

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
  
  const [studentNumberInput, setStudentNumberInput] = useState('');
  const [googleNewspaperSecret, setGoogleNewspaperSecret] = useState('');
  
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
    
    if (!nameInput.trim()) {
      setErrorMsg('성함(이름)을 정확히 기입하여 주세요.');
      return;
    }

    const nameClean = nameInput.trim();
    let emailClean = emailInput.trim().toLowerCase();
    if (!emailClean) {
      emailClean = `${nameClean}-${Date.now()}@dgmeister.hs.kr`;
    }

    const secretClean = teacherSecret.trim().toLowerCase();
    const isAdminEmail = emailClean === '25jeongsonglee@dgmeister.hs.kr';

    if (isAdminEmail) {
      if (adminPasswordInput !== 'kaidou634@') {
        setErrorMsg('대표관리자 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      // Determine role based on secret input
      let finalRole: UserRole = 'student';
      let finalName = nameClean;

      if (isAdminEmail) {
        finalRole = 'admin';
        finalName = nameClean || '정송이 (2학년)';
      } else {
        if (secretClean === 'meister') {
          finalRole = 'teacher';
          finalName = `${nameClean} 선생님`;
        } else if (secretClean === 'picture') {
          finalRole = 'picture_student';
          finalName = `${nameClean} (사진/촬영 담당)`;
        } else if (secretClean === 'interview') {
          finalRole = 'interview_student';
          finalName = `${nameClean} (인터뷰 담당)`;
        } else if (secretClean === 'librarian') {
          finalRole = 'librarian';
          finalName = `${nameClean} (지도교사)`;
        } else {
          finalRole = 'student';
          finalName = nameClean;
        }
      }

      const user = await customUserLogin(
        emailClean, 
        finalRole, 
        studentNumberInput.trim() || undefined, 
        finalName
      );
      onAuthChange(user);
      setSuccessMsg(`[${finalName}] 님으로 성공적으로 로그인되었습니다.`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setAdminPasswordInput('');
        setTeacherSecret('');
        setStudentNumberInput('');
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
      const finalSecret = googleNewspaperSecret.trim() || googleTeacherSecret.trim();
      const user = await googleSignIn(finalSecret);
      clearTimeout(timeoutId);
      onAuthChange(user);
      setSuccessMsg('구글 계정으로 성공적으로 로그인되었습니다.');
      // Auto-reload to refresh headers and states nicely after successful login
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg('');
        setGoogleTeacherSecret('');
        setGoogleNewspaperSecret('');
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
              {currentUser.role === 'admin' 
                ? '편집장 (EDITOR) 👑' 
                : currentUser.role === 'librarian' 
                ? '지도교사 (ADVISOR) 🛡️' 
                : currentUser.role === 'teacher' 
                ? '선생님 (TEACHER) 🎓' 
                : currentUser.role === 'interview_student' 
                ? '인터뷰 담당 학생 ✍️' 
                : currentUser.role === 'picture_student' 
                ? '사진/촬영 담당 학생 📸' 
                : '일반 학생독자 📖'}
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
            setGoogleNewspaperSecret('');
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
                  <div className="h-20 w-20 bg-white rounded-2xl p-1.5 animate-pulse border border-slate-200 shadow-md flex items-center justify-center mb-3">
                    <MeisterLogo className="h-full w-full" />
                  </div>
                  <span className="text-[10px] text-[#D9A441] font-mono tracking-widest uppercase font-black font-semibold">DAEGU IL MEISTER</span>
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight mt-0.5">월간 사람책 로그인</h3>
                  <p className="text-xs text-slate-500 mt-2">
                    구글(Google) 계정을 이용하여 안전하게 로그인하세요.
                  </p>
                  <div className="mt-3 text-[10.5px] text-[#1E3A5F] bg-blue-50 border border-blue-100 rounded-lg py-1.5 px-3 inline-block font-semibold">
                    🗝️ 신문부 전용 & 교직원 전용 구글 통합 로그인
                  </div>
                </div>

                               <div className="space-y-4 py-2 text-left">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    {/* 신문부 전용 비밀번호 (위에 배치) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-[#D9A441] flex items-center gap-1">
                        🔑 신문부 전용 비밀번호 (선택)
                      </label>
                      <input
                        type="password"
                        value={googleNewspaperSecret}
                        onChange={(e) => setGoogleNewspaperSecret(e.target.value)}
                        placeholder="신문부 소속 학생(사진/인터뷰/지도교사)인 경우 입력하세요"
                        className="w-full text-xs py-2.5 px-3 bg-white border border-[#D9A441]/45 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D9A441]/10 focus:border-[#D9A441] transition-all font-mono"
                      />
                    </div>

                    {/* 교직원 비밀번호 (아래에 배치) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        🗝️ 교직원 전용 비밀번호 (선택)
                      </label>
                      <input
                        type="password"
                        value={googleTeacherSecret}
                        onChange={(e) => setGoogleTeacherSecret(e.target.value)}
                        placeholder="구글 로그인 예정인 선생님이신 경우 입력하세요"
                        className="w-full text-xs py-2.5 px-3 bg-white border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F] transition-all font-mono"
                      />
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-[10.5px] text-slate-500 leading-normal font-medium">
                      💡 선생님이나 신문부이면 지정된 비번을 입력 시 권한이 지급됩니다.
                    </div>

                    <button
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer disabled:opacity-50 border border-slate-700 font-sans"
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
                  </div>

                  <p className="text-[10.5px] text-center text-slate-500 mt-2 leading-relaxed">
                    ✓ 대구일마이스터고 구글 워크스페이스 계정 자동 연동
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
