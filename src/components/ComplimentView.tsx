import React, { useState } from 'react';
import { Compliment, User } from '../types';
import { addCompliment, deleteCompliment } from '../firebase';
import { Heart, Sparkles, Send, Trash2, Award, Users, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ComplimentViewProps {
  currentUser: User | null;
  compliments: Compliment[];
  onRefresh: () => void;
  onOpenLogin?: () => void;
}

export default function ComplimentView({ currentUser, compliments, onRefresh, onOpenLogin }: ComplimentViewProps) {
  // Form states
  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [senderRole, setSenderRole] = useState<'student' | 'teacher'>(currentUser?.role === 'teacher' ? 'teacher' : 'student');
  const [senderDept, setSenderDept] = useState(currentUser?.student_number || '');
  
  const [receiverName, setReceiverName] = useState('');
  const [receiverDept, setReceiverDept] = useState('');
  const [content, setContent] = useState('');
  
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Synchronize with logged-in user if available
  React.useEffect(() => {
    if (currentUser) {
      setSenderName(currentUser.name);
      setSenderRole(currentUser.role === 'teacher' ? 'teacher' : 'student');
      setSenderDept(currentUser.student_number || (currentUser.role === 'teacher' ? '교직부' : ''));
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !receiverName || !content) {
      alert('보내는 사람, 받는 사람, 칭찬 내용은 필수 입력 항목입니다.');
      return;
    }

    setLoading(true);
    try {
      await addCompliment({
        senderName: senderName.trim(),
        senderRole,
        senderDept: senderDept.trim() || (senderRole === 'teacher' ? '선생님' : '학생'),
        receiverName: receiverName.trim(),
        receiverDept: receiverDept.trim() || '대구일마이스터고',
        content: content.trim()
      });

      setIsSent(true);
      setReceiverName('');
      setReceiverDept('');
      setContent('');
      onRefresh();
      
      // Auto close form after successful submit
      setTimeout(() => {
        setIsSent(false);
        setShowForm(false);
      }, 2500);

    } catch (err) {
      console.error('Error adding compliment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 칭찬 글을 삭제하시겠습니까?')) return;
    try {
      await deleteCompliment(id);
      onRefresh();
    } catch (err) {
      console.error('Error deleting compliment:', err);
    }
  };

  return (
    <div id="compliment-relay-container" className="max-w-4xl mx-auto space-y-6">
      
      {/* 1. Header Banner Card */}
      <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-[#1E3A5F]/10 border border-rose-250/30 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Heart className="h-64 w-64 text-rose-500 fill-rose-500" />
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-xs font-bold text-rose-600 w-fit">
          <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500 animate-ping" />
          <span>온기 충전 칭찬 릴레이 🌸</span>
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
            따뜻한 말 한마디로 전하는 대구일마 미담 소식통
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-2xl font-semibold">
            사람이 하나의 소중한 책이 되는 곳! 대구일마이스터고 학생들과 선생님들이 서로를 아끼고 고마움을 표현하는 공간입니다.<br />
            <strong>학생과 선생님 누구라도 자유롭게 서로를 칭찬하고 미담을 등재하여 따뜻한 학교를 가꿔 갈 수 있습니다.</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3 bg-[#1E3A5F] hover:bg-[#152943] text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>{showForm ? '목록 보러 가기' : '칭찬글 보따리 풀기'}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          /* 2. Compliment Registration View */
          <motion.div
            key="compliment-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-rose-100 rounded-3xl p-6 md:p-8 shadow-xl space-y-6"
          >
            {isSent ? (
              <div className="py-12 text-center space-y-4">
                <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="h-9 w-9 fill-rose-50 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">칭찬 릴레이가 성공적으로 등록되었습니다!</h3>
                <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                  작성하신 따뜻한 고마움이 신문부 플랫폼의 실시간 릴레이에 반영되었습니다.<br />
                  세상을 밝히는 아름다운 소통에 동참해 주셔서 감사드립니다. 🌸
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center gap-3 border-b border-rose-50 pb-4">
                  <div className="p-2.5 rounded-xl bg-rose-50">
                    <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">칭찬 릴레이 띄우기</h3>
                    <p className="text-xs text-slate-400 mt-0.5">고마운 동료 학생, 사랑하는 선생님, 존경할 만한 우수 지적사항을 나누어주세요.</p>
                  </div>
                </div>

                {/* SENDER SELECTORS */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                  <span className="text-[11px] font-bold text-slate-500 block">칭찬을 전하는 소중한 분 (보낸 사람 정보)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">이름</label>
                      <input
                        type="text"
                        required
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F] bg-white bg-opacity-95"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">학생 / 선생님 구분</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSenderRole('student')}
                          className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                            senderRole === 'student'
                              ? 'bg-rose-500 text-white border-rose-500 font-semibold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          학생 독자
                        </button>
                        <button
                          type="button"
                          onClick={() => setSenderRole('teacher')}
                          className={`py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                            senderRole === 'teacher'
                              ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-semibold'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          교사 / 임직원
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">소속 학과 / 반 / 학부</label>
                      <input
                        type="text"
                        required
                        value={senderDept}
                        onChange={(e) => setSenderDept(e.target.value)}
                        placeholder={senderRole === 'teacher' ? '예: 교무부 주임교사' : '예: 2학년 스마트팩토리과 3반'}
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-[#1E3A5F] bg-white bg-opacity-95"
                      />
                    </div>
                  </div>
                </div>

                {/* RECEIVER SPECS */}
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/40 space-y-3.5">
                  <span className="text-[11px] font-bold text-amber-800 block">칭찬하고 싶은 주인공 (받는 사람 정보)</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1.5">칭찬 대상자 이름</label>
                      <input
                        type="text"
                        required
                        value={receiverName}
                        onChange={(e) => setReceiverName(e.target.value)}
                        placeholder="예: 배성준 학생 (또는 구대근 선생님)"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-rose-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1.5">대상자 학과 / 반 / 부서 (선택)</label>
                      <input
                        type="text"
                        value={receiverDept}
                        onChange={(e) => setReceiverDept(e.target.value)}
                        placeholder="예: 2학년 기계과 또는 2층 교무실 사서교사"
                        className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-200 focus:outline-rose-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* COMPLIMENT CONTENT TEXTAREA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">따뜻한 칭찬 상세 내용</label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="칭찬 대상자의 미담, 배려 넘쳤던 순간, 혹은 신문/사진촬영 기사 활동을 통해 큰 힘을 빌려준 사연을 훈훈하게 적어주세요."
                    className="w-full text-xs py-3 px-4 rounded-2xl border border-slate-200 focus:outline-rose-500 focus:border-rose-400 resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-2xl shadow-lg hover:shadow-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>{loading ? '릴레이 편지 발송 처리 중...' : '칭찬 릴레이 띄우기 🌸'}</span>
                </button>
              </form>
            )}
          </motion.div>
        ) : (
          /* 3. Compliment board list of cards */
          <motion.div
            key="compliment-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Users className="h-4 w-4 text-[#1E3A5F]" />
                <span>누적 등록된 온기: <strong className="text-rose-500 text-sm font-black">{compliments.length}</strong>개</span>
              </span>
              
              <button
                onClick={() => setShowForm(true)}
                className="text-[11.5px] text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>➕ 나도 칭찬글 쓰기</span>
              </button>
            </div>

            {compliments.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-sm space-y-3">
                <Heart className="h-10 w-10 text-slate-350 mx-auto fill-slate-50 animate-pulse" />
                <h4 className="text-sm font-bold text-slate-700">등록된 칭찬 릴레이가 아직 없습니다.</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  첫 번째 칭찬의 씨앗을 틔워보시는 건 어떨까요? <br />
                  학생이나 선생님, 우리 학교 구성원 누구든 작성 가능합니다!
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-2 py-2 px-4 bg-rose-500 hover:bg-rose-650 text-white text-[11px] font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  첫 칭찬글 작성하기 🌸
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {compliments.map((comp) => (
                  <motion.div
                    key={comp.id}
                    layoutId={`comp-${comp.id}`}
                    className="bg-white rounded-3xl border border-rose-100 p-5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-rose-400"
                  >
                    {/* Top corner design elements */}
                    <div className="absolute right-3 top-3 opacity-15 pointer-events-none">
                      {comp.senderRole === 'teacher' ? (
                        <Award className="h-10 w-10 text-amber-500 fill-amber-100" />
                      ) : (
                        <Heart className="h-10 w-10 text-rose-500 fill-rose-100" />
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Compliment Target Info */}
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-rose-50 rounded-xl text-rose-500">
                          <Award className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold leading-none">칭찬의 주인공</div>
                          <div className="text-xs font-black text-slate-805 mt-0.5">
                            {comp.receiverName} <span className="text-[10px] text-amber-800 font-semibold">({comp.receiverDept})</span>
                          </div>
                        </div>
                      </div>

                      {/* Compliment Message Box */}
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold whitespace-pre-wrap pl-1">
                        "{comp.content}"
                      </p>
                    </div>

                    {/* Sender & Meta details Footer */}
                    <div className="border-t border-rose-50/70 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <div>
                        <span className="text-slate-350">보낸 이: </span>
                        <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] mr-1 ${
                          comp.senderRole === 'teacher' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {comp.senderRole === 'teacher' ? '선생님' : '학생'}
                        </span>
                        <span className="text-slate-700 font-bold">{comp.senderName}</span>
                        <span className="text-slate-400 text-[9px] ml-1 font-mono">({comp.senderDept})</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[9px]">
                        <span>
                          {new Date(comp.createdAt).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {/* Admin or the sender can delete the compliment */}
                        {(currentUser?.role === 'admin' || currentUser?.role === 'librarian' || currentUser?.name === comp.senderName) && (
                          <button
                            onClick={() => handleDelete(comp.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            title="칭찬글 삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
